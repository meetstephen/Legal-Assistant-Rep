// ============================================================
// lexi/database.js — persistence layer
//
// Mirrors lexi/database.py + migrator.py from the README build. The Python
// build persists to PostgreSQL with per-user `u:{user_id}:` namespacing. This
// is a client-side SPA, so we implement the same contract over the browser's
// localStorage with a namespace prefix. To go multi-device, replace the body
// of `storage` with a REST/Supabase adapter — nothing else needs to change.
// ============================================================

const PREFIX = 'lexi2:';

export const STORAGE_KEYS = {
  CASES: 'cases',
  CLIENTS: 'clients',
  TASKS: 'tasks',
  TIME_ENTRIES: 'time-entries',
  ANALYSES: 'analyses',
  AI_HISTORY: 'ai-history',
  AI_USAGE: 'ai-usage',
  TEMPLATES: 'templates',
  MAXIMS: 'custom-maxims',
  AUDIT_LOG: 'audit-log',
  THEME: 'theme',
  API_KEY: 'gemini-key',
  MODEL: 'gemini-model',
  WEB_GROUNDING: 'web-grounding',
  PROFILE: 'firm-profile',
  ADMIN_CASES: 'admin-verified-cases',
  CHAT: 'chat-thread',
  APP_LOCK: 'app-lock',
  APP_LOCK_ATTEMPTS: 'app-lock-attempts',
  ADMIN_USERS: 'admin-users',
  FEEDBACK: 'feedback',
  ONBOARDING_DONE: 'onboarding-done',
};

export const storage = {
  get(key, fallback) {
    if (typeof window === 'undefined') return fallback;
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (e) {
       
      console.error('Storage write failed', e);
    }
  },
  remove(key) {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(PREFIX + key);
  },
  // Full export/import — mirrors the JSON backup/restore feature.
  exportAll() {
    const out = {};
    Object.values(STORAGE_KEYS).forEach((k) => {
      const v = storage.get(k, null);
      if (v !== null) out[k] = v;
    });
    return out;
  },
  importAll(obj = {}) {
    Object.entries(obj).forEach(([k, v]) => storage.set(k, v));
  },
};
