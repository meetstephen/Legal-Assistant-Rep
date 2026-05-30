// ============================================================
// lexi/auth.js — optional local workspace lock (mirrors auth.py)
//
// The Python build does real server-side auth (PBKDF2-HMAC-SHA256, 260k
// iterations, timing-safe compare, 5-attempt lockout, server-side sessions).
// A browser SPA has no server, so this provides an OPTIONAL local passcode
// lock for the workspace on a shared machine, using the SAME primitives via
// Web Crypto: PBKDF2-HMAC-SHA256 @ 260,000 iterations + constant-time compare
// + a 5-attempt / 5-minute lockout. It is convenience security for a single
// device, NOT a substitute for server-side multi-user auth.
// ============================================================

const ITERATIONS = 260000;
const enc = new TextEncoder();

function buf2hex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function randomSaltHex() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return buf2hex(arr.buffer);
}

async function pbkdf2(password, saltHex) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const salt = Uint8Array.from(saltHex.match(/.{2}/g).map((h) => parseInt(h, 16)));
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return buf2hex(bits);
}

// Timing-safe string comparison (constant-time over equal lengths).
export function timingSafeEqual(a = '', b = '') {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function hashPasscode(passcode) {
  const salt = randomSaltHex();
  const hash = await pbkdf2(passcode, salt);
  return { salt, hash, iterations: ITERATIONS, algo: 'PBKDF2-HMAC-SHA256' };
}

export async function verifyPasscode(passcode, record) {
  if (!record?.salt || !record?.hash) return false;
  const hash = await pbkdf2(passcode, record.salt);
  return timingSafeEqual(hash, record.hash);
}

// 5-attempt / 5-minute lockout state machine.
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;

export function evaluateLockout(state = { attempts: 0, lockedUntil: 0 }) {
  const now = Date.now();
  if (state.lockedUntil && now < state.lockedUntil) {
    return { locked: true, remainingMs: state.lockedUntil - now, warning: '' };
  }
  return { locked: false, remainingMs: 0, warning: '' };
}

export function registerFailure(state = { attempts: 0, lockedUntil: 0 }) {
  const attempts = (state.attempts || 0) + 1;
  let lockedUntil = 0;
  let warning = '';
  if (attempts >= MAX_ATTEMPTS) {
    lockedUntil = Date.now() + LOCKOUT_MS;
    warning = 'Too many attempts — locked for 5 minutes.';
  } else if (attempts >= 3) {
    warning = `${MAX_ATTEMPTS - attempts} attempt(s) left before a 5-minute lockout.`;
  }
  return { attempts, lockedUntil, warning };
}

export function resetLockout() {
  return { attempts: 0, lockedUntil: 0 };
}
