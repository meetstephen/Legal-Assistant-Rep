// ============================================================
// lexi/helpers.js — business logic helpers (mirrors helpers.py)
//
// Audit log (hash-chained), deadline + fee calculators, AI usage records,
// and CSV export utilities.
// ============================================================

import { estimateCost } from './ai.js';
import { CONVEYANCING_SCALE } from './legalData.js';

// ---- Hash-chained audit log -------------------------------------------------
// 17 event types, colour-coded in the viewer, chained so that retroactive
// tampering is detectable. Chain uses cyrb53 (fast, non-cryptographic) — strong
// enough to detect casual edits; swap for Web Crypto SHA-256 for a hardened build.
export const AUDIT_EVENTS = {
  LOGIN: { label: 'Login', color: 'emerald' },
  LOGIN_FAILED: { label: 'Login failed', color: 'red' },
  LOGOUT: { label: 'Logout', color: 'slate' },
  AI_QUERY: { label: 'AI query', color: 'blue' },
  AI_VERIFY: { label: 'Citation verify', color: 'violet' },
  DOC_UPLOAD: { label: 'Document upload', color: 'cyan' },
  EXPORT: { label: 'Export', color: 'amber' },
  CASE_CREATE: { label: 'Case created', color: 'emerald' },
  CASE_UPDATE: { label: 'Case updated', color: 'blue' },
  CASE_DELETE: { label: 'Case deleted', color: 'red' },
  CLIENT_CREATE: { label: 'Client created', color: 'emerald' },
  CLIENT_DELETE: { label: 'Client deleted', color: 'red' },
  TASK_CREATE: { label: 'Task created', color: 'emerald' },
  TASK_UPDATE: { label: 'Task updated', color: 'blue' },
  ANALYSIS_SAVE: { label: 'Analysis saved', color: 'violet' },
  SETTINGS_UPDATE: { label: 'Settings updated', color: 'amber' },
  BACKUP: { label: 'Backup / restore', color: 'cyan' },
};

export function cyrb53(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i += 1) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0');
}

export function appendAudit(log, type, detail = '') {
  const prev = log.length ? log[log.length - 1].hash : 'genesis';
  const entry = {
    id: `${Date.now()}-${log.length}`,
    ts: new Date().toISOString(),
    type,
    detail,
    prev,
  };
  entry.hash = cyrb53(`${entry.ts}|${entry.type}|${entry.detail}|${entry.prev}`);
  return [...log, entry];
}

export function verifyAuditChain(log) {
  let prev = 'genesis';
  for (let i = 0; i < log.length; i += 1) {
    const e = log[i];
    if (e.prev !== prev) return { ok: false, brokenAt: i };
    const h = cyrb53(`${e.ts}|${e.type}|${e.detail}|${e.prev}`);
    if (h !== e.hash) return { ok: false, brokenAt: i };
    prev = e.hash;
  }
  return { ok: true, brokenAt: -1 };
}

// ---- Deadline calculator ----------------------------------------------------
// Parses a period string like "6 years" / "3 months" / "3 years" / "1 year".
// Month/year additions clamp to end-of-month (e.g. 31 Jan + 3 months = 30 Apr,
// 29 Feb + 1 year = 28 Feb) — the correct behaviour for limitation deadlines.
export function computeDeadline(startDate, periodText) {
  const d = new Date(startDate);
  if (Number.isNaN(d.getTime())) return null;
  const m = /(\d+)\s*(day|week|month|year)/i.exec(periodText || '');
  if (!m) return null;
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  const out = new Date(d);
  if (unit === 'day') {
    out.setDate(out.getDate() + n);
  } else if (unit === 'week') {
    out.setDate(out.getDate() + n * 7);
  } else {
    const months = unit === 'year' ? n * 12 : n;
    const day = out.getDate();
    out.setDate(1);
    out.setMonth(out.getMonth() + months);
    const lastDay = new Date(out.getFullYear(), out.getMonth() + 1, 0).getDate();
    out.setDate(Math.min(day, lastDay));
  }
  return out;
}

// ---- Fee calculator ---------------------------------------------------------
export function computeProfessionalFee({ base = 0, vatRate = 7.5, whtRate = 5 }) {
  const vat = (base * vatRate) / 100;
  const wht = (base * whtRate) / 100;
  return {
    base,
    vat,
    wht,
    grossWithVat: base + vat,
    netAfterWht: base - wht,
    totalPayableInclVat: base + vat,
  };
}

export function conveyancingFee(consideration = 0) {
  const tier = CONVEYANCING_SCALE.find((t) => consideration <= t.upTo) || CONVEYANCING_SCALE[CONVEYANCING_SCALE.length - 1];
  const fee = (consideration * tier.rate) / 100;
  return { rate: tier.rate, fee };
}

// ---- AI usage record --------------------------------------------------------
export function buildUsageRecord({ model, usage, feature, grounded }) {
  const promptTokens = usage?.promptTokenCount || 0;
  const outputTokens = usage?.candidatesTokenCount || 0;
  const thoughtTokens = usage?.thoughtsTokenCount || 0;
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ts: new Date().toISOString(),
    model,
    feature,
    grounded: !!grounded,
    promptTokens,
    outputTokens,
    thoughtTokens,
    totalTokens: usage?.totalTokenCount || promptTokens + outputTokens + thoughtTokens,
    cost: estimateCost(model, usage),
  };
}

export function summariseUsage(records = []) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const acc = { today: 0, month: 0, all: 0, todayCost: 0, monthCost: 0, allCost: 0, calls: records.length };
  records.forEach((r) => {
    const t = new Date(r.ts).getTime();
    acc.all += r.totalTokens;
    acc.allCost += r.cost;
    if (t >= startOfMonth) {
      acc.month += r.totalTokens;
      acc.monthCost += r.cost;
    }
    if (t >= startOfDay) {
      acc.today += r.totalTokens;
      acc.todayCost += r.cost;
    }
  });
  return acc;
}

// ---- CSV --------------------------------------------------------------------
export function toCsv(rows, headers) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = headers.map((h) => esc(h.label)).join(',');
  const body = rows
    .map((r) => headers.map((h) => esc(typeof h.get === 'function' ? h.get(r) : r[h.key])).join(','))
    .join('\n');
  return `${head}\n${body}`;
}
