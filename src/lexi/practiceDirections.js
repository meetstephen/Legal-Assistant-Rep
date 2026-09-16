// Curated discovery registry, not a complete or continuously updated rules database.
export const PRACTICE_DIRECTIONS = [
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
export const REVIEWED_ON = '2026-09-16';

export function practiceDirectionContext(query = '') {
  const selected = PRACTICE_DIRECTIONS.filter(d => new RegExp('\\b' + d.state + '\\b', 'i').test(query));
  if (!selected.length) return '';
  return 'CURATED STATE PRACTICE-DIRECTION DISCOVERY (reviewed ' + REVIEWED_ON +
    '; not confirmation of current force; small-claims coverage only):\n' +
    selected.map(d => d.state + ': ' + d.title + '\n' + d.status + '\n' + d.notes + '\nOfficial source: ' + d.url).join('\n\n') +
    '\nDo not apply small-claims directions to ordinary High Court proceedings. Confirm amendments, commencement, court designation and scope before reliance.';
}
