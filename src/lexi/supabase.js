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
export function onAuthChange(cb) {
  const sb = getSupabase();
  if (!sb) return () => {};
  const { data } = sb.auth.onAuthStateChange((_event, session) => cb(session?.user || null));
  return () => data?.subscription?.unsubscribe?.();
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
