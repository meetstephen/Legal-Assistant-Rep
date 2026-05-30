// ============================================================
// api/gemini.js — Vercel Edge Function: secure Gemini proxy
//
// Keeps the Gemini API key SERVER-SIDE. The browser POSTs { model, action,
// body } here; this function injects process.env.GEMINI_API_KEY and forwards
// the request to Google, streaming the response straight back (so SSE token
// streaming still works). The key is never sent to or exposed in the client.
//
// Enable it by setting, in Vercel:
//   GEMINI_API_KEY   = <your key>        (Environment Variable, server-side)
//   VITE_USE_PROXY   = "true"            (Build-time, so the client uses /api/gemini)
// ============================================================

export const config = { runtime: 'edge' };

const GOOGLE = 'https://generativelanguage.googleapis.com/v1beta/models';

// Basic allow-list so the proxy can only be used for Gemini generation.
const ALLOWED_MODELS = new Set([
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
]);

// --- Best-effort per-IP rate limiting -------------------------------------
// Fixed 60s window kept in instance memory. This throttles a single abusive
// client per warm instance; for strong distributed limits across all edge
// regions, back this with Upstash Redis or a Supabase counter. Tune with the
// RATE_LIMIT_PER_MIN env var (0 disables).
const WINDOW_MS = 60_000;
const buckets = new Map();

function clientIp(req) {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

function rateLimit(ip, limit) {
  if (!limit || limit <= 0) return { limited: false };
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || now - b.start >= WINDOW_MS) {
    buckets.set(ip, { count: 1, start: now });
    return { limited: false };
  }
  b.count += 1;
  if (b.count > limit) {
    return { limited: true, retryAfter: Math.ceil((b.start + WINDOW_MS - now) / 1000) };
  }
  return { limited: false };
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return json({ error: 'Server is missing GEMINI_API_KEY' }, 500);
  }

  // Per-IP throttle (default 20/min; override with RATE_LIMIT_PER_MIN).
  const perMin = Number(process.env.RATE_LIMIT_PER_MIN ?? 20);
  const rl = rateLimit(clientIp(req), perMin);
  if (rl.limited) {
    return new Response(
      JSON.stringify({ error: `Server rate limit reached. Try again in ${rl.retryAfter}s.` }),
      { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rl.retryAfter) } }
    );
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { model, action, body } = payload || {};
  if (!model || !ALLOWED_MODELS.has(model)) {
    return json({ error: 'Unknown or disallowed model' }, 400);
  }
  if (action !== 'stream' && action !== 'generate') {
    return json({ error: 'Invalid action' }, 400);
  }
  if (!body || typeof body !== 'object') {
    return json({ error: 'Missing request body' }, 400);
  }

  const method = action === 'stream' ? 'streamGenerateContent' : 'generateContent';
  const qs = action === 'stream' ? `?alt=sse&key=${key}` : `?key=${key}`;
  const url = `${GOOGLE}/${model}:${method}${qs}`;

  let upstream;
  try {
    upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    return json({ error: `Upstream request failed: ${e.message}` }, 502);
  }

  // Pipe the upstream response (including the SSE stream) straight to the client.
  const contentType =
    action === 'stream' ? 'text/event-stream; charset=utf-8' : 'application/json; charset=utf-8';
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
    },
  });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
