// ============================================================
// lexi/components/AuthGate.jsx — authentication wall
//
// Three layers, depending on configuration:
//   • Supabase configured  -> email login (password / magic link) + forgot
//     password + password-recovery (set new password) screen.
//   • Local passcode set    -> PBKDF2 device lock (rate-limited) — a login wall
//     even without a backend, mirroring the original's always-on login.
//   • Neither               -> transparent pass-through (local-only, no lock).
// ============================================================

import React, { useState } from 'react';
import { Scale, Loader2, Mail, KeyRound, LogIn, UserPlus, Sparkles, Lock, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useApp } from '../AppContext.jsx';
import { BRAND_LABEL, TAGLINE } from '../runtime.js';
import { Button, Input } from './ui.jsx';

function Shell({ children, subtitle }) {
  return (
    <div className="min-h-screen flex items-center justify-center lexi-app-bg px-4 py-10 safe-x safe-bottom safe-top">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-3">
            <Scale className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{BRAND_LABEL}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle || TAGLINE}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6">
          {children}
        </div>
        <p className="text-center text-xs text-slate-400 mt-5">
          Your workspace is isolated per user by row-level security. Sessions are encrypted in transit.
        </p>
      </div>
    </div>
  );
}

const MODES = {
  signin: { label: 'Sign in', cta: 'Sign in', icon: LogIn },
  signup: { label: 'Create account', cta: 'Create account', icon: UserPlus },
  magic: { label: 'Magic link', cta: 'Email me a link', icon: Sparkles },
};

function LoginScreen() {
  const { signIn, signUp, magicLink, requestPasswordReset, showToast } = useApp();
  const [mode, setMode] = useState('signin');
  const [forgot, setForgot] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setNotice('');
    try {
      if (forgot) {
        await requestPasswordReset(email.trim());
        setNotice('If that email has an account, a password-reset link is on its way.');
      } else if (mode === 'signin') {
        await signIn(email.trim(), password);
      } else if (mode === 'signup') {
        await signUp(email.trim(), password);
        setNotice('Account created. Check your email to confirm, then sign in.');
        setMode('signin');
      } else {
        await magicLink(email.trim());
        setNotice('Check your email for a sign-in link.');
      }
    } catch (err) {
      showToast('error', err.message || 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  };

  if (forgot) {
    return (
      <Shell subtitle="Reset your password">
        <form onSubmit={submit} className="space-y-4">
          <button type="button" onClick={() => { setForgot(false); setNotice(''); }} className="flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-600">
            <ArrowLeft className="w-4 h-4" /> Back to sign in
          </button>
          <p className="text-sm text-slate-500 dark:text-slate-400">Enter your email and we&apos;ll send a secure link to set a new password.</p>
          <Input label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@firm.com" leftIcon={<Mail className="w-4 h-4" />} required />
          <Button type="submit" className="w-full" size="lg" isLoading={busy} leftIcon={<Mail className="w-5 h-5" />}>Send reset link</Button>
          {notice && <p className="text-sm text-emerald-600 dark:text-emerald-400 text-center">{notice}</p>}
        </form>
      </Shell>
    );
  }

  const Icon = MODES[mode].icon;
  return (
    <Shell>
      <div className="flex gap-1 mb-5 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
        {Object.entries(MODES).map(([key, m]) => (
          <button key={key} onClick={() => { setMode(key); setNotice(''); }}
            className={`flex-1 text-sm font-medium rounded-lg py-1.5 transition-colors ${mode === key ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500'}`}>
            {m.label}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-4">
        <Input label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@firm.com" leftIcon={<Mail className="w-4 h-4" />} required />
        {mode !== 'magic' && (
          <Input label="Password" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" leftIcon={<KeyRound className="w-4 h-4" />} hint={mode === 'signup' ? 'At least 8 characters with a mix of letters and numbers.' : undefined} required />
        )}
        <Button type="submit" className="w-full" size="lg" isLoading={busy} leftIcon={<Icon className="w-5 h-5" />}>{MODES[mode].cta}</Button>
      </form>
      {mode === 'signin' && (
        <button onClick={() => { setForgot(true); setNotice(''); }} className="mt-3 w-full text-center text-sm text-slate-500 hover:text-emerald-600">
          Forgot your password?
        </button>
      )}
      {notice && <p className="mt-4 text-sm text-emerald-600 dark:text-emerald-400 text-center">{notice}</p>}
    </Shell>
  );
}

function UpdatePasswordScreen() {
  const { changePassword, showToast } = useApp();
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (pw.length < 8) { showToast('warning', 'Use at least 8 characters.'); return; }
    if (pw !== confirm) { showToast('warning', 'Passwords do not match.'); return; }
    setBusy(true);
    try {
      await changePassword(pw);
      showToast('success', 'Password updated. You are signed in.');
    } catch (err) {
      showToast('error', err.message || 'Could not update password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell subtitle="Set a new password">
      <form onSubmit={submit} className="space-y-4">
        <Input label="New password" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} leftIcon={<KeyRound className="w-4 h-4" />} hint="At least 8 characters." required />
        <Input label="Confirm new password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} leftIcon={<KeyRound className="w-4 h-4" />} required />
        <Button type="submit" className="w-full" size="lg" isLoading={busy} leftIcon={<ShieldCheck className="w-5 h-5" />}>Update password</Button>
      </form>
    </Shell>
  );
}

function LockScreen() {
  const { unlockWithPasscode } = useApp();
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!pin) return;
    setBusy(true);
    setMsg('');
    try {
      const r = await unlockWithPasscode(pin);
      if (r.ok) return;
      if (r.locked) {
        const mins = r.remainingMs ? Math.ceil(r.remainingMs / 60000) : 5;
        setMsg(`Too many attempts — locked. Try again in ~${mins} min.`);
      } else {
        setMsg(r.warning || 'Incorrect passcode.');
      }
      setPin('');
    } catch {
      setMsg('Could not verify passcode.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell subtitle="Enter your passcode to unlock">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Passcode" type="password" inputMode="numeric" autoFocus value={pin} onChange={(e) => setPin(e.target.value)} leftIcon={<Lock className="w-4 h-4" />} placeholder="••••••" required />
        <Button type="submit" className="w-full" size="lg" isLoading={busy} leftIcon={<LogIn className="w-5 h-5" />}>Unlock</Button>
        {msg && <p className="text-sm text-red-500 text-center">{msg}</p>}
      </form>
      <p className="mt-4 text-xs text-slate-400 text-center">Protected with PBKDF2-HMAC-SHA256 (260,000 iterations) and a 5-attempt lockout.</p>
    </Shell>
  );
}

export function AuthGate({ children }) {
  const { supabaseEnabled, authLoading, isAuthed, recovery, isLocked } = useApp();

  if (supabaseEnabled) {
    if (authLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      );
    }
    if (recovery) return <UpdatePasswordScreen />;
    if (!isAuthed) return <LoginScreen />;
  }

  if (isLocked) return <LockScreen />;

  return children;
}
