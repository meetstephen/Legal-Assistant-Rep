// ============================================================
// lexi/ncmsUtils.js — pure deadline/penalty/status calculations for NCMS
// compliance. No side effects — safe to unit test in isolation.
// ============================================================
import {
  PHASE_1_WINDOW,
  DEADLINE_RULES,
  FEES_AND_PENALTIES,
  COMPLIANCE_STATUS,
} from './ncmsData.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export function toDate(value) {
  if (value instanceof Date) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid date value: ${value}`);
  return d;
}

export function addDays(date, days) {
  return new Date(toDate(date).getTime() + days * DAY_MS);
}

export function addHours(date, hours) {
  return new Date(toDate(date).getTime() + hours * 60 * 60 * 1000);
}

export function daysBetween(from, to) {
  return Math.round((toDate(to).getTime() - toDate(from).getTime()) / DAY_MS);
}

export function isInPhase1(hearingDate) {
  const hearing = toDate(hearingDate);
  return hearing >= toDate(PHASE_1_WINDOW.start) && hearing <= toDate(PHASE_1_WINDOW.end);
}

export function calculateECopyDeadline(hearingDate) {
  return addDays(hearingDate, -DEADLINE_RULES.eCopyUploadDaysBeforeHearing);
}

export function calculateHardCopyDeadline(hearingDate) {
  const byDays = addDays(hearingDate, -DEADLINE_RULES.hardCopyDaysBeforeHearing);
  const byHours = addHours(hearingDate, -DEADLINE_RULES.hardCopyHoursBeforeHearing);
  return byDays < byHours ? byDays : byHours;
}

export function estimateAccruedPenalty(hearingDate, { uploaded, uploadDate, asOf = new Date() } = {}) {
  const deadline = calculateECopyDeadline(hearingDate);
  const referenceDate = uploaded && uploadDate ? toDate(uploadDate) : toDate(asOf);
  if (referenceDate <= deadline) return { daysLate: 0, amountNGN: 0 };
  const daysLate = daysBetween(deadline, referenceDate);
  return { daysLate, amountNGN: daysLate * FEES_AND_PENALTIES.dailyDefaultPenaltyNGN };
}

export function getComplianceStatus(appeal, now = new Date()) {
  const {
    hearingDate, eCopyUploaded, ocrCompliant, tocCompliant, hardCopyDelivered,
  } = appeal;

  if (!isInPhase1(hearingDate)) return COMPLIANCE_STATUS.NOT_YET_MANDATORY;

  const eCopyDeadline = calculateECopyDeadline(hearingDate);
  const hardCopyDeadline = calculateHardCopyDeadline(hearingDate);

  if (!eCopyUploaded) {
    if (now > eCopyDeadline) return COMPLIANCE_STATUS.OVERDUE;
    if (daysBetween(now, eCopyDeadline) <= 7) return COMPLIANCE_STATUS.AT_RISK;
    return COMPLIANCE_STATUS.ON_TRACK;
  }

  if (!ocrCompliant || !tocCompliant) return COMPLIANCE_STATUS.FORMAT_NON_COMPLIANT;

  if (!hardCopyDelivered) {
    if (now > hardCopyDeadline) return COMPLIANCE_STATUS.OVERDUE;
    return COMPLIANCE_STATUS.PENDING_HARD_COPY;
  }

  return COMPLIANCE_STATUS.COMPLIANT;
}

export function formatNGN(amount) {
  return `₦${Number(amount).toLocaleString('en-NG')}`;
}
