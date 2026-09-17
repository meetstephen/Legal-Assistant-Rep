import { it, expect } from 'vitest';
import { validDiaryDate, isReviewedDiaryDeadline, migrateDiaryMatters } from '../src/lexi/diarySafety.js';
it('rejects impossible dates', () => { expect(validDiaryDate('2024-02-29')).toBe(true); expect(validDiaryDate('2025-02-29')).toBe(false); });
it('preserves legacy dates without treating them as verified or overdue', () => {
  const original = [{ id: 'a', deadlines: [{ id: 'd', dueDate: '2020-01-01' }] }];
  const result = migrateDiaryMatters(original);
  expect(result[0].deadlines[0].dueDate).toBe(''); expect(result[0].deadlines[0].legacyDueDate).toBe('2020-01-01'); expect(original[0].deadlines[0].dueDate).toBe('2020-01-01');
});
it('requires an explicit review, jurisdiction, source and valid date', () => {
  const reviewed = { reviewedByCounsel: true, jurisdiction: 'Ebonyi High Court', source: 'Operative order and service date checked', dueDate: '2026-10-01' };
  expect(isReviewedDiaryDeadline(reviewed)).toBe(true); expect(isReviewedDiaryDeadline({ ...reviewed, source: '' })).toBe(false); expect(migrateDiaryMatters({})).toEqual([]);
});
