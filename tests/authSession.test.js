import { describe, it, expect, vi } from 'vitest';
import { stableSessionUser, watchAuthSession, authErrorMessage, signUpNotice } from '../src/lexi/authSession.js';

function deferred() { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; }
function harness(getUser) {
  let listener;
  const handlers = { onUser: vi.fn(), onRecovery: vi.fn(), onLoading: vi.fn(), onError: vi.fn() };
  const unsubscribe = vi.fn();
  const session = watchAuthSession({ getUser, subscribe: cb => { listener = cb; return unsubscribe; }, ...handlers });
  return { ...handlers, session, unsubscribe, emit: (user, event) => listener(user, event) };
}
const user = { id: 'one', email: 'one@example.test' };
describe('Session lifecycle regressions', () => {
  it('does not change user identity on token refresh and reload remote data over edits', () => {
    expect(stableSessionUser(user, { ...user, updated_at: 'new' })).toBe(user);
    expect(stableSessionUser(user, null)).toBe(null);
    expect(stableSessionUser(user, { id: 'two' })).not.toBe(user);
    expect(stableSessionUser(user, { ...user, email: 'changed@example.test' })).not.toBe(user);
  });
  it('restores a saved session before reporting loading complete', async () => {
    const d = deferred(), h = harness(() => d.promise);
    expect(h.onLoading).not.toHaveBeenCalled();
    d.resolve(user); await d.promise; await Promise.resolve();
    expect(h.onUser).toHaveBeenCalledWith(user);
    expect(h.onLoading).toHaveBeenCalledWith(false);
    h.session.dispose();
  });
  it('does not let a late bootstrap resurrect a signed-out session', async () => {
    const d = deferred(), h = harness(() => d.promise);
    h.emit(null, 'SIGNED_OUT'); d.resolve(user); await d.promise;
    expect(h.onUser).toHaveBeenCalledTimes(1);
    expect(h.onUser).toHaveBeenLastCalledWith(null);
    expect(h.onRecovery).toHaveBeenLastCalledWith(false);
    h.session.dispose();
  });
  it('does not let a stale session read overwrite a new sign-in', async () => {
    const d = deferred(), h = harness(() => d.promise);
    h.emit(user, 'SIGNED_IN'); d.resolve(null); await d.promise;
    expect(h.onUser).toHaveBeenCalledTimes(1);
    expect(h.onUser).toHaveBeenLastCalledWith(user);
    h.session.dispose();
  });
  it('preserves password recovery across token refresh and exits on logout', () => {
    const h = harness(() => new Promise(() => {}));
    h.emit(user, 'PASSWORD_RECOVERY'); h.emit(user, 'TOKEN_REFRESHED');
    expect(h.onRecovery).toHaveBeenLastCalledWith(true);
    h.emit(null, 'SIGNED_OUT'); expect(h.onRecovery).toHaveBeenLastCalledWith(false);
    h.session.dispose();
  });
  it('surfaces restoration failures without falsely declaring no session', async () => {
    const d = deferred(), h = harness(() => d.promise);
    d.reject(new Error('Network unavailable')); await d.promise.catch(() => {}); await Promise.resolve();
    expect(h.onError).toHaveBeenCalledWith('Network unavailable');
    expect(h.onUser).not.toHaveBeenCalled();
    h.session.dispose();
  });
  it('ignores events and reads after unmount', async () => {
    const d = deferred(), h = harness(() => d.promise); h.session.dispose();
    h.emit(user, 'SIGNED_IN'); d.resolve(user); await d.promise;
    expect(h.onUser).not.toHaveBeenCalled(); expect(h.unsubscribe).toHaveBeenCalledTimes(1);
  });
  it('handles invalid client configuration without crashing the auth effect', async () => {
    const error = vi.fn(); const h = watchAuthSession({ getUser: async () => { throw new Error('Invalid URL'); }, subscribe: () => { throw new Error('Invalid URL'); }, onUser: vi.fn(), onRecovery: vi.fn(), onLoading: vi.fn(), onError: error });
    await Promise.resolve(); expect(error).toHaveBeenCalledWith('Invalid URL'); h.dispose();
  });
  it('does not promise a new account exists for duplicate or confirmation-required signup responses', () => {
    expect(signUpNotice({ session: null })).toContain('if this address is eligible');
    expect(signUpNotice({ session: {} })).toBe('Signed in successfully.');
    expect(authErrorMessage({ code: 'email_not_confirmed' })).toContain('Confirm your email');
    expect(authErrorMessage({ message: 'Failed to fetch' })).toContain('Could not connect');
  });
});

