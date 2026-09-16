import { describe, it, expect } from 'vitest';
import { calculateVerifiedDeadline } from '../src/lexi/limitationSafety.js';
const inputs = { startDate: '2024-02-29', period: '1 year', jurisdiction: 'Ebonyi State', source: 'Counsel-checked operative instrument and section', confirmed: true };
describe('state-scoped limitation arithmetic', () => {
  it('clamps leap-day anniversaries using calendar years, not 365-day multiplication', () => {
    expect(calculateVerifiedDeadline(inputs).toISOString().slice(0, 10)).toBe('2025-02-28');
  });
  it.each([{ confirmed: false }, { jurisdiction: '' }, { jurisdiction: 'Other Nigerian State' }, { source: '' }, { period: '12 years (10 in Lagos)' }, { period: 'Varies' }, { period: '0 days' }, { startDate: '2024-02-31' }])('does not manufacture a deadline from incomplete or ambiguous inputs %j', patch => {
    expect(calculateVerifiedDeadline({ ...inputs, ...patch })).toBeNull();
  });
});

