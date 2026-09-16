// Curated discovery registry, not a complete or continuously updated rules database.
const SOUTH_EAST_DIRECTIONS = [
  {
    state: 'Ebonyi', title: 'Small Claims Court Practice Directions 2024',
    url: 'https://ebonyistate.gov.ng/storage/documents/min-2-ebonyi-state-practice-direction-on-small-claims-courtpdf-1730824973.pdf',
    status: 'Official scanned document located; provisions require manual review',
    notes: 'Do not infer monetary limits, forms or deadlines from neighbouring states.',
  },
  {
    state: 'Abia', title: 'Practice Directions on Small Claims 2023',
    url: 'https://abiastate.gov.ng/wp-content/uploads/2024/01/SCC-PRACTICE-DIRECTIONS-1.pdf',
    status: 'Document text reviewed; later amendments not confirmed',
    notes: 'Commencement: 17 November 2023. Article 2: liquidated demand up to N5 million excluding interest/costs; demand SCA1, complaint SCA2, summons SCA3. Confirm territorial eligibility and designated court.',
  },
  {
    state: 'Anambra', title: 'Practice Directions of the Small Claims Court 2023',
    url: 'https://anambrastate.gov.ng/wp-content/uploads/The-Anambra-State-Practice-Directions-of-the-Small-Claims-Court-2023.pdf',
    status: 'Document text reviewed; later amendments not confirmed',
    notes: 'Section 2: liquidated demand up to N5 million excluding interest/costs; demand SCC1, complaint SCC2, summons SCC3. Section 7: defence/admission/counterclaim within 7 days of service. Confirm territorial eligibility and designated court.',
  },
  {
    state: 'Enugu', title: 'Practice Directions on Small Claims 2023',
    url: 'https://www.judiciary.en.gov.ng/assets/practice-directions.pdf',
    status: 'Document text reviewed; later amendments not confirmed',
    notes: 'Article 2: liquidated demand up to N5 million excluding interest/costs; demand SCA1, complaint SCA2, summons SCA3. Article 5: summons service within 7 days of filing; affidavit of service within 2 days of service. Confirm designated court and territorial eligibility.',
  },
  {
    state: 'Imo', title: 'Small Claims Court Practice Direction and general Practice Directives',
    url: 'https://imojudiciary.gov.ng/documents/courtdocument',
    status: 'Official listing confirmed; full documents unavailable during review',
    notes: 'Listing upload dates are not commencement dates. Obtain signed text from the judiciary/registry before applying any deadline, form or limit.',
  },
];

// A source lead is not a verified operative rule. Gaps deliberately have no guessed URL.
const NATIONAL_SOURCE_LEADS = [
  [
    "Adamawa",
    "judiciary-portal",
    "Judiciary resource portal",
    "https://judiciary.adamawastate.gov.ng/",
    "Portal located; signed directions not reviewed",
    "Small-claims forms and reports are discovery leads, not a substitute for signed practice directions."
  ],
  [
    "Akwa Ibom",
    "document",
    "Practice Direction on Small Claims 2023",
    "https://akwaibomjudiciary.org/assets/front/application/JMWPo8pVLabNJEcG.pdf",
    "Selected provisions reviewed; later amendments not confirmed",
    "Article 7 states 6 days after service for defence/admission/counterclaim, not the 7-day period found in some other states. Confirm signed operative text, service trigger and court designation before computing dates."
  ],
  [
    "Bauchi",
    "catalogue",
    "Legislation and practice directions catalogue",
    "https://judiciary.bu.gov.ng/legislation",
    "Official catalogue located; individual provisions not reviewed",
    "Lists small-claims directions, designation memorandum, court rules and ACJL. Catalogue dates do not establish commencement."
  ],
  [
    "Bayelsa",
    "catalogue",
    "Practice Direction page",
    "https://bayelsajudiciary.gov.ng/practice-direction/",
    "Official page located; readable operative text not confirmed",
    "The page alone does not establish a current rule. Obtain signed text and amendments from the registry."
  ],
  [
    "Benue",
    "document",
    "Practice Directions for Small Claims Court 2023",
    "https://benuejudiciary.org.ng/u/docs/DOC32579.pdf",
    "Selected provisions reviewed; commencement unresolved",
    "Article 6 states N10 million excluding interest/costs. The published Article 1 has a blank commencement date: obtain the signed operative instrument before reliance. Do not import the N5 million limit from other states."
  ],
  [
    "Borno",
    "catalogue",
    "Judiciary document downloads",
    "https://bornojudiciary.ng/downloads",
    "Official catalogue located; individual provisions not reviewed",
    "Lists Small Claims Courts Practice Directions 2023 and other court rules. Verify the actual downloaded document, signature and current force."
  ],
  [
    "Cross River",
    "catalogue",
    "Small Claims Court official resource page",
    "https://www.judiciary.cr.gov.ng/about-the-small-claims-court/",
    "Official explanatory page located; signed direction text not reviewed",
    "A court overview is not the operative direction. Obtain the signed instrument and any amendments."
  ],
  [
    "Delta",
    "catalogue",
    "Small Claims Court downloads",
    "https://www.smallclaims.judiciary.dl.gov.ng/category/downloads/",
    "Official catalogue located; individual provisions not reviewed",
    "Lists SCC Practice Direction and related materials. Review signed directions rather than treating presentation slides as rules."
  ],
  [
    "Edo",
    "catalogue",
    "Practice Directions archive",
    "https://edojudiciary.gov.ng/category/practice-directions/",
    "Official catalogue located; individual provisions not reviewed",
    "Includes virtual hearings 2025, small claims, criminal procedure, ADR, fees and e-filing. Historical pandemic directions are not presumed current."
  ],
  [
    "Ekiti",
    "judiciary-portal",
    "Judiciary resource portal",
    "https://judiciary.ek.gov.ng/",
    "Portal located; signed directions not reviewed",
    "Digital services and announcements do not by themselves establish mandatory filing/service procedure. Confirm operative rules with the registry."
  ],
  [
    "Gombe",
    "catalogue",
    "Practice Directions catalogue",
    "https://judiciary.gm.gov.ng/practice-directions/",
    "Official catalogue located; individual provisions not reviewed",
    "Lists Practice Directions Nos. 1 and 2 of 2023 and ACJL Practice Direction 2023. Identify subject matter and signed instrument before reliance."
  ],
  [
    "Jigawa",
    "gap",
    "Practice directions awaiting official-source confirmation",
    "",
    "Official practice-direction source not confirmed in this review",
    "Obtain signed directions from the Jigawa judiciary/registry. This gap does not mean directions do not exist. No other state rules may be substituted."
  ],
  [
    "Kaduna",
    "document",
    "Administration of Criminal Justice (ACJL) Rules 2024 and scheduled directions",
    "https://www.kadunajudiciary.org/assets/resources/Kaduna%20State%20Administration%20of%20Criminal%20Justice%28ACJL%29%20Rules%202024.pdf",
    "Document located; signature/commencement require confirmation",
    "Schedule 10 contains remand directions with placeholder date text in the published copy. Confirm the signed operative version; do not treat placeholders as an effective date."
  ],
  [
    "Kano",
    "judiciary-portal",
    "Judiciary resource portal",
    "https://judiciary.kn.gov.ng/",
    "Portal located; signed directions not reviewed",
    "Small-claims reports confirm neither applicable monetary limits nor procedural deadlines. Obtain the signed current direction."
  ],
  [
    "Katsina",
    "document",
    "Updated Practice Direction on Small Claims Court 2023",
    "https://katsinastate.gov.ng/wp-content/uploads/2024/01/UPDATED-PRACTICE-DIRECTION-ON-SCC-KATSINA-2023.pdf",
    "Official document located; operative version not fully reviewed",
    "Check territorial eligibility, designated District Court, commencement and amendments in the signed instrument."
  ],
  [
    "Kebbi",
    "judiciary-portal",
    "Judiciary resource portal",
    "https://www.kebbistatejudiciary.kb.gov.ng/people/hon-justice-maryam-abubakar-kaoje/",
    "Judiciary contact page located; signed directions not reviewed",
    "Use this judiciary contact lead to request signed current directions. A judicial biography is not procedural authority."
  ],
  [
    "Kogi",
    "judiciary-portal",
    "Judiciary resource portal",
    "https://judiciary.kogistate.gov.ng/",
    "Portal located; signed directions not reviewed",
    "Confirm court-specific civil, criminal, family and small-claims directions from the issuing judiciary/registry."
  ],
  [
    "Kwara",
    "government-report",
    "Official small-claims development report",
    "https://kwarastate.gov.ng/press_releases/kwara-sensitises-judicial-officers-citizens-on-small-claims-court-cases-to-end-in-60-days/",
    "Government report located; signed direction text not reviewed",
    "A sensitisation/news report is not the signed practice direction. Obtain the operative instrument before applying quoted targets or deadlines."
  ],
  [
    "Lagos",
    "judiciary-portal",
    "Judiciary information system",
    "https://jis.lagosjudiciary.gov.ng/ViewAboutUS.aspx",
    "Official portal located; indexed small-claims PDF unavailable on fetch",
    "An indexed Small Claims Practice Direction 2023 PDF returned 404 during review. Confirm the replacement signed download and current High Court/small-claims directions; do not rely on historical e-filing descriptions alone."
  ],
  [
    "Nasarawa",
    "gap",
    "Practice directions awaiting document-identity confirmation",
    "",
    "Nasarawa direction text not confirmed; mismatched hosted document excluded",
    "The PDF named REVISED-PRACTICE-DIRECTION-FOR-SMALL-CLAIMS on judiciary.na.gov.ng identifies Gombe, not Nasarawa. It must not be applied as a Nasarawa rule. Obtain signed Nasarawa text from the registry."
  ],
  [
    "Niger",
    "government-report",
    "Official judiciary and small-claims resource page",
    "https://nogp.nigerstate.gov.ng/niger-state-judiciary-committees-and-small-claims-court-cases/",
    "Government resource page located; signed direction text not reviewed",
    "Committee and case reports are discovery resources, not a basis to invent court limits, forms or deadlines."
  ],
  [
    "Ogun",
    "government-report",
    "Official digital justice reform report",
    "https://fmino.gov.ng/ogun-state-advances-tinubus-judiciary-reform-agenda-with-full-roll-out-of-digital-justice-system/",
    "Government report located; signed direction text not reviewed",
    "Reports High Court Rules Amendment 2024 and Practice Direction 2026 extending digital hearings. Obtain signed texts before asserting their precise scope or filing requirements."
  ],
  [
    "Ondo",
    "catalogue",
    "CoMiS judiciary resources",
    "https://comis.ondostatejudiciary.ng/resources.html",
    "Official catalogue located; individual provisions not reviewed",
    "Lists Practice Direction No. 1 of 2020 and small-claims forms. Verify commencement, current scope and supersession; do not assume historical directions remain operative."
  ],
  [
    "Osun",
    "judiciary-portal",
    "Judiciary resource portal",
    "https://osunjudiciary.gov.ng/",
    "Portal located; signed directions not reviewed",
    "Obtain current signed High Court/Magistrates directions and applicable rules from the issuing judiciary/registry."
  ],
  [
    "Oyo",
    "catalogue",
    "Small Claims Court official resources",
    "https://oyostatejudiciary.oy.gov.ng/small-claims/",
    "Official catalogue located; indexed PDF unavailable on fetch",
    "Lists small-claims practice directions and handbook. Verify the replacement readable signed download and amendments before relying on filing periods."
  ],
  [
    "Plateau",
    "government-report",
    "Official government judicial resource catalogue",
    "https://plateaustate.gov.ng/saber/all-resources/",
    "Government catalogue located; signed direction text not reviewed",
    "Court reports in the catalogue are not signed practice directions. Obtain the operative instrument and any court designation notice."
  ],
  [
    "Rivers",
    "document",
    "Small Claims Court Practice Direction 2024",
    "https://www.judiciary.rv.gov.ng/wp-content/uploads/2024/PRATICE%20DIRECTION%202024.pdf",
    "Document title/scope confirmed; individual provisions not fully reviewed",
    "The judiciary lists both 2023 and 2024 texts. Confirm current amendments and transitional application rather than selecting the older PDF automatically. Applies to designated small-claims courts and appellate courts, not all civil suits."
  ],
  [
    "Sokoto",
    "document",
    "Practice Directions on Small Claims 2023",
    "https://judiciary.sk.gov.ng/wp-content/uploads/2024/11/PRACTICAL-DIRECTION-SCC.pdf",
    "Official document located; operative version not fully reviewed",
    "Issued for District Courts. Confirm signed text, territorial eligibility, designation and current amendments before reliance."
  ],
  [
    "Taraba",
    "government-report",
    "Official High Court annual vacation notice 2026",
    "https://www.tarabastate.gov.ng/news/taraba-high-court-announces-2026-annual-vacation",
    "Official procedural announcement located; signed gazette not reviewed",
    "Reports Legal Notice No. 3 of 2026 and urgent vacation hearings. Obtain the gazetted notice and any signed ACJL directions; do not infer time-computation rules from a vacation announcement."
  ],
  [
    "Yobe",
    "document",
    "Small Claims Court Practice Directions",
    "https://yobestate.gov.ng/wp-content/uploads/2024/07/PRACTICE-DIRECTIONS-SMALL-CLAMS-YOBE-STATE.pdf",
    "Official indexed document located; readable text unavailable on fetch",
    "Do not infer issue year from the upload folder. Obtain readable signed copy and confirm designation, commencement and amendments."
  ],
  [
    "Zamfara",
    "catalogue",
    "Official justice and judiciary resources",
    "https://zamfara.gov.ng/justice-and-judiciary/",
    "Official catalogue located; individual provisions not reviewed",
    "Lists Practice Directions for Small Claims Courts and designation resources. Obtain signed operative texts rather than relying only on case reports."
  ],
  [
    "FCT",
    "catalogue",
    "High Court Practice Directions catalogue",
    "https://www.fcthighcourt.gov.ng/practice-direction/",
    "Official catalogue located; individual provisions not fully reviewed",
    "FCT is a distinct jurisdiction, not a state or the Federal High Court. Some published compendium entries have blank commencement dates; confirm signed operative versions and exact court scope."
  ]
];
export const SOURCE_KIND_LABELS = {
  document: 'Official document',
  catalogue: 'Official resource catalogue',
  'judiciary-portal': 'Judiciary contact / portal lead',
  'government-report': 'Official report / announcement — not rule text',
  gap: 'Official direction text not confirmed',
};
const STATE_ZONES = {
  "Abia": "South-East",
  "Anambra": "South-East",
  "Ebonyi": "South-East",
  "Enugu": "South-East",
  "Imo": "South-East",
  "Ekiti": "South-West",
  "Lagos": "South-West",
  "Ogun": "South-West",
  "Ondo": "South-West",
  "Osun": "South-West",
  "Oyo": "South-West",
  "Akwa Ibom": "South-South",
  "Bayelsa": "South-South",
  "Cross River": "South-South",
  "Delta": "South-South",
  "Edo": "South-South",
  "Rivers": "South-South",
  "Benue": "North-Central",
  "Kogi": "North-Central",
  "Kwara": "North-Central",
  "Nasarawa": "North-Central",
  "Niger": "North-Central",
  "Plateau": "North-Central",
  "Adamawa": "North-East",
  "Bauchi": "North-East",
  "Borno": "North-East",
  "Gombe": "North-East",
  "Taraba": "North-East",
  "Yobe": "North-East",
  "Jigawa": "North-West",
  "Kaduna": "North-West",
  "Kano": "North-West",
  "Katsina": "North-West",
  "Kebbi": "North-West",
  "Sokoto": "North-West",
  "Zamfara": "North-West",
  "FCT": "FCT"
};
export const REVIEWED_ON = '2026-09-16';
export const PRACTICE_DIRECTIONS = [
  ...SOUTH_EAST_DIRECTIONS.map(d => ({ ...d, sourceKind: d.state === 'Imo' ? 'catalogue' : 'document' })),
  ...NATIONAL_SOURCE_LEADS.map(([state, sourceKind, title, url, status, notes]) => ({ state, sourceKind, title, url, status, notes })),
].map(d => ({ ...d, zone: STATE_ZONES[d.state], reviewedOn: REVIEWED_ON }));
export const JURISDICTIONS = Object.keys(STATE_ZONES).sort((a, b) => a.localeCompare(b));

export function filterPracticeDirections({ state = 'All', zone = 'All', sourceKind = 'All', query = '' } = {}) {
  const needle = query.trim().toLowerCase();
  return PRACTICE_DIRECTIONS.filter(d =>
    (state === 'All' || d.state === state) &&
    (zone === 'All' || d.zone === zone) &&
    (sourceKind === 'All' || d.sourceKind === sourceKind) &&
    (!needle || [d.state, d.title, d.status, d.notes].join(' ').toLowerCase().includes(needle))
  );
}

export function mentionsState(query, state) {
  const pattern = state === 'FCT' ? '(?:FCT|Federal[ -]+Capital[ -]+Territory|Abuja)' : state.split(' ').join('[ -]+');
  return new RegExp('\\b' + pattern + '\\b', 'i').test(query);
}

export function practiceDirectionContext(query = '') {
  const matches = PRACTICE_DIRECTIONS.filter(d => mentionsState(query, d.state));
  if (!matches.length) return '';
  const selected = matches.slice(0, 6);
  return 'CURATED NIGERIAN JURISDICTION PRACTICE-DIRECTION DISCOVERY (reviewed ' + REVIEWED_ON +
    '; 36 states and FCT indexed, NOT an exhaustive/current-force rules corpus):\n' +
    selected.map(d => d.state + ': ' + d.title + '\nSource type: ' + SOURCE_KIND_LABELS[d.sourceKind] +
      '\n' + d.status + '\n' + d.notes + (d.url ? '\nSource lead: ' + d.url : '\nNo official direction-text URL confirmed. Request signed text from the registry.')).join('\n\n') +
    (matches.length > selected.length ? '\nMore jurisdictions were mentioned; narrow the forum before procedural advice.' : '') +
    '\nMentioning a place does not establish the forum. Abuja may refer to federal courts, not FCT High Court. Never treat portals/news/catalogues as operative rule text, fill evidence gaps from memory, or apply small-claims rules to ordinary proceedings. Confirm signed text, amendments, commencement, designation and exact court scope before reliance.';
}

