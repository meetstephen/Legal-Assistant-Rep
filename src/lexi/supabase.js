// ============================================================
// lexi/supabase.js — Supabase client, auth, and per-user workspace sync
//
// Active only when VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are set at build
// time (SUPABASE_ENABLED). Provides email auth and reads/writes a single
// per-user JSONB row in public.workspaces (protected by Row Level Security —
// see supabase/schema.sql). When disabled, every function is a safe no-op so
// the app keeps working in local-only mode.
// ============================================================

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ENABLED, SUPABASE_URL, SUPABASE_ANON_KEY } from './runtime.js';

let _client = null;

export function getSupabase() {
  if (!SUPABASE_ENABLED) return null;
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }
  return _client;
}

export async function getSessionUser() {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data?.session?.user || null;
}

// Subscribe to auth changes; returns an unsubscribe function.
// Callback receives (user, event) so callers can detect PASSWORD_RECOVERY.
export function onAuthChange(cb) {
  const sb = getSupabase();
  if (!sb) return () => {};
  const { data } = sb.auth.onAuthStateChange((event, session) => cb(session?.user || null, event));
  return () => data?.subscription?.unsubscribe?.();
}

export async function sendPasswordReset(email) {
  const sb = getSupabase();
  if (!sb) throw new Error('Cloud sync is not configured.');
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
  });
  if (error) throw error;
  return true;
}

export async function updatePassword(newPassword) {
  const sb = getSupabase();
  if (!sb) throw new Error('Cloud sync is not configured.');
  const { error } = await sb.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return true;
}

export async function signInWithPassword(email, password) {
  const sb = getSupabase();
  if (!sb) throw new Error('Cloud sync is not configured.');
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signUpWithPassword(email, password) {
  const sb = getSupabase();
  if (!sb) throw new Error('Cloud sync is not configured.');
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithMagicLink(email) {
  const sb = getSupabase();
  if (!sb) throw new Error('Cloud sync is not configured.');
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined },
  });
  if (error) throw error;
  return true;
}

export async function signOut() {
  const sb = getSupabase();
  if (!sb) return;
  await sb.auth.signOut();
}

// ---- Workspace (one JSONB blob per user) -----------------------------------
export async function loadWorkspace(userId) {
  const sb = getSupabase();
  if (!sb || !userId) return null;
  const { data, error } = await sb
    .from('workspaces')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data?.data || null;
}

export async function saveWorkspace(userId, data) {
  const sb = getSupabase();
  if (!sb || !userId) return;
  const { error } = await sb
    .from('workspaces')
    .upsert({ user_id: userId, data, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) throw error;
}

// ---- Profiles (admin-visible user directory) --------------------------------
// Backed by public.profiles (see supabase/schema.sql). Separate from
// workspaces — holds only directory info (email, name, role, status, login
// times), never case/client data. RLS lets a user read/update their own row;
// admin emails (see schema.sql) can read/update every row.

// Returns every registered account. Empty array (not a throw) for non-admins,
// since RLS will simply return zero rows rather than erroring.
export async function loadAllProfiles() {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

// Call on every confirmed session so last_login stays fresh and a profile
// row exists even if the signup trigger somehow missed it (defense in depth).
export async function touchOwnProfile(userId, email) {
  const sb = getSupabase();
  if (!sb || !userId) return;
  const { error } = await sb
    .from('profiles')
    .upsert(
      { id: userId, email, last_login: new Date().toISOString() },
      { onConflict: 'id' }
    );
  if (error) console.error('touchOwnProfile failed', error);
}

// Lightweight self-status check, used to detect a mid-session suspension.
// Supabase access tokens remain valid until they naturally expire — banning
// a user does NOT invalidate a token already in the browser (this is
// documented Supabase/GoTrue behaviour: the access token is stateless and is
// only checked for expiry, never against the database, on each request).
// So an already-logged-in suspended user is NOT force-disconnected by the
// ban alone — this poll is what closes that gap on the client, backed by the
// workspaces RLS status check (see schema.sql) as the real data-access
// boundary in the meantime.
export async function getOwnStatus(userId) {
  const sb = getSupabase();
  if (!sb || !userId) return null;
  const { data, error } = await sb
    .from('profiles')
    .select('status')
    .eq('id', userId)
    .maybeSingle();
  if (error) { console.error('getOwnStatus failed', error); return null; }
  return data?.status || null;
}

// Admin-only. Routes through /api/suspend-user (server-side) which uses the
// Supabase service-role key to call the Auth Admin API — the only way to truly
// ban a user from signing in. The service-role key never touches the browser.
export async function setProfileStatus(id, status) {
  const sb = getSupabase();
  if (!sb) throw new Error('Cloud sync is not configured.');

  // Get the current admin's JWT to authenticate the server-side call.
  const { data: sessionData } = await sb.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) throw new Error('No active session. Please sign in again.');

  const action = status === 'suspended' ? 'suspend' : 'activate';

  const res = await fetch('/api/suspend-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ userId: id, action }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
