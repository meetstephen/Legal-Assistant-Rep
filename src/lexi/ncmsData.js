// ============================================================
// lexi/ncmsData.js — NCMS Practice Directions 2026 reference data
//
// Supreme Court (Mandatory Upload of Electronic Copies of Processes, Record
// of Appeal, and Other Matters) Practice Directions, 2026, effective 1 July
// 2026, and the Nigeria Case Management System (NCMS).
//
// ⚠️ VERIFICATION NOTE
// The rollout itself (NCMS launch, mandatory e-upload, Phase 1 covering
// appeals set for hearing Sept–Dec 2026) is corroborated across multiple
// independent Nigerian news sources (Guardian, ThisDay, Vanguard, Daily
// Post, Tribune — July 2026). The FEE and PENALTY figures below (₦500,000 /
// ₦10,000 per day) and the NCMS portal URL were sourced from a single news
// summary and NOT independently corroborated. Verify both against the
// official Practice Directions PDF / courts.gov.ng before relying on them
// for client billing or advice. Fields marked `verified: false` are
// provisional — flip to true once you've checked the primary source.
// ============================================================

export const NCMS_PRACTICE_DIRECTION = {
  title:
    'Supreme Court (Mandatory Upload of Electronic Copies of Processes, Record of Appeal, and Other Matters) Practice Directions, 2026',
  effectiveDate: '2026-07-01',
  portalUrl: 'https://efiling.courts.gov.ng',
  portalUrlVerified: false,
  legalMailDomainHint: '@courts.gov.ng',
};

export const PHASE_1_WINDOW = {
  start: '2026-09-01',
  end: '2026-12-31',
  verified: true,
  description:
    'Appeals scheduled for hearing in this window must have electronic copies uploaded to the NCMS. Later phases absorb the remaining pending docket quarterly.',
};

export const DEADLINE_RULES = {
  eCopyUploadDaysBeforeHearing: 30,
  hardCopyDaysBeforeHearing: 7,
  hardCopyHoursBeforeHearing: 48,
  verified: true,
  note:
    'Hard-copy deadline is whichever of the two thresholds falls EARLIER in time — in practice this is almost always the 7-day mark.',
};

export const FEES_AND_PENALTIES = {
  recordOfAppealTransmissionFeeNGN: 500000,
  dailyDefaultPenaltyNGN: 10000,
  verified: false,
  disclaimer:
    'Sourced from a single news summary of the Practice Directions, not independently corroborated. Confirm against the official PDF before using for client billing.',
};

export const DOCUMENT_REQUIREMENTS = {
  ocrEnabledPdf: { label: 'OCR-enabled (searchable) PDF', required: true },
  hyperlinkedTableOfContents: { label: 'Hyperlinked table of contents', required: true },
  verified: true,
};

export const COMPLIANCE_STATUS = {
  NOT_YET_MANDATORY: { key: 'NOT_YET_MANDATORY', label: 'Not Yet Mandatory', color: 'slate' },
  ON_TRACK: { key: 'ON_TRACK', label: 'On Track', color: 'emerald' },
  AT_RISK: { key: 'AT_RISK', label: 'At Risk (≤7 days)', color: 'amber' },
  FORMAT_NON_COMPLIANT: { key: 'FORMAT_NON_COMPLIANT', label: 'Non-Compliant Format', color: 'amber' },
  PENDING_HARD_COPY: { key: 'PENDING_HARD_COPY', label: 'Hard Copy Pending', color: 'sky' },
  OVERDUE: { key: 'OVERDUE', label: 'Overdue', color: 'rose' },
  COMPLIANT: { key: 'COMPLIANT', label: 'Fully Compliant', color: 'green' },
};

export const STATUS_BADGE_CLASSNAME = {
  slate: 'bg-slate-100 text-slate-700 border border-slate-300',
  emerald: 'bg-emerald-100 text-emerald-700 border border-emerald-300',
  amber: 'bg-amber-100 text-amber-700 border border-amber-300',
  sky: 'bg-sky-100 text-sky-700 border border-sky-300',
  rose: 'bg-rose-100 text-rose-700 border border-rose-300',
  green: 'bg-green-100 text-green-700 border border-green-300',
};
