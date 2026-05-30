// ============================================================
// lexi/migrator.js — schema migrations for the local datastore
//
// Mirrors lexi/migrator.py. The Python build runs PostgreSQL migrations on
// first boot; here we version the browser datastore and run idempotent
// migrations so older saved data keeps working as the schema evolves.
// ============================================================

import { storage } from './database.js';

const VERSION_KEY = 'schema-version';
export const CURRENT_SCHEMA = 2;

// Each migration upgrades the store TO the given version.
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
      // v1 -> v2: ensure tasks have a status; default legacy tasks to "todo".
      const tasks = storage.get('tasks', []);
      if (Array.isArray(tasks)) {
        storage.set('tasks', tasks.map((t) => ({ ...t, status: t.status || 'todo' })));
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
