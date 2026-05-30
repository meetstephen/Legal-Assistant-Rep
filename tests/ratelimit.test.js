import { describe, it, expect } from 'vitest';
import { evaluateRateLimit, prune, RATE_DEFAULTS } from '../src/lexi/rateLimit.js';

const NOW = 1_000_000_000_000;
const SEC = 1000;
const MIN = 60 * SEC;

describe('rate limiter', () => {
  it('allows a call when under both limits', () => {
    const res = evaluateRateLimit([], { perMinute: 5, perDay: 100, now: NOW });
    expect(res.allowed).toBe(true);
    expect(res.remainingMinute).toBe(4);
  });

  it('blocks when the per-minute limit is reached', () => {
    const times = Array.from({ length: 5 }, (_, i) => NOW - i * SEC); // 5 within the last minute
    const res = evaluateRateLimit(times, { perMinute: 5, perDay: 100, now: NOW });
    expect(res.allowed).toBe(false);
    expect(res.scope).toBe('minute');
    expect(res.retryAfterMs).toBeGreaterThan(0);
    expect(res.retryAfterMs).toBeLessThanOrEqual(MIN);
  });

  it('allows again once the minute window passes', () => {
    const times = Array.from({ length: 5 }, (_, i) => NOW - MIN - i * SEC); // all older than a minute
    const res = evaluateRateLimit(times, { perMinute: 5, perDay: 100, now: NOW });
    expect(res.allowed).toBe(true);
  });

  it('blocks when the per-day limit is reached', () => {
    const times = Array.from({ length: 10 }, (_, i) => NOW - (i + 1) * 2 * MIN); // spread out, but 10 in the day
    const res = evaluateRateLimit(times, { perMinute: 50, perDay: 10, now: NOW });
    expect(res.allowed).toBe(false);
    expect(res.scope).toBe('day');
  });

  it('prune drops timestamps older than 24h', () => {
    const times = [NOW - 1000, NOW - 25 * 60 * 60 * 1000];
    expect(prune(times, NOW)).toEqual([NOW - 1000]);
  });

  it('exposes sane defaults', () => {
    expect(RATE_DEFAULTS.perMinute).toBeGreaterThan(0);
    expect(RATE_DEFAULTS.perDay).toBeGreaterThan(RATE_DEFAULTS.perMinute);
  });
});
