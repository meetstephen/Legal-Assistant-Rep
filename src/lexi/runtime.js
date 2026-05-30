// ============================================================
// lexi/runtime.js — brand label, internal build number, feature flags
//
// Brand vs build: the app presents itself everywhere as "LexiAssist 2.0".
// A precise internal build number is tracked here (__version__) for data
// records and debugging — it is intentionally NOT shown to users.
// ============================================================

export const BRAND_LABEL = 'LexiAssist 2.0';

// Internal build number (not surfaced in the UI).
export const __version__ = '2.0.0+react.1';

export const TAGLINE = 'AI legal workspace for Nigerian lawyers';

export const DISCLAIMER =
  'This content is AI-generated for workflow support and does not constitute ' +
  'legal advice. All statutes, rules, case citations, and authorities must be ' +
  'independently verified before reliance in court or in advice to clients. ' +
  'Limitation periods in Nigeria are governed largely by state-specific laws.';

// Default jurisdiction context applied across the workspace.
export const DEFAULT_JURISDICTION = 'Nigeria (Federal)';

// Server-proxy mode. When VITE_USE_PROXY="true" the app routes every Gemini
// call through the serverless function at /api/gemini, which injects the key
// from a server-side env var (GEMINI_API_KEY). The key then NEVER reaches the
// browser. When false (default), the app uses the user's own key (BYOK) stored
// locally — useful for local dev and personal use.
export const USE_PROXY =
  typeof import.meta !== 'undefined' &&
  import.meta.env &&
  import.meta.env.VITE_USE_PROXY === 'true';

// Optional Supabase config (multi-device cloud persistence). Present only when
// both env vars are set at build time.
export const SUPABASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || '';
export const SUPABASE_ANON_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || '';
export const SUPABASE_ENABLED = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

// Guarded feature flags — equivalent to runtime.py's guarded imports.
// These detect whether optional browser capabilities are present so the UI
// can degrade gracefully (e.g. document parsing libraries are loaded lazily).
export const FEATURES = {
  streaming: typeof ReadableStream !== 'undefined',
  fileApi: typeof FileReader !== 'undefined',
  clipboard:
    typeof navigator !== 'undefined' && !!navigator.clipboard,
};
