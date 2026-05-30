import { describe, it, expect } from 'vitest';
import {
  computeProfessionalFee,
  conveyancingFee,
  computeDeadline,
  appendAudit,
  verifyAuditChain,
  summariseUsage,
  buildUsageRecord,
} from '../src/lexi/helpers.js';
import { estimateCost } from '../src/lexi/ai.js';

describe('fee calculators', () => {
  it('computes VAT and WHT correctly', () => {
    const f = computeProfessionalFee({ base: 1000000, vatRate: 7.5, whtRate: 5 });
    expect(f.vat).toBe(75000);
    expect(f.wht).toBe(50000);
    expect(f.totalPayableInclVat).toBe(1075000);
    expect(f.netAfterWht).toBe(950000);
  });

  it('applies conveyancing tiers', () => {
    expect(conveyancingFee(500000).rate).toBe(10);
    expect(conveyancingFee(25000000).rate).toBe(5);
    expect(conveyancingFee(500000).fee).toBe(50000);
  });
});

describe('deadline calculator', () => {
  it('adds years to a start date', () => {
    const d = computeDeadline('2020-01-01', '6 years');
    expect(d.getFullYear()).toBe(2026);
  });
  it('adds months', () => {
    const d = computeDeadline('2020-01-31', '3 months');
    expect(d.getMonth()).toBe(3); // April (0-indexed)
  });
});

describe('hash-chained audit log', () => {
  it('builds an intact chain', () => {
    let log = [];
    log = appendAudit(log, 'AI_QUERY', 'one');
    log = appendAudit(log, 'EXPORT', 'two');
    expect(verifyAuditChain(log).ok).toBe(true);
  });

  it('detects tampering', () => {
    let log = [];
    log = appendAudit(log, 'AI_QUERY', 'one');
    log = appendAudit(log, 'EXPORT', 'two');
    log[0].detail = 'tampered';
    expect(verifyAuditChain(log).ok).toBe(false);
  });
});

describe('usage tracking', () => {
  it('estimates cost from token usage', () => {
    const usage = { promptTokenCount: 1000, candidatesTokenCount: 1000, thoughtsTokenCount: 0, totalTokenCount: 2000 };
    const cost = estimateCost('gemini-2.5-flash', usage);
    expect(cost).toBeGreaterThan(0);
    const rec = buildUsageRecord({ model: 'gemini-2.5-flash', usage, feature: 'test', grounded: true });
    expect(rec.totalTokens).toBe(2000);
    const sum = summariseUsage([rec]);
    expect(sum.all).toBe(2000);
    expect(sum.calls).toBe(1);
  });
});
