export function validDiaryDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function isReviewedDiaryDeadline(deadline) {
  return Boolean(deadline?.reviewedByCounsel && String(deadline.source || '').trim() && String(deadline.jurisdiction || '').trim() && validDiaryDate(deadline.dueDate));
}
export function migrateDiaryMatters(stored) {
  if (!Array.isArray(stored)) return [];
  return stored.filter(item => item && typeof item === 'object').map(item => ({ ...item,
    deadlines: (Array.isArray(item.deadlines) ? item.deadlines : []).filter(Boolean).map(dl => isReviewedDiaryDeadline(dl) ? dl : ({ ...dl, legacyDueDate: dl.legacyDueDate || dl.dueDate, dueDate: '', reviewedByCounsel: false })),
  }));
}
