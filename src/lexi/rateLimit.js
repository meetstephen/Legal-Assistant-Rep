// ============================================================
// lexi/rateLimit.js — client-side AI rate limiting (sliding window)
//
// Protects the shared key / quota by capping AI calls per-minute and per-day.
// The core decision function is pure (no I/O) so it is easy to test; the
// AppContext wraps it with localStorage-backed timestamp tracking.
// ============================================================

export const RATE_DEFAULTS = { perMinute: 12, perDay: 300 };

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

// Remove timestamps older than a day.
export function prune(times = [], now = Date.now()) {
  const cutoff = now - DAY;
  return times.filter((t) => t > cutoff);
}

// Pure decision: given prior call timestamps, may we make another call now?
// Returns { allowed, reason, retryAfterMs, remainingMinute, remainingDay }.
export function evaluateRateLimit(times = [], { perMinute = RATE_DEFAULTS.perMinute, perDay = RATE_DEFAULTS.perDay, now = Date.now() } = {}) {
  const recent = prune(times, now);
  const inMinute = recent.filter((t) => t > now - MINUTE);
  const inDay = recent;

  if (perMinute > 0 && inMinute.length >= perMinute) {
    const oldest = Math.min(...inMinute);
    return {
      allowed: false,
      scope: 'minute',
      reason: `Rate limit reached (${perMinute}/min). Please wait a moment and try again.`,
      retryAfterMs: Math.max(0, oldest + MINUTE - now),
      remainingMinute: 0,
      remainingDay: Math.max(0, perDay - inDay.length),
    };
  }
  if (perDay > 0 && inDay.length >= perDay) {
    const oldest = Math.min(...inDay);
    return {
      allowed: false,
      scope: 'day',
      reason: `Daily AI limit reached (${perDay}/day). It resets on a rolling 24-hour basis.`,
      retryAfterMs: Math.max(0, oldest + DAY - now),
      remainingMinute: Math.max(0, perMinute - inMinute.length),
      remainingDay: 0,
    };
  }
  return {
    allowed: true,
    scope: null,
    reason: '',
    retryAfterMs: 0,
    remainingMinute: Math.max(0, perMinute - inMinute.length - 1),
    remainingDay: Math.max(0, perDay - inDay.length - 1),
  };
}
