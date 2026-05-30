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
