// ============================================================
// api/send-deadline-alerts.js — Vercel Edge Function: daily deadline digest
//
// Triggered once daily by Vercel Cron (see vercel.json). For every active
// user, checks their Court Diary for:
//   • Limitation deadlines that are OVERDUE or due within the next 7 days
//   • Hearings scheduled within the next 7 days
// and emails a digest via Resend if there's anything to report. Users with
// nothing upcoming are skipped entirely — no noise, no notification fatigue.
//
// This closes the gap the in-app Court Diary alerts have: they only help a
// lawyer who happens to open the app. A missed limitation deadline is one of
// the most common causes of legal malpractice liability, so this needs to
// reach the lawyer even if they never log in that week.
//
// Required Vercel Environment Variables (server-side only, no VITE_ prefix):
//   SUPABASE_URL              — already set (suspend-user.js uses this too)
//   SUPABASE_SERVICE_ROLE_KEY — already set
//   CRON_SECRET               — NEW. Generate: openssl rand -hex 32
//   RESEND_API_KEY            — NEW. From resend.com/api-keys
//   RESEND_FROM_EMAIL         — NEW. Must be on a domain verified in Resend,
//                                e.g. "LexiAssist <alerts@yourdomain.com>"
//
// Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` on every
// cron-triggered request — this is Vercel's own documented mechanism for
// proving a request genuinely came from Vercel Cron, not a random caller.
// ============================================================

import { LIMITATION_PERIODS } from '../src/lexi/courtData.js';

export const config = { runtime: 'edge' };

const DAY_MS = 86_400_000;
const ALERT_WINDOW_DAYS = 7;
const RESEND_COOLDOWN_MS = 20 * 60 * 60 * 1000; // 20h — guards against duplicate sends if cron fires twice
const TERMINAL_STATUSES = new Set(['judgment', 'settled', 'withdrawn', 'struck_out']);

// ── date helpers — mirrors CourtDiary.jsx exactly, so a matter shows the
//    same deadline here as it does in the app ────────────────────────────
function addDays(iso, n) {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}
function daysFrom(iso) {
  if (!iso) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(iso + 'T00:00:00'); target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / DAY_MS);
}
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-NG', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default async function handler(req) {
  const SUPABASE_URL   = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const SERVICE_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const CRON_SECRET    = process.env.CRON_SECRET || '';
  const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
  const RESEND_FROM    = process.env.RESEND_FROM_EMAIL || '';

  if (!SUPABASE_URL || !SERVICE_KEY || !CRON_SECRET || !RESEND_API_KEY || !RESEND_FROM) {
    return json({ error: 'Server misconfiguration: missing one or more required env vars.' }, 500);
  }

  // ── verify this request genuinely came from Vercel Cron ──────────────────
  const authHeader = req.headers.get('authorization') || '';
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const sbHeaders = {
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'apikey': SERVICE_KEY,
    'Content-Type': 'application/json',
  };

  // ── 1) fetch every active user ────────────────────────────────────────────
  let profiles;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?status=eq.active&select=id,email,name,last_deadline_alert_at`,
      { headers: sbHeaders }
    );
    if (!res.ok) throw new Error(`profiles fetch failed (${res.status})`);
    profiles = await res.json();
  } catch (e) {
    return json({ error: `Could not load profiles: ${e.message}` }, 502);
  }

  const results = { checked: 0, sent: 0, skippedCooldown: 0, skippedNoItems: 0, errors: [] };
  const now = Date.now();

  // ── 2) process each user independently — one failure must not sink the batch
  await Promise.all(profiles.map(async (profile) => {
    results.checked += 1;
    try {
      if (profile.last_deadline_alert_at) {
        const last = new Date(profile.last_deadline_alert_at).getTime();
        if (now - last < RESEND_COOLDOWN_MS) { results.skippedCooldown += 1; return; }
      }

      // Fetch this user's workspace blob — court-diary matters live inside it.
      const wsRes = await fetch(
        `${SUPABASE_URL}/rest/v1/workspaces?user_id=eq.${profile.id}&select=data`,
        { headers: sbHeaders }
      );
      if (!wsRes.ok) throw new Error(`workspace fetch failed (${wsRes.status})`);
      const wsRows = await wsRes.json();
      const matters = wsRows?.[0]?.data?.['court-diary'];
      if (!Array.isArray(matters) || matters.length === 0) { results.skippedNoItems += 1; return; }

      const active = matters.filter((m) => !TERMINAL_STATUSES.has(m.status));

      const overdueDeadlines = [];
      const upcomingDeadlines = [];
      const upcomingHearings = [];

      for (const m of active) {
        // Limitation deadline check
        if (m.causeOfActionId && m.actionAroseDate) {
          const period = LIMITATION_PERIODS.find((p) => p.id === m.causeOfActionId);
          if (period?.days) {
            const deadline = addDays(m.actionAroseDate, period.days);
            const days = daysFrom(deadline);
            if (days < 0) overdueDeadlines.push({ matter: m, period, deadline, days });
            else if (days <= ALERT_WINDOW_DAYS) upcomingDeadlines.push({ matter: m, period, deadline, days });
          }
        }
        // Hearing check
        if (m.nextHearingDate) {
          const days = daysFrom(m.nextHearingDate);
          if (days !== null && days >= 0 && days <= ALERT_WINDOW_DAYS) {
            upcomingHearings.push({ matter: m, days });
          }
        }
      }

      if (!overdueDeadlines.length && !upcomingDeadlines.length && !upcomingHearings.length) {
        results.skippedNoItems += 1;
        return;
      }

      const html = buildDigestHtml({ name: profile.name, overdueDeadlines, upcomingDeadlines, upcomingHearings });

      const sendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: RESEND_FROM,
          to: profile.email,
          subject: buildSubject({ overdueDeadlines, upcomingDeadlines, upcomingHearings }),
          html,
        }),
      });
      if (!sendRes.ok) {
        const errBody = await sendRes.text().catch(() => '');
        throw new Error(`Resend send failed (${sendRes.status}): ${errBody}`);
      }

      // Mark as alerted so a same-day duplicate cron run won't re-send.
      await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${profile.id}`, {
        method: 'PATCH',
        headers: { ...sbHeaders, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ last_deadline_alert_at: new Date().toISOString() }),
      });

      results.sent += 1;
    } catch (e) {
      results.errors.push({ userId: profile.id, error: e.message });
    }
  }));

  return json({ success: true, ...results });
}

function buildSubject({ overdueDeadlines, upcomingDeadlines, upcomingHearings }) {
  if (overdueDeadlines.length) {
    return `⚠️ URGENT: ${overdueDeadlines.length} overdue limitation deadline${overdueDeadlines.length > 1 ? 's' : ''} — LexiAssist`;
  }
  const total = upcomingDeadlines.length + upcomingHearings.length;
  return `LexiAssist: ${total} item${total > 1 ? 's' : ''} due this week`;
}

function buildDigestHtml({ name, overdueDeadlines, upcomingDeadlines, upcomingHearings }) {
  const row = (title, suitNo, dateLabel, detail, urgent) => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;">
        <div style="font-weight:600;color:#0f172a;">${escapeHtml(title || 'Untitled matter')}</div>
        ${suitNo ? `<div style="font-size:12px;color:#64748b;">${escapeHtml(suitNo)}</div>` : ''}
        <div style="font-size:13px;color:${urgent ? '#dc2626' : '#b45309'};font-weight:600;margin-top:4px;">${detail}</div>
        <div style="font-size:12px;color:#94a3b8;">${dateLabel}</div>
      </td>
    </tr>`;

  const overdueSection = overdueDeadlines.length ? `
    <h2 style="color:#dc2626;font-size:16px;margin:24px 0 8px;">⚠️ Overdue — act immediately</h2>
    <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;">
      ${overdueDeadlines.map(({ matter, period, deadline, days }) =>
        row(matter.title, matter.suitNo, fmtDate(deadline), `${period.label} — ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`, true)
      ).join('')}
    </table>` : '';

  const upcomingDeadlineSection = upcomingDeadlines.length ? `
    <h2 style="color:#b45309;font-size:16px;margin:24px 0 8px;">⏳ Limitation deadlines this week</h2>
    <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;">
      ${upcomingDeadlines.map(({ matter, period, deadline, days }) =>
        row(matter.title, matter.suitNo, fmtDate(deadline), `${period.label} — ${days === 0 ? 'due TODAY' : `${days} day${days === 1 ? '' : 's'} left`}`, days <= 2)
      ).join('')}
    </table>` : '';

  const hearingSection = upcomingHearings.length ? `
    <h2 style="color:#0f766e;font-size:16px;margin:24px 0 8px;">📅 Hearings this week</h2>
    <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;">
      ${upcomingHearings.map(({ matter, days }) =>
        row(matter.title, matter.suitNo, fmtDate(matter.nextHearingDate) + (matter.nextHearingTime ? ` · ${escapeHtml(matter.nextHearingTime)}` : ''), days === 0 ? 'TODAY' : `In ${days} day${days === 1 ? '' : 's'}`, days <= 1)
      ).join('')}
    </table>` : '';

  return `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#f8fafc;">
      <h1 style="font-size:20px;color:#0f172a;margin-bottom:4px;">Your Court Diary this week</h1>
      <p style="color:#64748b;font-size:14px;margin-top:0;">${name ? `Hi ${escapeHtml(name)},` : 'Hi,'} here's what needs your attention.</p>
      ${overdueSection}${upcomingDeadlineSection}${hearingSection}
      <p style="color:#94a3b8;font-size:12px;margin-top:28px;">
        Limitation periods in Nigeria are largely state-specific — always verify against the applicable
        State Limitation Law before relying on this deadline. Open LexiAssist to update or adjourn any matter.
      </p>
    </div>`;
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
