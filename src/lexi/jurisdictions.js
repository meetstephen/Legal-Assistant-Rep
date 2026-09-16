import { JURISDICTIONS as TERRITORY_NAMES } from './practiceDirections.js';

export const FEDERAL_JURISDICTION = 'Nigeria (Federal)';
export const TERRITORIAL_JURISDICTIONS = [...TERRITORY_NAMES]
  .sort((a, b) => a.localeCompare(b))
  .map(name => ({ id: name, label: name === 'FCT' ? 'FCT (Abuja)' : `${name} State` }));
export const NIGERIAN_JURISDICTIONS = [FEDERAL_JURISDICTION, ...TERRITORIAL_JURISDICTIONS.map(j => j.label)];
export const GOVERNING_LAW_OPTIONS = ['Not yet established', ...NIGERIAN_JURISDICTIONS, 'English law', 'Other / mixed law (specify in instructions)'];

export function normalizeJurisdiction(value = '') {
  const input = String(value).trim();
  if (/^(Nigeria \(Federal\)|Federal(?: \(FHC\/NIC Rules\))?)$/i.test(input)) return FEDERAL_JURISDICTION;
  if (/^(?:FCT(?: \(Abuja\))?(?: State)?|Abuja(?: \(FCT\))?|FCT Abuja|Federal Capital Territory)$/i.test(input)) return 'FCT (Abuja)';
  const match = TERRITORIAL_JURISDICTIONS.find(j => input.toLowerCase() === j.id.toLowerCase() || input.toLowerCase() === j.label.toLowerCase());
  return match?.label || '';
}

export function jurisdictionId(value) {
  const label = normalizeJurisdiction(value);
  return TERRITORIAL_JURISDICTIONS.find(j => j.label === label)?.id || (label === FEDERAL_JURISDICTION ? 'Federal' : '');
}

export function highCourtName(value) {
  const id = jurisdictionId(value);
  if (id === 'FCT') return 'High Court of the Federal Capital Territory, Abuja';
  if (id && id !== 'Federal') return `High Court of ${id} State`;
  return '';
}

export function buildJurisdictionBrief({ jurisdiction, court = '', division = '', lawAsAt = '', governingLaw = '' }) {
  const label = normalizeJurisdiction(jurisdiction);
  if (!label) throw new Error('Select a specific Nigerian state, the FCT or federal jurisdiction.');
  return [
    `SELECTED MATTER JURISDICTION: ${label}. This overrides profile defaults, not contrary facts or the law.`,
    `COURT / FORUM: ${court.trim() || 'Not established; ask if material. Federal legislation does not by itself select a federal court.'}`,
    `JUDICIAL DIVISION / LOCATION: ${division.trim() || 'Not established.'}`,
    `LAW-AS-AT DATE: ${lawAsAt || 'Not supplied; confirm the relevant date and event dates.'}`,
    `GOVERNING LAW: ${governingLaw || 'Not established; distinguish substantive law, forum procedure and arbitration seat.'}`,
    'Apply only the selected court and territory’s verified operative instruments. A court’s sitting location does not select its procedural law. Disclose missing instruments and give conditional conclusions, not invented provisions or deadlines.',
  ].join('\n');
}

export function buildCourtChecklistRequest({ matter, court, jurisdiction, division = '', lawAsAt = '' }) {
  const scope = buildJurisdictionBrief({ jurisdiction, court, division, lawAsAt });
  const territorial = /^(High Court of a State|FCT High Court|Magistrate Court|Customary\/Area Court|Sharia Court of Appeal|Customary Court of Appeal)$/.test(court);
  const id = jurisdictionId(jurisdiction);
  if (territorial && id === 'Federal') throw new Error('Select the state or FCT for this territorial court.');
  if (court === 'FCT High Court' && id !== 'FCT') throw new Error('FCT High Court requires FCT (Abuja) jurisdiction.');
  if (court === 'High Court of a State' && id === 'FCT') throw new Error('Select FCT High Court for the FCT, not High Court of a State.');
  const rules = territorial ? `Applicable rules of ${court === 'High Court of a State' || court === 'FCT High Court' ? highCourtName(jurisdiction) : `${court} in ${normalizeJurisdiction(jurisdiction)}`}; edition and directions must be verified.`
    : `The ${court}'s own applicable rules, practice directions and subject-specific legislation; do not substitute state High Court rules because of its sitting location.`;
  return `Filing checklist for: ${matter}\n${scope}\nRULES TO VERIFY: ${rules}`;
}

