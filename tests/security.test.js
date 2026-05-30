import { describe, it, expect } from 'vitest';
import {
  hashPasscode,
  verifyPasscode,
  timingSafeEqual,
  registerFailure,
  resetLockout,
} from '../src/lexi/auth.js';

describe('PBKDF2 passcode hashing', () => {
  it('verifies a correct passcode and rejects a wrong one', async () => {
    const rec = await hashPasscode('correct horse battery');
    expect(rec.algo).toBe('PBKDF2-HMAC-SHA256');
    expect(rec.iterations).toBe(260000);
    expect(await verifyPasscode('correct horse battery', rec)).toBe(true);
    expect(await verifyPasscode('wrong', rec)).toBe(false);
  });

  it('uses a random salt (different hashes for same input)', async () => {
    const a = await hashPasscode('same');
    const b = await hashPasscode('same');
    expect(a.hash).not.toBe(b.hash);
  });
});

describe('timing-safe compare', () => {
  it('matches equal strings and rejects unequal', () => {
    expect(timingSafeEqual('abc', 'abc')).toBe(true);
    expect(timingSafeEqual('abc', 'abd')).toBe(false);
    expect(timingSafeEqual('abc', 'abcd')).toBe(false);
  });
});

describe('login rate limiting', () => {
  it('warns from attempt 3 and locks at 5', () => {
    let state = resetLockout();
    state = registerFailure(state); // 1
    state = registerFailure(state); // 2
    state = registerFailure(state); // 3
    expect(state.warning).toMatch(/attempt/);
    state = registerFailure(state); // 4
    state = registerFailure(state); // 5
    expect(state.lockedUntil).toBeGreaterThan(Date.now());
  });
});
