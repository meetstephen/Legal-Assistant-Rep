// ============================================================
// api/suspend-user.js — Vercel Edge Function: admin user suspension
//
// Uses SUPABASE_SERVICE_ROLE_KEY (server-side only) to call the Supabase
// Auth Admin API, which is the only way to truly ban/unban a user from
// signing in. The service-role key MUST NEVER go in the browser.
//
// Flow:
//   1. Client sends its own JWT in Authorization header
//   2. This function verifies the JWT → confirms caller is admin
//   3. Calls Supabase Auth Admin API to ban/unban the target user
//   4. Updates public.profiles.status so the UI reflects the change
//
// Required Vercel Environment Variables (Settings → Environment Variables):
//   SUPABASE_URL              = https://<ref>.supabase.co   (server-side)
//   SUPABASE_SERVICE_ROLE_KEY = <service_role key>          (server-side only — never VITE_)
// The caller's public.profiles.role is checked as the single admin source of truth.
//
// NOTE: VITE_ variables are build-time only and not accessible in Edge
// Functions at runtime. Set the above WITHOUT the VITE_ prefix.
// ============================================================

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  // ── Env vars ────────────────────────────────────────────────────────────────
  const SUPABASE_URL   = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const SERVICE_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return json({ error: 'Server misconfiguration: missing Supabase env vars.' }, 500);
  }

  // ── Step 1: Extract caller JWT from Authorization header ─────────────────
  const authHeader = req.headers.get('authorization') || '';
  const callerJwt  = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!callerJwt) return json({ error: 'Missing authorization token.' }, 401);

  // ── Step 2: Verify JWT + get caller identity via Supabase Auth ───────────
  let callerId;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${callerJwt}`,
        'apikey': SERVICE_KEY,
      },
    });
    if (!res.ok) return json({ error: 'Invalid or expired session. Please sign in again.' }, 401);
    const u = await res.json();
    callerId = u.id || '';
  } catch (e) {
    return json({ error: `Could not verify session: ${e.message}` }, 500);
  }

  // ── Step 3: Confirm caller is an administrator ───────────────────────────
  try {
    const roleUrl = SUPABASE_URL + '/rest/v1/profiles?id=eq.' + encodeURIComponent(callerId) + '&select=role';
    const roleRes = await fetch(roleUrl, {
      headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, apikey: SERVICE_KEY },
    });
    const profiles = await roleRes.json().catch(() => []);
    if (!roleRes.ok || profiles?.[0]?.role !== 'admin') {
      return json({ error: 'Admin access required.' }, 403);
    }
  } catch {
    return json({ error: 'Could not verify administrator access.' }, 503);
  }

  // ── Step 4: Parse and validate request body ───────────────────────────────
  let body;
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON body.' }, 400); }

  const { userId, action } = body || {};
  if (!userId || typeof userId !== 'string') {
    return json({ error: '`userId` is required.' }, 400);
  }
  if (!['suspend', 'activate'].includes(action)) {
    return json({ error: '`action` must be "suspend" or "activate".' }, 400);
  }

  // ── Step 5: Self-suspension guard (server-side mirror of client guard) ────
  if (userId === callerId) {
    return json({ error: 'You cannot suspend your own account.' }, 400);
  }

  // ── Step 6: Call Supabase Auth Admin API to ban / unban ──────────────────
  // ban_duration "876600h" ≈ 100 years (effectively permanent).
  // "none" removes the ban immediately.
  const banDuration = action === 'suspend' ? '876600h' : 'none';
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'apikey': SERVICE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ban_duration: banDuration }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return json({ error: err.message || `Supabase Auth API error (${res.status})` }, res.status);
    }
  } catch (e) {
    return json({ error: `Auth API request failed: ${e.message}` }, 502);
  }

  // ── Step 7: Update public.profiles status (cosmetic / UI sync) ───────────
  // Non-fatal: the real enforcement is the Auth ban above. This just keeps
  // the Admin panel status badge accurate.
  const newStatus = action === 'suspend' ? 'suspended' : 'active';
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'apikey': SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ status: newStatus }),
    });
  } catch {
    // Non-fatal — log silently. Auth ban is already enforced.
  }

  return json({ success: true, status: newStatus });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
