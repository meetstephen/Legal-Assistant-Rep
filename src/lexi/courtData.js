// ============================================================
// lexi/courtData.js — Nigerian courts, limitation periods,
//                     procedural deadline templates
// ============================================================

export const COURTS = [
  { id: 'supreme',          label: 'Supreme Court',                      short: 'SC'  },
  { id: 'coa',              label: 'Court of Appeal',                    short: 'CA'  },
  { id: 'fhc',              label: 'Federal High Court',                 short: 'FHC' },
  { id: 'high_court',       label: 'State High Court',                   short: 'HC'  },
  { id: 'nic',              label: 'National Industrial Court',           short: 'NIC' },
  { id: 'magistrate',       label: "Magistrate's Court",                 short: 'MC'  },
  { id: 'customary_appeal', label: 'Customary Court of Appeal',          short: 'CCA' },
  { id: 'sharia_appeal',    label: "Shari'a Court of Appeal",            short: 'SCA' },
  { id: 'ist',              label: 'Investment & Securities Tribunal',    short: 'IST' },
  { id: 'tat',              label: 'Tax Appeal Tribunal',                short: 'TAT' },
  { id: 'ccj',              label: 'Consumer Court',                     short: 'CCJ' },
];

// Limitation periods.  days = null means no fixed statutory period.
export const LIMITATION_PERIODS = [
  { id: 'simple_contract',    label: 'Simple contract',                                  days: 2190, years: 6,   law: 'Limitation Laws (State)' },
  { id: 'specialty_contract', label: 'Specialty contract (under seal / deed)',           days: 4380, years: 12,  law: 'Limitation Laws (State)' },
  { id: 'tort_general',       label: 'Tort — general',                                   days: 2190, years: 6,   law: 'Limitation Laws (State)' },
  { id: 'personal_injury',    label: 'Tort — personal injury',                           days: 1095, years: 3,   law: 'Limitation Laws (State)' },
  { id: 'defamation',         label: 'Defamation / libel / slander',                     days: 365,  years: 1,   law: 'Limitation Laws (most States)' },
  { id: 'recovery_land',      label: 'Recovery of land / title dispute',                 days: 4380, years: 12,  law: 'Limitation Laws (State)' },
  { id: 'recovery_rent',      label: 'Recovery of rent / arrears',                       days: 2190, years: 6,   law: 'Limitation Laws (State)' },
  { id: 'public_officer',     label: 'Action against public officer',                    days: 90,               law: 'Public Officers Protection Act (Cap P41 LFN 2004)', isPreAction: false, urgent: true },
  { id: 'govt_preaction',     label: 'Action against government (pre-action notice)',    days: 90,               law: 'State Government Proceedings Laws', isPreAction: true, urgent: true },
  { id: 'fundamental_rights', label: 'Fundamental rights enforcement',                   days: null,             law: 'FREP Rules 2009 — no fixed period; apply promptly', note: 'No fixed statutory period — courts apply equitable "reasonable time" test.' },
  { id: 'employment',         label: 'Employment / labour dispute',                      days: 1095, years: 3,   law: 'National Industrial Court Act 2006' },
  { id: 'election_petition',  label: 'Election petition (all tiers)',                    days: 21,               law: 'Electoral Act 2022 s.134', urgent: true },
  { id: 'probate',            label: 'Probate / estate administration',                  days: 4380, years: 12,  law: 'Limitation Laws (State)' },
  { id: 'tax_objection',      label: 'Tax assessment objection',                         days: 30,               law: 'FIRS Establishment Act / State Revenue Laws', urgent: true },
  { id: 'banker_customer',    label: 'Banker-customer dispute',                          days: 2190, years: 6,   law: 'Limitation Laws (State)' },
  { id: 'insurance_claim',    label: 'Insurance claim',                                  days: 365,  years: 1,   law: 'Insurance Act 2003' },
  { id: 'maritime',           label: 'Maritime / admiralty claim',                       days: 730,  years: 2,   law: 'Admiralty Jurisdiction Act 1991' },
  { id: 'mortgage',           label: 'Mortgage redemption / foreclosure',                days: 4380, years: 12,  law: 'Limitation Laws (State)' },
  { id: 'criminal_summary',   label: 'Criminal prosecution (summary offence)',           days: 730,  years: 2,   law: 'ACJA 2015 / ACJL (State)' },
  { id: 'company_oppression', label: 'Minority oppression / unfair prejudice',           days: null,             law: 'CAMA 2020 — equitable "reasonable time" applies', note: 'No fixed period; courts look at delay and prejudice.' },
  { id: 'chieftaincy',        label: 'Chieftaincy / title dispute',                      days: null,             law: 'State Chieftaincy Laws — varies by state', note: 'Check the specific State Chieftaincy Law for applicable limitation.' },
  { id: 'ndpc',               label: 'Data protection complaint (NDPC)',                 days: 365,  years: 1,   law: 'Nigeria Data Protection Act 2023, s.48' },
];

// Procedural deadline chains per court type.
// triggerEvent: human-readable name of the event that starts the clock.
// dueDays: number of days after the trigger event.
export const PROCEDURAL_TEMPLATES = {
  fhc: [
    { id: 'appearance',      label: 'Enter appearance',                      triggerEvent: 'Service of originating process',   dueDays: 8  },
    { id: 'defence',         label: 'File Statement of Defence',              triggerEvent: 'Entry of appearance',              dueDays: 30 },
    { id: 'reply',           label: 'File Reply / Defence to Counterclaim',   triggerEvent: 'Statement of Defence filed',       dueDays: 14 },
    { id: 'pre_trial',       label: 'Pre-trial conference',                   triggerEvent: 'Close of pleadings',               dueDays: 14 },
    { id: 'hearing_notice',  label: 'Take hearing notice for application',    triggerEvent: 'Motion filed',                     dueDays: 3  },
  ],
  high_court: [
    { id: 'appearance',      label: 'Enter appearance',                      triggerEvent: 'Service of originating process',   dueDays: 8  },
    { id: 'defence',         label: 'File Statement of Defence',              triggerEvent: 'Entry of appearance',              dueDays: 30 },
    { id: 'reply',           label: 'File Reply',                             triggerEvent: 'Statement of Defence filed',       dueDays: 14 },
    { id: 'hearing_notice',  label: 'Take hearing notice for application',    triggerEvent: 'Motion filed',                     dueDays: 3  },
  ],
  coa: [
    { id: 'notice',          label: 'File Notice of Appeal',                  triggerEvent: 'Judgment / ruling date',           dueDays: 90 },
    { id: 'record',          label: 'Request / receive record of proceedings', triggerEvent: 'Notice of appeal filed',          dueDays: 60 },
    { id: 'appellant_brief', label: "File Appellant's brief of argument",     triggerEvent: 'Record of proceedings received',   dueDays: 60 },
    { id: 'respondent_brief',label: "File Respondent's brief",                triggerEvent: "Appellant's brief served",        dueDays: 45 },
    { id: 'reply_brief',     label: "File Reply brief",                       triggerEvent: "Respondent's brief served",       dueDays: 14 },
  ],
  supreme: [
    { id: 'notice',          label: 'File Notice of Appeal (leave may be needed)', triggerEvent: 'Court of Appeal judgment',   dueDays: 90 },
    { id: 'record',          label: 'Record of proceedings compiled',         triggerEvent: 'Notice of appeal filed',           dueDays: 90 },
    { id: 'appellant_brief', label: "File Appellant's brief",                 triggerEvent: 'Record received',                 dueDays: 60 },
    { id: 'respondent_brief',label: "File Respondent's brief",                triggerEvent: "Appellant's brief served",        dueDays: 45 },
    { id: 'reply_brief',     label: "File Reply brief",                       triggerEvent: "Respondent's brief served",       dueDays: 14 },
  ],
  nic: [
    { id: 'appearance',      label: 'Enter appearance',                      triggerEvent: 'Service of originating process',   dueDays: 7  },
    { id: 'defence',         label: 'File Statement of Defence',              triggerEvent: 'Entry of appearance',              dueDays: 21 },
    { id: 'reply',           label: 'File Reply',                             triggerEvent: 'Statement of Defence filed',       dueDays: 14 },
  ],
  magistrate: [
    { id: 'first_hearing',   label: 'First hearing / mention',               triggerEvent: 'Filing of complaint / charge',     dueDays: 14 },
    { id: 'remand',          label: 'Remand / bail hearing (criminal)',       triggerEvent: 'Arraignment date',                 dueDays: 1  },
  ],
};

export const HEARING_TYPES = [
  'Mention / Status Conference',
  'Motion / Interlocutory Application',
  'Ruling on Application',
  'Pre-trial Conference',
  'Examination of Witness / Trial',
  'Final Address / Written Address',
  'Judgment',
  'Settlement / Negotiation',
  'Inspection / Discovery',
  'Bail Application / Review',
  'Arraignment',
  'Sentence',
];

export const ADJOURNMENT_REASONS = [
  'Court not sitting',
  'Judge unavailable / on vacation',
  'Hearing notice to be taken',
  'Parties to settle out of court',
  'Counsel unavailable',
  'Parties to file outstanding processes',
  'Witness not available',
  'Defendant yet to be served',
  'Awaiting ruling / judgment',
  'Part-heard (to continue)',
  'By consent of parties',
  'Conflict in court schedule',
  'Other',
];

export const MATTER_STATUSES = [
  { id: 'active',      label: 'Active',            color: 'emerald' },
  { id: 'adjourned',   label: 'Adjourned',         color: 'amber'   },
  { id: 'judgment',    label: 'Judgment Delivered', color: 'blue'   },
  { id: 'settled',     label: 'Settled',            color: 'violet' },
  { id: 'withdrawn',   label: 'Withdrawn',          color: 'slate'  },
  { id: 'struck_out',  label: 'Struck Out',         color: 'red'    },
  { id: 'on_appeal',   label: 'On Appeal',          color: 'cyan'   },
];

export const COUNSEL_ROLES = [
  "Claimant's counsel / Applicant's counsel",
  "Defendant's counsel / Respondent's counsel",
  "Appellant's counsel",
  "Respondent's counsel (appellate)",
  "Petitioner's counsel",
  "3rd Party / Intervener counsel",
  "Amicus Curiae",
];

export const NBA_ZONES = [
  'Lagos Branch', 'Abuja Branch (FCT)', 'Port Harcourt Branch',
  'Kano Branch', 'Ibadan Branch', 'Enugu Branch', 'Onitsha Branch',
  'Benin Branch', 'Kaduna Branch', 'Ilorin Branch', 'Other Branch',
];
