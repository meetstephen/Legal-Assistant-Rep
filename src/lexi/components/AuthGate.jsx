// ============================================================
// lexi/components/AuthGate.jsx — Supabase login wall
//
// When Supabase is configured, the app is gated behind email auth so each
// lawyer gets their own cloud-synced workspace. When Supabase is NOT
// configured, this is a transparent pass-through (local-only mode).
// ============================================================

import React, { useState } from 'react';
import { Scale, Loader2, Mail, KeyRound, LogIn, UserPlus, Sparkles } from 'lucide-react';
import { useApp } from '../AppContext.jsx';
import { BRAND_LABEL, TAGLINE } from '../runtime.js';
import { Button, Input } from './ui.jsx';

const MODES = {
  signin: { label: 'Sign in', cta: 'Sign in', icon: LogIn },
  signup: { label: 'Create account', cta: 'Create account', icon: UserPlus },
  magic: { label: 'Magic link', cta: 'Email me a link', icon: Sparkles },
};

function LoginScreen() {
  const { signIn, signUp, magicLink, showToast } = useApp();
  const [mode, setMode] = useState('signin');
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
      if (mode === 'signin') {
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

  const Icon = MODES[mode].icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-3">
            <Scale className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{BRAND_LABEL}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{TAGLINE}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex gap-1 mb-5 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            {Object.entries(MODES).map(([key, m]) => (
              <button
                key={key}
                onClick={() => { setMode(key); setNotice(''); }}
                className={`flex-1 text-sm font-medium rounded-lg py-1.5 transition-colors ${
                  mode === key ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@firm.com"
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />
            {mode !== 'magic' && (
              <Input
                label="Password"
                type="password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                leftIcon={<KeyRound className="w-4 h-4" />}
                hint={mode === 'signup' ? 'At least 6 characters.' : undefined}
                required
              />
            )}
            <Button type="submit" className="w-full" size="lg" isLoading={busy} leftIcon={<Icon className="w-5 h-5" />}>
              {MODES[mode].cta}
            </Button>
          </form>

          {notice && <p className="mt-4 text-sm text-emerald-600 dark:text-emerald-400 text-center">{notice}</p>}
        </div>

        <p className="text-center text-xs text-slate-400 mt-5">
          Your workspace syncs securely to your account. Data is isolated per user by row-level security.
        </p>
      </div>
    </div>
  );
}

export function AuthGate({ children }) {
  const { supabaseEnabled, authLoading, isAuthed } = useApp();

  if (!supabaseEnabled) return children; // local-only mode

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!isAuthed) return <LoginScreen />;

  return children;
}
