import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';
const context = vi.hoisted(() => ({ value: {} }));
vi.mock('../src/lexi/AppContext.jsx', () => ({ useApp: () => context.value }));
import { AuthGate } from '../src/lexi/components/AuthGate.jsx';
beforeEach(() => { context.value = { supabaseEnabled: true, authLoading: false, isAuthed: false }; });
const render = () => renderToStaticMarkup(<AuthGate><div>PRIVATE WORKSPACE</div></AuthGate>);
describe('Authentication wall rendering', () => {
  it('offers login, signup, magic link and password reset with browser autofill', () => {
    const html = render();
    for (const text of ['Log In', 'Sign Up', 'Magic Link', 'Forgot your password?', 'autocomplete="email"', 'autocomplete="current-password"']) expect(html.toLowerCase()).toContain(text.toLowerCase());
    expect(html).not.toContain('PRIVATE WORKSPACE');
  });
  it('hides private workspace until restoration finishes', () => {
    context.value.authLoading = true;
    expect(render()).not.toContain('PRIVATE WORKSPACE');
  });
  it('provides a visible retry action on restoration error', () => {
    context.value.authError = 'Failed to fetch';
    const html = render(); expect(html).toContain('role="alert"'); expect(html).toContain('Retry connection'); expect(html).not.toContain('PRIVATE WORKSPACE');
    context.value.isAuthed = true; expect(render()).toContain('Sign out');
  });
  it('offers an exit from authenticated password recovery', () => {
    context.value.isAuthed = true; context.value.recovery = true;
    const html = render(); expect(html).toContain('Confirm new password'); expect(html).toContain('Cancel and return to sign in'); expect(html).not.toContain('PRIVATE WORKSPACE');
  });
  it('does not trap signed-out users in the recovery screen', () => {
    context.value.recovery = true;
    expect(render()).toContain('Forgot your password?'); expect(render()).not.toContain('Update password');
  });
  it('does not show cached private data before this user workspace loads', () => {
    context.value.isAuthed = true; context.value.workspaceLoading = true;
    expect(render()).not.toContain('PRIVATE WORKSPACE');
    context.value.cloudStatus = 'error';
    const html = render(); expect(html).toContain('Retry workspace loading'); expect(html).toContain('Sign out'); expect(html).not.toContain('PRIVATE WORKSPACE');
  });
  it('shows the workspace only for authenticated users and fails closed for configuration errors', () => {
    context.value.isAuthed = true; expect(render()).toContain('PRIVATE WORKSPACE');
    context.value.authMisconfigured = true; expect(render()).not.toContain('PRIVATE WORKSPACE');
  });
});

