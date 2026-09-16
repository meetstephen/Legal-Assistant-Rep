import { describe, it, expect, vi, afterEach } from 'vitest';
const auth = vi.hoisted(() => ({ getSession: vi.fn(), signInWithPassword: vi.fn(), signUp: vi.fn(), signOut: vi.fn(), signInWithOtp: vi.fn(), resetPasswordForEmail: vi.fn(), updateUser: vi.fn() }));
vi.mock('../src/lexi/runtime.js', () => ({ SUPABASE_ENABLED: true, SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'public-test-key' }));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({ auth }) }));
import { signInWithPassword, signUpWithPassword, signOut, getSessionUser, sendPasswordReset, signInWithMagicLink, updatePassword } from '../src/lexi/supabase.js';
afterEach(() => { vi.clearAllMocks(); vi.unstubAllGlobals(); });
describe('Supabase auth result handling', () => {
  it('propagates rejected sign-out and uses current-session scope', async () => {
    auth.signOut.mockResolvedValue({ error: new Error('Network unavailable') });
    await expect(signOut()).rejects.toThrow('Network unavailable');
    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    auth.signOut.mockResolvedValue({ error: null }); await expect(signOut()).resolves.toBeUndefined();
  });
  it('surfaces SDK session errors, rather than treating them as logout', async () => {
    auth.getSession.mockResolvedValue({ data: {}, error: new Error('Restore failed') });
    await expect(getSessionUser()).rejects.toThrow('Restore failed');
  });
  it('returns confirmed sign-in and rejects incorrect credentials', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { user: { id: 'one' } }, error: null });
    await expect(signInWithPassword('one@example.test', 'password')).resolves.toEqual({ id: 'one' });
    auth.signInWithPassword.mockResolvedValue({ error: new Error('Invalid credentials') });
    await expect(signInWithPassword('one@example.test', 'wrong')).rejects.toThrow('Invalid credentials');
  });
  it('provides a production-origin confirmation redirect and preserves signup session info', async () => {
    vi.stubGlobal('window', { location: { origin: 'https://legal.example.test' } });
    auth.signUp.mockResolvedValue({ data: { user: { id: 'one' }, session: null }, error: null });
    const data = await signUpWithPassword(' one@example.test ', 'password');
    expect(data.session).toBe(null);
    expect(auth.signUp).toHaveBeenCalledWith({ email: 'one@example.test', password: 'password', options: { emailRedirectTo: 'https://legal.example.test' } });
  });
  it('sends reset and magic links to this app and surfaces expired recovery errors', async () => {
    vi.stubGlobal('window', { location: { origin: 'https://legal.example.test' } });
    auth.resetPasswordForEmail.mockResolvedValue({ error: null }); auth.signInWithOtp.mockResolvedValue({ error: null });
    await sendPasswordReset('one@example.test'); await signInWithMagicLink('one@example.test');
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith('one@example.test', { redirectTo: 'https://legal.example.test' });
    expect(auth.signInWithOtp).toHaveBeenCalledWith({ email: 'one@example.test', options: { emailRedirectTo: 'https://legal.example.test' } });
    auth.updateUser.mockResolvedValue({ error: new Error('Recovery expired') });
    await expect(updatePassword('newpassword')).rejects.toThrow('Recovery expired');
  });
});

