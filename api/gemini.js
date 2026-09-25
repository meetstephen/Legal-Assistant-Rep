// ============================================================
// api/gemini.js — Vercel Edge Function: authenticated Gemini proxy
// ============================================================

export const config = { runtime: 'edge' };

const GOOGLE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MAX_REQUEST_BYTES = 1_500_000;
const MAX_OUTPUT_TOKENS = 32_768;

const ALLOWED_MODELS = new Set([
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
]);

const WINDOW_MS = 60_000;
const buckets = new Map();
const UPSTASH_URL = (process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/$/, '');
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || '';

function clientIp(req) {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

function localRateLimit(identifier, limit) {
  if (!limit || limit <= 0) return { limited: false, backend: 'disabled' };
  const now = Date.now();
  const bucket = buckets.get(identifier);
  if (!bucket || now - bucket.start >= WINDOW_MS) {
    buckets.set(identifier, { count: 1, start: now });
    return { limited: false, backend: 'local' };
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return { limited: true, retryAfter: Math.ceil((bucket.start + WINDOW_MS - now) / 1000), backend: 'local' };
  }
  return { limited: false, backend: 'local' };
}

// A fixed-window counter in Upstash Redis is shared by every Vercel Edge
// instance. The local limiter remains a safe development/failure fallback.
async function rateLimit(identifier, limit) {
  if (!limit || limit <= 0) return { limited: false, backend: 'disabled' };
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return localRateLimit(identifier, limit);

  const now = Date.now();
  const windowId = Math.floor(now / WINDOW_MS);
  const key = `lexi:gemini:rate:${identifier}:${windowId}`;
  try {
    const increment = await fetch(UPSTASH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(['INCR', key]),
    });
    const count = Number((await increment.json()).result);
    if (!increment.ok || !Number.isFinite(count)) throw new Error('Invalid Upstash response');

    // Expiry only manages storage; windowId—not TTL—defines the quota window.
    fetch(UPSTASH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(['EXPIRE', key, 120]),
    }).catch(() => {});

    if (count > limit) {
      return {
        limited: true,
        retryAfter: Math.max(1, Math.ceil((((windowId + 1) * WINDOW_MS) - now) / 1000)),
        backend: 'upstash',
      };
    }
    return { limited: false, backend: 'upstash' };
  } catch {
    return localRateLimit(identifier, limit);
  }
}

function supabaseConfig() {
  return {
    url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  };
}

async function authenticate(req) {
  const { url, anonKey } = supabaseConfig();
  if (!url || !anonKey) return { ok: false, status: 503, error: 'Proxy authentication is not configured.' };

  const auth = req.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) return { ok: false, status: 401, error: 'Authentication required.' };

  try {
    const response = await fetch(`${url.replace(/\/$/, '')}/auth/v1/user`, {
      headers: { apikey: anonKey, Authorization: auth },
    });
    if (!response.ok) return { ok: false, status: 401, error: 'Your session is invalid or expired.' };
    const user = await response.json();
    return user?.id ? { ok: true, user } : { ok: false, status: 401, error: 'Invalid session.' };
  } catch {
    return { ok: false, status: 503, error: 'Could not verify your session.' };
  }
}

export default async function handler(req) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const key = process.env.GEMINI_API_KEY;
  if (!key) return json({ error: 'Server is missing GEMINI_API_KEY' }, 500);

  const auth = await authenticate(req);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const declaredSize = Number(req.headers.get('content-length') || 0);
  if (declaredSize > MAX_REQUEST_BYTES) return json({ error: 'Request is too large.' }, 413);

  const perMin = Number(process.env.RATE_LIMIT_PER_MIN ?? 20);
  const limited = await rateLimit(auth.user.id || clientIp(req), perMin);
  if (limited.limited) {
    return new Response(JSON.stringify({ error: `Server rate limit reached. Try again in ${limited.retryAfter}s.` }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': String(limited.retryAfter) },
    });
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  let requestBytes;
  try {
    requestBytes = new TextEncoder().encode(JSON.stringify(payload)).byteLength;
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }
  if (requestBytes > MAX_REQUEST_BYTES) return json({ error: 'Request is too large.' }, 413);

  const { model, action, body } = payload || {};
  if (!model || !ALLOWED_MODELS.has(model)) return json({ error: 'Unknown or disallowed model' }, 400);
  if (action !== 'stream' && action !== 'generate') return json({ error: 'Invalid action' }, 400);
  if (!body || typeof body !== 'object' || !Array.isArray(body.contents)) {
    return json({ error: 'A valid generation request is required.' }, 400);
  }
  if (Number(body.generationConfig?.maxOutputTokens || 0) > MAX_OUTPUT_TOKENS) {
    return json({ error: 'Requested output exceeds the server limit.' }, 400);
  }

  const method = action === 'stream' ? 'streamGenerateContent' : 'generateContent';
  const query = action === 'stream' ? `?alt=sse&key=${encodeURIComponent(key)}` : `?key=${encodeURIComponent(key)}`;
  let upstream;
  try {
    upstream = await fetch(`${GOOGLE}/${model}:${method}${query}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return json({ error: 'The AI provider could not be reached.' }, 502);
  }

  const headers = {
    'Content-Type': action === 'stream' ? 'text/event-stream; charset=utf-8' : 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  };
  const retryAfter = upstream.headers.get('retry-after');
  if (retryAfter) headers['Retry-After'] = retryAfter;
  return new Response(upstream.body, { status: upstream.status, headers });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
