// ============================================================
// lexi/legalData.js — Nigerian legal reference data
//
// Powers the Tools tabs (Limitation Periods, Deadline Calculator, Court
// Hierarchy, Legal Maxims, AML/SCUML, Court Process Checklist), the Fee
// Calculator scales, and the default document templates.
//
// Reference data is provided for workflow support and MUST be independently
// verified against the applicable statute / rules in force.
// ============================================================

// ---- Limitation periods (general guide; state laws vary) -------------------
export const LIMITATION_PERIODS = [
  { cause: 'Simple contract', period: '6 years', basis: 'Limitation Law (most states) / Limitation Act', note: 'Runs from accrual of the cause of action (breach).' },
  { cause: 'Debt / quasi-contract', period: '6 years', basis: 'Limitation Law', note: 'Fresh acknowledgement of debt can restart time.' },
  { cause: 'Tort (general)', period: '6 years', basis: 'Limitation Law', note: 'From when damage is suffered.' },
  { cause: 'Recovery of land', period: '12 years (10 in Lagos)', basis: 'Limitation Law', note: 'Adverse possession; periods differ by state.' },
  { cause: 'Defamation', period: '3 years', basis: 'Limitation Law', note: 'Some states differ; confirm locally.' },
  { cause: 'Action against a public officer', period: '3 months', basis: 'Public Officers Protection Act, s.2(a)', note: 'Continuing-injury and bad-faith exceptions may apply.' },
  { cause: 'Personal injury / negligence', period: '3 years', basis: 'Limitation Law (varies)', note: 'Discoverability can affect accrual.' },
  { cause: 'Recovery of rent / arrears', period: '6 years', basis: 'Limitation Law', note: '—' },
  { cause: 'Judgment enforcement', period: '6 years (leave needed after 6)', basis: 'Sheriffs & Civil Process Act / Rules', note: 'Leave of court required to execute after 6 years.' },
  { cause: 'Admiralty (carriage of goods by sea)', period: '1 year', basis: 'Hague-Visby / COGSA', note: 'Strict; verify the bill of lading regime.' },
  { cause: 'Tax assessment dispute', period: 'Varies (often 30 days to object)', basis: 'CITA / FIRS Establishment Act', note: 'Statutory objection windows are short.' },
];

// ---- Court hierarchy --------------------------------------------------------
export const COURT_HIERARCHY = [
  { level: 1, name: 'Supreme Court of Nigeria', note: 'Apex court; final appellate jurisdiction; original jurisdiction in disputes between the Federation and States.' },
  { level: 2, name: 'Court of Appeal', note: 'Intermediate appellate court; exclusive jurisdiction over presidential/governorship election petitions (governorship at the tribunal first).' },
  { level: 3, name: 'Federal High Court / High Court of a State / FCT High Court / National Industrial Court / Sharia & Customary Courts of Appeal', note: 'Superior courts of record of coordinate (not identical) jurisdiction.' },
  { level: 4, name: 'Magistrates’ / District Courts · Customary / Area Courts · Sharia Courts', note: 'Inferior courts of limited jurisdiction; jurisdiction set by state law.' },
];

export const SPECIAL_COURT_NOTES = [
  'National Industrial Court (NIC): exclusive jurisdiction over labour, employment, trade union and related matters (s.254C, Constitution).',
  'Federal High Court: exclusive jurisdiction over federal revenue, admiralty, company/CAMA, banking, IP, immigration, and federal agency matters (s.251).',
  'Election tribunals: National/State Houses of Assembly and Governorship Election Petition Tribunals at first instance.',
];

// ---- Legal maxims -----------------------------------------------------------
export const LEGAL_MAXIMS = [
  { latin: 'Audi alteram partem', meaning: 'Hear the other side — the right to a fair hearing.' },
  { latin: 'Nemo judex in causa sua', meaning: 'No one should be a judge in their own cause.' },
  { latin: 'Ubi jus ibi remedium', meaning: 'Where there is a right, there is a remedy.' },
  { latin: 'Res ipsa loquitur', meaning: 'The thing speaks for itself (negligence inferred).' },
  { latin: 'Volenti non fit injuria', meaning: 'To a willing person, no injury is done.' },
  { latin: 'Actus non facit reum nisi mens sit rea', meaning: 'An act is not guilty unless the mind is also guilty.' },
  { latin: 'Ignorantia juris non excusat', meaning: 'Ignorance of the law is no excuse.' },
  { latin: 'Nemo dat quod non habet', meaning: 'No one gives what they do not have.' },
  { latin: 'Caveat emptor', meaning: 'Let the buyer beware.' },
  { latin: 'Ex turpi causa non oritur actio', meaning: 'No action arises from a dishonourable cause.' },
  { latin: 'Pacta sunt servanda', meaning: 'Agreements must be kept.' },
  { latin: 'Stare decisis', meaning: 'To stand by decided cases (binding precedent).' },
  { latin: 'Res judicata', meaning: 'A matter already adjudged cannot be relitigated.' },
  { latin: 'Functus officio', meaning: 'Having discharged duty; no further authority to act.' },
  { latin: 'Locus standi', meaning: 'The right/standing to bring an action.' },
  { latin: 'Ratio decidendi', meaning: 'The reason/legal principle for a decision.' },
  { latin: 'Obiter dictum', meaning: 'A remark said in passing; not binding.' },
  { latin: 'Sub judice', meaning: 'Under judicial consideration; not to be discussed publicly.' },
  { latin: 'Ex parte', meaning: 'On behalf of one party only (without notice to the other).' },
  { latin: 'Mutatis mutandis', meaning: 'With the necessary changes having been made.' },
];

// ---- AML / SCUML compliance -------------------------------------------------
export const AML_THRESHOLDS = [
  { item: 'Cash transaction reporting (individuals)', threshold: '₦5,000,000', basis: 'Money Laundering (Prevention & Prohibition) Act 2022' },
  { item: 'Cash transaction reporting (body corporate)', threshold: '₦10,000,000', basis: 'MLPPA 2022' },
  { item: 'Currency transaction report to NFIU', threshold: 'Above the limits above', basis: 'NFIU Regulations' },
  { item: 'Lawyers as DNFBPs — SCUML registration', threshold: 'Where engaging in covered activities', basis: 'SCUML / MLPPA 2022' },
];

export const AML_RED_FLAGS = [
  'Client reluctant to provide identity (KYC) information.',
  'Funds routed through multiple unrelated third parties or jurisdictions.',
  'Transaction lacks an obvious lawful economic or legal purpose.',
  'Use of cash for high-value transactions where banking is normal.',
  'Unexplained urgency or willingness to overpay fees.',
  'Politically Exposed Person (PEP) without clear source of funds.',
];

// ---- Court Process Checklist matrix ----------------------------------------
export const MATTER_TYPES = [
  'Civil claim (writ of summons)', 'Originating summons', 'Fundamental rights enforcement',
  'Judicial review / certiorari', 'Winding up / insolvency', 'Land / declaration of title',
  'Recovery of premises', 'Matrimonial cause (divorce)', 'Probate / letters of administration',
  'Criminal charge / information', 'Election petition', 'Labour / employment (NIC)',
  'Appeal', 'Garnishee proceedings', 'Bail application',
];

export const COURTS = [
  'Supreme Court', 'Court of Appeal', 'Federal High Court', 'High Court of a State',
  'FCT High Court', 'National Industrial Court', 'Sharia Court of Appeal',
  'Customary Court of Appeal', 'Magistrate Court', 'Customary/Area Court',
  'Election Petition Tribunal', 'Code of Conduct Tribunal', 'Investments & Securities Tribunal',
];

export const STATE_RULES = [
  'Federal (FHC/NIC Rules)', 'Lagos', 'FCT Abuja', 'Rivers', 'Kano', 'Oyo',
  'Enugu', 'Kaduna', 'Delta', 'Anambra', 'Ogun',
];

// ---- All 36 states + FCT, by geopolitical zone (South-East emphasised) ------
export const NIGERIAN_STATES = [
  // South East
  { name: 'Abia', zone: 'South East', capital: 'Umuahia' },
  { name: 'Anambra', zone: 'South East', capital: 'Awka' },
  { name: 'Ebonyi', zone: 'South East', capital: 'Abakaliki' },
  { name: 'Enugu', zone: 'South East', capital: 'Enugu' },
  { name: 'Imo', zone: 'South East', capital: 'Owerri' },
  // South South
  { name: 'Akwa Ibom', zone: 'South South', capital: 'Uyo' },
  { name: 'Bayelsa', zone: 'South South', capital: 'Yenagoa' },
  { name: 'Cross River', zone: 'South South', capital: 'Calabar' },
  { name: 'Delta', zone: 'South South', capital: 'Asaba' },
  { name: 'Edo', zone: 'South South', capital: 'Benin City' },
  { name: 'Rivers', zone: 'South South', capital: 'Port Harcourt' },
  // South West
  { name: 'Ekiti', zone: 'South West', capital: 'Ado-Ekiti' },
  { name: 'Lagos', zone: 'South West', capital: 'Ikeja' },
  { name: 'Ogun', zone: 'South West', capital: 'Abeokuta' },
  { name: 'Ondo', zone: 'South West', capital: 'Akure' },
  { name: 'Osun', zone: 'South West', capital: 'Oshogbo' },
  { name: 'Oyo', zone: 'South West', capital: 'Ibadan' },
  // North Central
  { name: 'Benue', zone: 'North Central', capital: 'Makurdi' },
  { name: 'Kogi', zone: 'North Central', capital: 'Lokoja' },
  { name: 'Kwara', zone: 'North Central', capital: 'Ilorin' },
  { name: 'Nasarawa', zone: 'North Central', capital: 'Lafia' },
  { name: 'Niger', zone: 'North Central', capital: 'Minna' },
  { name: 'Plateau', zone: 'North Central', capital: 'Jos' },
  { name: 'FCT (Abuja)', zone: 'North Central', capital: 'Abuja' },
  // North East
  { name: 'Adamawa', zone: 'North East', capital: 'Yola' },
  { name: 'Bauchi', zone: 'North East', capital: 'Bauchi' },
  { name: 'Borno', zone: 'North East', capital: 'Maiduguri' },
  { name: 'Gombe', zone: 'North East', capital: 'Gombe' },
  { name: 'Taraba', zone: 'North East', capital: 'Jalingo' },
  { name: 'Yobe', zone: 'North East', capital: 'Damaturu' },
  // North West
  { name: 'Jigawa', zone: 'North West', capital: 'Dutse' },
  { name: 'Kaduna', zone: 'North West', capital: 'Kaduna' },
  { name: 'Kano', zone: 'North West', capital: 'Kano' },
  { name: 'Katsina', zone: 'North West', capital: 'Katsina' },
  { name: 'Kebbi', zone: 'North West', capital: 'Birnin Kebbi' },
  { name: 'Sokoto', zone: 'North West', capital: 'Sokoto' },
  { name: 'Zamfara', zone: 'North West', capital: 'Gusau' },
];

export const GEO_ZONES = ['South East', 'South South', 'South West', 'North Central', 'North East', 'North West'];

// Jurisdiction options used across the app (Federal first, then every state).
export const JURISDICTIONS = ['Nigeria (Federal)', ...NIGERIAN_STATES.map((s) => `${s.name} State`)];

// Per-state High Court Civil Procedure Rules baseline. Years are given only
// where well established; everything must be confirmed against the CURRENT
// edition and any standalone Practice Directions (use the live fetch in Tools).
export const STATE_COURT_RULES = {
  Lagos: 'High Court of Lagos State (Civil Procedure) Rules 2019 — heavy frontloading; mandatory pre-action protocol and ADR (LMDC).',
  'FCT (Abuja)': 'High Court of the FCT (Civil Procedure) Rules 2018 — frontloading; pre-action counselling certificate.',
  Anambra: 'Anambra State High Court (Civil Procedure) Rules 2019 — frontloading; ADR screening.',
  Enugu: 'Enugu State High Court (Civil Procedure) Rules — confirm current edition; frontloading and Multi-Door Courthouse referral.',
  Imo: 'Imo State High Court (Civil Procedure) Rules — confirm current edition.',
  Abia: 'Abia State High Court (Civil Procedure) Rules — confirm current edition.',
  Ebonyi: 'Ebonyi State High Court (Civil Procedure) Rules — confirm current edition.',
  Rivers: 'Rivers State High Court (Civil Procedure) Rules 2010 — confirm current edition.',
  Oyo: 'Oyo State High Court (Civil Procedure) Rules 2010 — confirm current edition.',
  Kano: 'Kano State High Court (Civil Procedure) Rules — confirm current edition.',
  Kaduna: 'Kaduna State High Court (Civil Procedure) Rules 2007 — confirm current edition.',
  Delta: 'Delta State High Court (Civil Procedure) Rules 2009 — confirm current edition.',
  Ogun: 'Ogun State High Court (Civil Procedure) Rules — confirm current edition.',
};

// ---- Rules of Professional Conduct for Legal Practitioners 2007 -------------
// Curated key rules (paraphrased). Confirm exact wording against the RPC 2007.
export const RULES_OF_PROFESSIONAL_CONDUCT = [
  { rule: 'Rule 1', title: 'General responsibility', summary: 'A lawyer shall uphold and observe the rule of law, promote and foster the cause of justice, maintain a high standard of professional conduct, and not engage in any conduct unbecoming of a legal practitioner.' },
  { rule: 'Rule 3', title: 'Aiding unauthorised practice', summary: 'A lawyer shall not aid or abet a non-lawyer in the unauthorised practice of the law.' },
  { rule: 'Rule 14', title: 'Dedication and devotion to the client', summary: 'A lawyer shall devote his attention, energy and expertise to the service of his client and, subject to any rule of law, act in a manner consistent with the best interest of the client.' },
  { rule: 'Rule 15', title: 'Representing client within the law', summary: 'A lawyer shall represent the client within the bounds of the law; not file a suit, assert a position, or take steps merely to harass or injure another; and not knowingly advance a fact he knows to be false.' },
  { rule: 'Rule 16', title: 'Representing client competently', summary: 'A lawyer shall not handle a matter he knows he is not competent to handle without associating a competent lawyer, nor neglect a legal matter entrusted to him.' },
  { rule: 'Rule 17', title: 'Conflict of interest', summary: 'A lawyer shall not represent conflicting interests; where a conflict arises he must decline or withdraw unless, after full disclosure, all affected clients give informed consent.' },
  { rule: 'Rule 19', title: 'Privilege and confidence of client', summary: 'A lawyer shall preserve and protect the confidences and secrets of the client even after the relationship ends, save in limited permitted circumstances.' },
  { rule: 'Rule 20', title: 'Lawyer in salaried employment', summary: 'Restrictions on a lawyer in full-time salaried employment appearing as an advocate or engaging in private practice, save as permitted.' },
  { rule: 'Rule 23', title: "Dealing with client's money/property", summary: "A lawyer shall keep clients' money in a separate (designated) client account, not commingle it with his own, account promptly, and pay over money due to the client." },
  { rule: 'Rule 30', title: 'Lawyer as officer of the Court', summary: 'A lawyer is an officer of the court and shall not do any act or conduct himself in any manner that may obstruct, delay or adversely affect the administration of justice.' },
  { rule: 'Rule 31', title: 'Candour and fairness', summary: 'In presenting a matter a lawyer shall not knowingly mislead the court, must disclose adverse controlling authority not disclosed by the opponent, and shall be fair to the court and the other side.' },
  { rule: 'Rule 32', title: 'Dealing with witnesses', summary: 'A lawyer shall not suppress evidence he or his client has a legal obligation to reveal, nor pay or offer to pay a witness contingent on the content of testimony or the outcome.' },
  { rule: 'Rule 33', title: 'Conduct in court / trial publicity', summary: 'A lawyer shall treat the court with respect, dignity and honour, and shall not make extra-judicial statements that may prejudice a fair trial.' },
  { rule: 'Rule 45', title: 'Withdrawal from employment', summary: 'A lawyer may withdraw from a matter only on good cause and reasonable notice to the client, taking steps to avoid foreseeable prejudice to the client.' },
  { rule: 'Rule 48', title: 'Notice on retirement/changes', summary: 'Requirements relating to a lawyer’s practice arrangements, partnerships and notices to clients.' },
  { rule: 'Rule 52', title: 'Advertising and solicitation', summary: 'A lawyer may engage in dignified, non-misleading advertising within the limits permitted by the Rules; touting and improper solicitation are prohibited.' },
  { rule: 'Rule 55', title: 'Enforcement / discipline', summary: 'A breach of the Rules is professional misconduct punishable by the Legal Practitioners Disciplinary Committee (LPDC) and is a ground for disciplinary proceedings.' },
];

// ---- Fee calculator scales (illustrative; confirm the applicable scale) -----
export const FEE_DEFAULTS = {
  hourlyRate: 50000,
  currency: '₦',
  vatRate: 7.5, // %
  whtRate: 5, // % (professional services)
};

// Property / conveyancing scale (illustrative tiers, % of consideration).
export const CONVEYANCING_SCALE = [
  { upTo: 1000000, rate: 10 },
  { upTo: 5000000, rate: 7.5 },
  { upTo: 50000000, rate: 5 },
  { upTo: Infinity, rate: 3 },
];

// ---- Default document templates --------------------------------------------
export const DEFAULT_TEMPLATES = [
  {
    id: 't-employment',
    name: 'Employment Contract',
    category: 'Corporate',
    content: `EMPLOYMENT CONTRACT

This Employment Contract is made on [DATE] BETWEEN:
1. [EMPLOYER NAME] of [EMPLOYER ADDRESS] ("the Employer"); and
2. [EMPLOYEE NAME] of [EMPLOYEE ADDRESS] ("the Employee").

1. POSITION: [JOB TITLE]
2. COMMENCEMENT DATE: [START DATE]
3. PROBATION: [PERIOD]
4. REMUNERATION: ₦[AMOUNT] per [PERIOD]
5. WORKING HOURS: [HOURS]
6. LEAVE: [DAYS] working days per annum
7. TERMINATION: [NOTICE PERIOD] notice by either party
8. CONFIDENTIALITY & IP: [CLAUSE]
9. GOVERNING LAW: Laws of the Federal Republic of Nigeria and the Labour Act.

SIGNED by the parties on the date first above written.
________________________        ________________________
Employer                                       Employee`,
  },
  {
    id: 't-tenancy',
    name: 'Tenancy Agreement',
    category: 'Property',
    content: `TENANCY AGREEMENT

THIS AGREEMENT is made on [DATE] BETWEEN [LANDLORD NAME] ("the Landlord") and [TENANT NAME] ("the Tenant").

PREMISES: [DESCRIPTION/ADDRESS]
TERM: [DURATION] commencing [START DATE]
RENT: ₦[AMOUNT] per [PERIOD], payable [TERMS]
SECURITY DEPOSIT: ₦[AMOUNT]

THE TENANT COVENANTS:
1. To pay the rent as and when due.
2. To use the premises for [PURPOSE] only.
3. Not to assign or sublet without the Landlord's written consent.
4. To keep the premises in good and tenantable repair.

THE LANDLORD COVENANTS:
1. Quiet enjoyment.
2. [OTHER]

This Agreement is subject to the [STATE] Tenancy Law.

________________________        ________________________
Landlord                                        Tenant`,
  },
  {
    id: 't-poa',
    name: 'Power of Attorney',
    category: 'Litigation',
    content: `POWER OF ATTORNEY

BY THIS POWER OF ATTORNEY made on [DATE], I, [DONOR NAME] of [ADDRESS] ("the Donor"), APPOINT [DONEE NAME] of [ADDRESS] ("the Donee") to be my true and lawful attorney to do the following on my behalf:
1. [POWER 1]
2. [POWER 2]
3. [POWER 3]

This Power of Attorney shall [be irrevocable for / remain in force until] [DURATION/EVENT].

IN WITNESS WHEREOF the Donor has executed this deed.

SIGNED, SEALED AND DELIVERED by the within-named Donor
________________________
[DONOR NAME]
Before me,
________________________
COMMISSIONER FOR OATHS / NOTARY PUBLIC`,
  },
  {
    id: 't-affidavit',
    name: 'Affidavit',
    category: 'Litigation',
    content: `IN THE [COURT]
[JUDICIAL DIVISION]

SUIT NO: [NUMBER]

AFFIDAVIT

I, [NAME], [OCCUPATION], of [ADDRESS], [CITIZENSHIP], do hereby make oath and state as follows:
1. That I am the [CAPACITY] in this matter and competent to depose to this affidavit.
2. [FACT]
3. [FACT]
4. That I depose to this affidavit in good faith, believing same to be true and correct and in accordance with the Oaths Act.

________________________
DEPONENT

Sworn to at the [REGISTRY] this [DATE]
Before me,
________________________
COMMISSIONER FOR OATHS`,
  },
  {
    id: 't-written-address',
    name: 'Written Address',
    category: 'Litigation',
    content: `IN THE [COURT]
[JUDICIAL DIVISION]
HOLDEN AT [LOCATION]

SUIT NO: [NUMBER]

BETWEEN:
[CLAIMANT] .................................................. CLAIMANT
AND
[DEFENDANT] .............................................. DEFENDANT

WRITTEN ADDRESS IN SUPPORT OF [APPLICATION/DEFENCE]

1.0 INTRODUCTION
2.0 BRIEF STATEMENT OF FACTS
3.0 ISSUES FOR DETERMINATION
4.0 ARGUMENT
5.0 CONCLUSION

Dated this [DATE].
________________________
[COUNSEL NAME]
Counsel to the [PARTY]
[FIRM, ADDRESS, EMAIL, PHONE]`,
  },
  {
    id: 't-legal-opinion',
    name: 'Legal Opinion',
    category: 'Corporate',
    content: `LEGAL OPINION

TO: [CLIENT]
FROM: [FIRM]
DATE: [DATE]
RE: [SUBJECT]

1. INTRODUCTION & INSTRUCTIONS
2. DOCUMENTS REVIEWED
3. ASSUMPTIONS
4. ISSUES
5. APPLICABLE LAW
6. ANALYSIS
7. CONCLUSION & RECOMMENDATIONS
8. QUALIFICATIONS / CAVEATS

________________________
[COUNSEL NAME], for [FIRM]`,
  },
  {
    id: 't-demand',
    name: 'Letter Before Action',
    category: 'Litigation',
    content: `[FIRM LETTERHEAD]

[DATE]

[RECIPIENT NAME]
[ADDRESS]

Dear Sir/Madam,

RE: LETTER BEFORE ACTION — [SUBJECT]

We act as Solicitors to [CLIENT] ("our client"), on whose instructions we write.

1. [FACTS]
2. [LEGAL BASIS / BREACH]
3. TAKE NOTICE that unless [DEMAND] is met within [NUMBER] days of this letter, our client will commence legal proceedings against you without further notice, and shall rely on this letter as to costs.

Yours faithfully,
________________________
[COUNSEL NAME]
For: [FIRM]`,
  },
];
