// ============================================================
// lexi/migrator.js — schema migrations for the local datastore
// ============================================================

import { storage } from './database.js';
import { SUPABASE_ENABLED } from './runtime.js';

const VERSION_KEY = 'schema-version';
export const CURRENT_SCHEMA = 4;

const MIGRATIONS = [
  {
    to: 1,
    run() {
      // v0 -> v1: ensure every case has a hearings array.
      const cases = storage.get('cases', []);
      if (Array.isArray(cases)) {
        storage.set('cases', cases.map((c) => ({ ...c, hearings: c.hearings || [] })));
      }
    },
  },
  {
    to: 2,
    run() {
      // v1 -> v2: ensure tasks have a status.
      const tasks = storage.get('tasks', []);
      if (Array.isArray(tasks)) {
        storage.set('tasks', tasks.map((t) => ({ ...t, status: t.status || 'todo' })));
      }
    },
  },
  {
    to: 3,
    run() {
      // v2 -> v3: set a bootstrap device passcode in LOCAL mode only.
      // In Supabase mode the device passcode is not the auth mechanism, so
      // setting a bootstrap passcode would cause a confusing "change your
      // passcode now" banner that is irrelevant to cloud users.
      if (!storage.get('app-lock', null) && !SUPABASE_ENABLED) {
        storage.set('app-lock', {
          salt: '6c657869617373697374626f6f747374',
          hash: 'bootstrap',
          iterations: 260000,
          algo: 'PBKDF2-HMAC-SHA256',
          isDefault: true,
        });
      }
    },
  },
  {
    to: 4,
    run() {
      // v3 -> v4: remove the bootstrap device passcode for Supabase users.
      // Migration 3 was run before the Supabase guard was added, so existing
      // cloud deployments may have the bootstrap passcode in localStorage.
      // Removing it silences the "change your passcode now" banner for users
      // who authenticate via Supabase and don't need a device passcode.
      if (SUPABASE_ENABLED) {
        const lock = storage.get('app-lock', null);
        if (lock && lock.isDefault) {
          storage.remove('app-lock');
          storage.remove('app-lock-attempts');
        }
      }

      // Also strip any legacy isAdmin field from the stored profile.
      // Admin status is now computed from the authenticated user's email
      // and must never be stored.
      const profile = storage.get('firm-profile', null);
      if (profile && 'isAdmin' in profile) {
        const { isAdmin: _removed, ...clean } = profile;
        storage.set('firm-profile', clean);
      }
    },
  },
];

export function runMigrations() {
  let current = Number(storage.get(VERSION_KEY, 0)) || 0;
  if (current >= CURRENT_SCHEMA) return { from: current, to: current, applied: 0 };
  let applied = 0;
  MIGRATIONS.forEach((m) => {
    if (m.to > current) {
      try {
        m.run();
        applied += 1;
      } catch (e) {
        console.error('Migration failed', m.to, e);
      }
    }
  });
  const from = current;
  storage.set(VERSION_KEY, CURRENT_SCHEMA);
  return { from, to: CURRENT_SCHEMA, applied };
}
