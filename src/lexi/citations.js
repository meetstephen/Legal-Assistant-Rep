// ============================================================
// lexi/citations.js — Citation Verification Engine
//
// Mirrors lexi/citations.py. Provides:
//   • A seed database of verified landmark Nigerian decisions
//   • Core statute provisions for RAG grounding
//   • A citation audit that scans answers and badges cited cases
//   • Deterministic repealed-law and foreign-authority scans
//
// NOTE: The case list below is curated seed data covering well-known landmark
// decisions. It is intentionally conservative (real cases only) and is meant to
// be expanded by an admin. It is NOT exhaustive — always confirm against NWLR /
// LPELR / Law Pavilion before filing. The one-click live-web verifier (see
// webSearch.js) closes the gap where a genuine case is simply not seeded here.
// ============================================================

export const VERIFIED_CASES = [
  // Constitutional / public law
  { name: 'Madukolu v Nkemdilim', citation: '(1962) 2 SCNLR 341', court: 'Supreme Court', category: 'Procedure / Jurisdiction', holding: 'Conditions precedent to a court’s competence to adjudicate (jurisdiction).' },
  { name: 'Military Governor of Lagos State v Ojukwu', citation: '(1986) 1 NWLR (Pt 18) 621', court: 'Supreme Court', category: 'Constitutional', holding: 'Executive must obey court orders; rule of law and self-help condemned.' },
  { name: 'Garba v University of Maiduguri', citation: '(1986) 1 NWLR (Pt 18) 550', court: 'Supreme Court', category: 'Fair Hearing', holding: 'Right to fair hearing; disciplinary body cannot try criminal allegations.' },
  { name: 'Ariori v Elemo', citation: '(1983) 1 SCNLR 1', court: 'Supreme Court', category: 'Fair Hearing', holding: 'Scope and waiver of the constitutional right to fair hearing.' },
  { name: 'Adegoke Motors Ltd v Adesanya', citation: '(1989) 3 NWLR (Pt 109) 250', court: 'Supreme Court', category: 'Procedure', holding: 'Finality of the Supreme Court; correction of its own errors.' },
  { name: 'Bronik Motors Ltd v Wema Bank Ltd', citation: '(1983) 1 SCNLR 296', court: 'Supreme Court', category: 'Jurisdiction', holding: 'Original and appellate jurisdiction of the Supreme Court.' },
  { name: 'Adesanya v President of the Federal Republic of Nigeria', citation: '(1981) 5 SC 112', court: 'Supreme Court', category: 'Constitutional', holding: 'Locus standi; sufficient interest to invoke the court’s jurisdiction.' },
  { name: 'Nafiu Rabiu v State', citation: '(1981) 2 NCLR 293', court: 'Supreme Court', category: 'Constitutional', holding: 'Constitution to be interpreted broadly and purposively.' },
  { name: 'Ransome-Kuti v Attorney-General of the Federation', citation: '(1985) 2 NWLR (Pt 6) 211', court: 'Supreme Court', category: 'Fundamental Rights', holding: 'Nature of fundamental rights; liability for unlawful demolition.' },
  { name: 'Director of SSS v Agbakoba', citation: '(1999) 3 NWLR (Pt 595) 314', court: 'Supreme Court', category: 'Fundamental Rights', holding: 'Right to a passport flows from freedom of movement.' },
  { name: 'Abacha v Fawehinmi', citation: '(2000) 6 NWLR (Pt 660) 228', court: 'Supreme Court', category: 'Fundamental Rights', holding: 'Status of the African Charter on Human and Peoples’ Rights in Nigerian law.' },
  { name: 'Attorney-General of Ondo State v Attorney-General of the Federation', citation: '(2002) 9 NWLR (Pt 772) 222', court: 'Supreme Court', category: 'Constitutional', holding: 'Validity of the ICPC Act; federalism and anti-corruption legislation.' },
  { name: 'Attorney-General of the Federation v Attorney-General of Abia State (No 2)', citation: '(2002) 6 NWLR (Pt 764) 542', court: 'Supreme Court', category: 'Constitutional', holding: 'Resource control; onshore/offshore dichotomy.' },
  { name: 'Attorney-General of Lagos State v Attorney-General of the Federation', citation: '(2003) 12 NWLR (Pt 833) 1', court: 'Supreme Court', category: 'Constitutional', holding: 'Federalism; limits of federal power over physical/urban planning.' },
  { name: 'Inakoju v Adeleke', citation: '(2007) 4 NWLR (Pt 1025) 423', court: 'Supreme Court', category: 'Constitutional', holding: 'Conditions for valid impeachment of a Governor under s.188.' },
  { name: 'Dapianlong v Dariye', citation: '(2007) 8 NWLR (Pt 1036) 332', court: 'Supreme Court', category: 'Constitutional', holding: 'Due process requirements for removal of a Governor.' },

  // Electoral
  { name: 'Awolowo v Shagari', citation: '(1979) 6-9 SC 51', court: 'Supreme Court', category: 'Electoral', holding: 'Interpretation of the “two-thirds of nineteen states” requirement.' },
  { name: 'Amaechi v INEC', citation: '(2008) 5 NWLR (Pt 1080) 227', court: 'Supreme Court', category: 'Electoral', holding: 'Party, not candidate, wins the election; substitution of candidates.' },
  { name: 'Buhari v Obasanjo', citation: '(2005) 13 NWLR (Pt 941) 1', court: 'Supreme Court', category: 'Electoral', holding: 'Burden and standard of proof in election petitions.' },
  { name: 'INEC v Musa', citation: '(2003) 3 NWLR (Pt 806) 72', court: 'Supreme Court', category: 'Electoral', holding: 'INEC cannot impose extra-constitutional conditions on party registration.' },

  // Criminal / liberty
  { name: 'Aoko v Fagbemi', citation: '(1961) 1 All NLR 400', court: 'High Court', category: 'Criminal', holding: 'No conviction for an act not defined as an offence in a written law.' },
  { name: 'Bello v Attorney-General of Oyo State', citation: '(1986) 5 NWLR (Pt 45) 828', court: 'Supreme Court', category: 'Criminal / Tort', holding: 'Liability for executing a condemned convict while appeal pending; right to life.' },
  { name: 'Dokubo-Asari v Federal Republic of Nigeria', citation: '(2007) 12 NWLR (Pt 1048) 320', court: 'Supreme Court', category: 'Criminal', holding: 'National security as a consideration in the grant or refusal of bail.' },
  { name: 'Saraki v Federal Republic of Nigeria', citation: '(2016) 3 NWLR (Pt 1500) 531', court: 'Supreme Court', category: 'Criminal', holding: 'Jurisdiction and procedure of the Code of Conduct Tribunal.' },

  // Practice & procedure (signing of processes)
  { name: 'Okafor v Nweke', citation: '(2007) 10 NWLR (Pt 1043) 521', court: 'Supreme Court', category: 'Procedure', holding: 'Court processes must be signed by a legal practitioner known to law, not a firm.' },
  { name: 'SLB Consortium Ltd v NNPC', citation: '(2011) 9 NWLR (Pt 1252) 317', court: 'Supreme Court', category: 'Procedure', holding: 'Requirements for valid signing/franking of court processes.' },
  { name: 'Kotoye v Central Bank of Nigeria', citation: '(1989) 1 NWLR (Pt 98) 419', court: 'Supreme Court', category: 'Procedure', holding: 'Undertaking as to damages on interlocutory injunctions; fair hearing.' },

  // Land / customary
  { name: 'Ukeje v Ukeje', citation: '(2014) 11 NWLR (Pt 1418) 384', court: 'Supreme Court', category: 'Customary / Succession', holding: 'Igbo custom disinheriting female children is unconstitutional (s.42).' },
  { name: 'Anekwe v Nweke', citation: '(2014) 9 NWLR (Pt 1412) 393', court: 'Supreme Court', category: 'Customary / Succession', holding: 'Custom denying a widow inheritance is repugnant and void.' },
  { name: 'Mojekwu v Mojekwu', citation: '(1997) 7 NWLR (Pt 512) 283', court: 'Court of Appeal', category: 'Customary', holding: 'The “oli-ekpe” custom is discriminatory and repugnant to natural justice.' },

  // Commercial / company
  { name: 'BFI Group Corporation v Bureau of Public Enterprises', citation: '(2012) 18 NWLR (Pt 1332) 209', court: 'Supreme Court', category: 'Contract / Commercial', holding: 'Formation of contract; offer and acceptance in a privatisation context.' },
  { name: 'Odua Investment Co Ltd v Talabi', citation: '(1997) 10 NWLR (Pt 523) 1', court: 'Supreme Court', category: 'Contract / Estoppel', holding: 'Pleadings, issue estoppel and abuse of process.' },

  // Fundamental rights / deportation
  { name: 'Shugaba Abdurrahman Darman v Minister of Internal Affairs', citation: '(1981) 2 NCLR 459', court: 'High Court', category: 'Fundamental Rights', holding: 'Unlawful deportation of a citizen; enforcement of fundamental rights.' },
  { name: 'Uzoukwu v Ezeonu II', citation: '(1991) 6 NWLR (Pt 200) 708', court: 'Court of Appeal', category: 'Fundamental Rights', holding: 'Distinction between fundamental rights and other legal rights.' },
];

// Core statute provisions used for RAG grounding (18+).
export const STATUTE_PROVISIONS = [
  { title: 'Constitution of the FRN 1999 (as amended)', provision: 's.1(3)', summary: 'Supremacy of the Constitution; any inconsistent law is void to the extent of the inconsistency.', tags: ['constitution', 'supremacy', 'void', 'inconsistent'] },
  { title: 'Constitution of the FRN 1999 (as amended)', provision: 's.6', summary: 'Vesting of judicial powers in the courts; justiciability.', tags: ['judicial power', 'courts', 'jurisdiction'] },
  { title: 'Constitution of the FRN 1999 (as amended)', provision: 's.33', summary: 'Right to life, subject to lawful exceptions.', tags: ['right to life', 'fundamental rights'] },
  { title: 'Constitution of the FRN 1999 (as amended)', provision: 's.35', summary: 'Right to personal liberty; lawful detention and bail.', tags: ['liberty', 'arrest', 'detention', 'bail', 'fundamental rights'] },
  { title: 'Constitution of the FRN 1999 (as amended)', provision: 's.36', summary: 'Right to fair hearing within a reasonable time by an impartial court/tribunal; presumption of innocence.', tags: ['fair hearing', 'natural justice', 'presumption of innocence', 'due process'] },
  { title: 'Constitution of the FRN 1999 (as amended)', provision: 's.42', summary: 'Freedom from discrimination.', tags: ['discrimination', 'equality', 'fundamental rights', 'inheritance'] },
  { title: 'Evidence Act 2011', provision: 's.83', summary: 'Admissibility of documentary evidence; documentary hearsay exceptions.', tags: ['evidence', 'documents', 'hearsay', 'admissibility'] },
  { title: 'Evidence Act 2011', provision: 's.84', summary: 'Admissibility of computer-generated/electronic evidence; certificate requirement.', tags: ['evidence', 'electronic', 'computer', 'email', 'digital', 'certificate'] },
  { title: 'Evidence Act 2011', provision: 's.128', summary: 'Parol evidence rule — exclusion of oral evidence to vary written documents.', tags: ['evidence', 'parol', 'contract', 'document'] },
  { title: 'Companies and Allied Matters Act (CAMA) 2020', provision: 's.18', summary: 'A single person may form and incorporate a private company.', tags: ['company', 'incorporation', 'cama', 'shareholder'] },
  { title: 'Companies and Allied Matters Act (CAMA) 2020', provision: 's.87', summary: 'Acts of the company through members in general meeting and the board.', tags: ['company', 'directors', 'organs', 'cama'] },
  { title: 'Land Use Act 1978', provision: 's.1', summary: 'All land in a state is vested in the Governor in trust for the people.', tags: ['land', 'governor', 'title', 'land use act'] },
  { title: 'Land Use Act 1978', provision: 's.22', summary: 'Governor’s consent required to alienate a right of occupancy.', tags: ['land', 'consent', 'assignment', 'mortgage', 'alienation'] },
  { title: 'Land Use Act 1978', provision: 's.28', summary: 'Power of the Governor to revoke a right of occupancy for overriding public interest.', tags: ['land', 'revocation', 'compensation', 'public interest'] },
  { title: 'Public Officers Protection Act', provision: 's.2(a)', summary: 'Action against a public officer must be commenced within 3 months of the act complained of.', tags: ['limitation', 'public officer', 'three months', 'time bar'] },
  { title: 'Administration of Criminal Justice Act (ACJA) 2015', provision: 's.396(7)', summary: 'A judge elevated to the Court of Appeal may conclude a part-heard criminal matter.', tags: ['criminal', 'trial', 'acja', 'procedure'] },
  { title: 'Labour Act', provision: 's.7', summary: 'Employer must give a written statement of terms of employment within 3 months.', tags: ['employment', 'labour', 'contract', 'terms'] },
  { title: 'Lagos State Tenancy Law 2011', provision: 's.13', summary: 'Notices required to determine various tenancies before recovery of premises.', tags: ['tenancy', 'landlord', 'notice', 'recovery of premises', 'lagos'] },
  { title: 'Matrimonial Causes Act', provision: 's.15', summary: 'Grounds for dissolution of marriage — irretrievable breakdown via the statutory facts.', tags: ['divorce', 'matrimonial', 'marriage', 'dissolution'] },
];

// Report series recognised as Nigerian for the citation audit.
const NG_SERIES = ['NWLR', 'LPELR', 'SCNLR', 'SC', 'All NLR', 'ANLR', 'NMLR', 'NCLR', 'FWLR', 'NSCQR', 'WRN'];

// Foreign report series (persuasive, not binding) for the foreign-authority scan.
const FOREIGN_SERIES = [
  'AC', 'QB', 'KB', 'WLR', 'All ER', 'Ch', 'EWCA', 'EWHC', 'UKHL', 'UKSC',
  'Lloyd\u2019s Rep', "Lloyd's Rep", 'F.2d', 'F.3d', 'F. Supp', 'U.S.', 'US ',
];

// Repealed / superseded instruments commonly mis-cited.
const REPEALED = [
  { pattern: /Companies and Allied Matters Act,?\s*(19|20)?90|CAMA\s*1990/i, note: 'CAMA 1990 was repealed and replaced by CAMA 2020.' },
  { pattern: /Evidence Act,?\s*(1945|2004)/i, note: 'The Evidence Act 1945/2004 was repealed and replaced by the Evidence Act 2011.' },
  { pattern: /Criminal Procedure Act|Criminal Procedure Code/i, note: 'In federal courts and many states the CPA/CPC has been superseded by the ACJA 2015 (or state ACJLs). Confirm the rules in force in the relevant jurisdiction.' },
  { pattern: /Companies Income Tax Act,?\s*1979/i, note: 'CITA 1979 has been substantially amended/consolidated; cite CITA Cap C21 LFN 2004 (as amended by the Finance Acts).' },
];

const norm = (s = '') =>
  s
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const VERIFIED_INDEX = VERIFIED_CASES.map((c) => ({ ...c, key: norm(c.name) }));

// Allow the Admin page to register extra verified cases at runtime (persisted
// in the database layer and reloaded on boot), mirroring the README feature
// where admin-added verified cases load into every session.
export function registerVerifiedCases(list = []) {
  (list || []).forEach((c) => {
    if (!c || !c.name) return;
    VERIFIED_CASES.push(c);
    VERIFIED_INDEX.push({ ...c, key: norm(c.name) });
  });
}

// Extract case-name mentions like "X v Y" / "X vs Y".
function extractCaseNames(text) {
  const re =
    /\b([A-Z][A-Za-z.'()-]+(?:\s+(?:of|the|and|&|[A-Z][A-Za-z.'()-]+)){0,8})\s+v(?:s|\.|\b)\.?\s+([A-Z][A-Za-z.'()-]+(?:\s+(?:of|the|and|&|[A-Z][A-Za-z.'()-]+)){0,8})/g;
  const out = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    const full = `${m[1].trim()} v ${m[2].trim()}`.replace(/\s+/g, ' ');
    // grab a trailing citation if present right after the name
    const tail = text.slice(m.index + m[0].length, m.index + m[0].length + 60);
    const cite = (tail.match(/\(\d{4}\)[^.;\n]*/) || [])[0] || '';
    out.push({ name: full, citation: cite.trim() });
  }
  return out;
}

function matchVerified(name) {
  const k = norm(name);
  // exact / contains either direction
  return VERIFIED_INDEX.find(
    (c) => c.key === k || c.key.includes(k) || k.includes(c.key)
  );
}

// ------------------------------------------------------------
// auditCitations(text) -> { items, verifiedCount, unverifiedCount, foreign, repealed }
// ------------------------------------------------------------
export function auditCitations(text = '') {
  const names = extractCaseNames(text);
  const seen = new Set();
  const items = [];
  names.forEach(({ name, citation }) => {
    const key = norm(name);
    if (seen.has(key)) return;
    seen.add(key);
    const hit = matchVerified(name);
    items.push({
      name,
      citation: citation || (hit ? hit.citation : ''),
      status: hit ? 'verified' : 'unverified',
      verifiedCitation: hit ? hit.citation : '',
      holding: hit ? hit.holding : '',
      court: hit ? hit.court : '',
    });
  });

  const foreign = [];
  FOREIGN_SERIES.forEach((s) => {
    const re = new RegExp(`\\(\\d{4}\\)[^\\n]{0,8}\\b${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    if (re.test(text)) foreign.push(s);
  });

  const repealed = [];
  REPEALED.forEach((r) => {
    if (r.pattern.test(text)) repealed.push(r.note);
  });

  return {
    items,
    verifiedCount: items.filter((i) => i.status === 'verified').length,
    unverifiedCount: items.filter((i) => i.status === 'unverified').length,
    foreign: [...new Set(foreign)],
    repealed: [...new Set(repealed)],
    seriesDetected: NG_SERIES.filter((s) =>
      new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(text)
    ),
  };
}

// ------------------------------------------------------------
// retrieveStatutes(query, k) -> top-k statute provisions by keyword overlap.
// Lightweight RAG: injected into the system prompt as verified grounding.
// ------------------------------------------------------------
export function retrieveStatutes(query = '', k = 5) {
  const q = norm(query);
  const terms = new Set(q.split(' ').filter((w) => w.length > 2));
  const scored = STATUTE_PROVISIONS.map((s) => {
    const hay = norm(`${s.title} ${s.provision} ${s.summary} ${(s.tags || []).join(' ')}`);
    let score = 0;
    terms.forEach((t) => {
      if (hay.includes(t)) score += 1;
    });
    (s.tags || []).forEach((tag) => {
      if (q.includes(tag)) score += 2;
    });
    return { s, score };
  });
  return scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((x) => x.s);
}

export function statuteGroundingBlock(query) {
  const hits = retrieveStatutes(query, 5);
  if (!hits.length) return '';
  const lines = hits.map((s) => `• ${s.title}, ${s.provision} — ${s.summary}`);
  return `VERIFIED NIGERIAN STATUTE GROUNDING (retrieved for this query — rely on these where relevant, and cite the section numbers):\n${lines.join('\n')}`;
}
