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

// Guarded feature flags — equivalent to runtime.py's guarded imports.
// These detect whether optional browser capabilities are present so the UI
// can degrade gracefully (e.g. document parsing libraries are loaded lazily).
export const FEATURES = {
  streaming: typeof ReadableStream !== 'undefined',
  fileApi: typeof FileReader !== 'undefined',
  clipboard:
    typeof navigator !== 'undefined' && !!navigator.clipboard,
};
