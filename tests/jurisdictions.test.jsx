import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi } from 'vitest';
import { NIGERIAN_JURISDICTIONS, TERRITORIAL_JURISDICTIONS, GOVERNING_LAW_OPTIONS,
  normalizeJurisdiction, highCourtName, buildJurisdictionBrief, buildCourtChecklistRequest } from '../src/lexi/jurisdictions.js';
import { NIGERIAN_STATES, JURISDICTIONS, STATE_RULES, STATE_COURT_RULES } from '../src/lexi/legalData.js';
import { practiceScope } from '../src/lexi/practiceCorpus.js';
import { LEGAL_REASONING_POLICY } from '../src/lexi/legalPolicy.js';

vi.mock('../src/lexi/AppContext.jsx', () => ({ useApp: () => ({ profile: { firmName: 'Test firm', defaultJurisdiction: 'Lagos State' }, cases: [], webGrounding: true, aiReady: true, navigate: vi.fn() }) }));
vi.mock('../src/lexi/useAiRun.js', () => ({ useAiRun: () => ({ reset: vi.fn(), run: vi.fn(), stop: vi.fn(), text: '', cleanText: '', running: false }) }));
import { LegalSkill, LEGAL_SKILL_MODES } from '../src/lexi/pages/LegalSkill.jsx';
import { Research } from '../src/lexi/pages/Research.jsx';
import { AIAssistant } from '../src/lexi/pages/AIAssistant.jsx';
import { JurisdictionFields } from '../src/lexi/components/JurisdictionFields.jsx';

describe('canonical nationwide jurisdiction data', () => {
  it('contains all 36 states and FCT exactly once, plus a separate federal scope', () => {
    expect(TERRITORIAL_JURISDICTIONS).toHaveLength(37);
    expect(new Set(NIGERIAN_JURISDICTIONS).size).toBe(38);
    expect(NIGERIAN_JURISDICTIONS.filter(j => j.endsWith(' State'))).toHaveLength(36);
    expect(NIGERIAN_JURISDICTIONS).toContain('FCT (Abuja)');
    expect(NIGERIAN_JURISDICTIONS).not.toContain('FCT (Abuja) State');
    expect(JURISDICTIONS).toEqual(NIGERIAN_JURISDICTIONS);
    expect(STATE_RULES).toEqual(NIGERIAN_JURISDICTIONS);
  });
  it.each(NIGERIAN_STATES.map(s => s.name))('provides a verification-first rule reference for %s', name => {
    expect(STATE_COURT_RULES[name]).toContain(highCourtName(name));
    expect(STATE_COURT_RULES[name]).toMatch(/verify the operative/i);
    expect(STATE_COURT_RULES[name]).not.toMatch(/Rules 20\d\d/);
    expect(normalizeJurisdiction(name)).toBeTruthy();
  });
  it.each(['Abuja (FCT)', 'FCT Abuja', 'FCT (Abuja) State', 'FCT', 'Federal Capital Territory'])('normalizes legacy FCT label %s', label => {
    expect(normalizeJurisdiction(label)).toBe('FCT (Abuja)');
    expect(highCourtName(label)).toBe('High Court of the Federal Capital Territory, Abuja');
  });
  it('does not guess a state for unknown labels', () => {
    expect(normalizeJurisdiction('Other Nigerian State')).toBe('');
    expect(() => buildJurisdictionBrief({ jurisdiction: '' })).toThrow(/Select/);
  });
});

describe('court scope and evidence selection', () => {
  it.each(TERRITORIAL_JURISDICTIONS)('carries $label, court and date into the request without injecting other states', ({ id, label }) => {
    const brief = buildJurisdictionBrief({ jurisdiction: label, court: id === 'FCT' ? 'FCT High Court' : 'High Court of a State', lawAsAt: '2026-09-16', division: 'Selected division' });
    expect(brief).toContain(`SELECTED MATTER JURISDICTION: ${label}`);
    expect(brief).toContain('2026-09-16');
    const scope = practiceScope(`${brief}\nCivil practice directions. A party lives in Lagos and works in Abuja.`);
    expect(scope.states).toEqual([id]);
  });
  it('does not inject criminal or small-claims categories from generic scope instructions', () => {
    const scope = practiceScope(buildJurisdictionBrief({ jurisdiction: 'Ebonyi State' }));
    expect(scope.categories).not.toContain('criminal');
    expect(scope.categories).not.toContain('small-claims');
  });
  it.each(['Federal High Court', 'National Industrial Court', 'Court of Appeal', 'Supreme Court'])('does not retrieve state-court rules for %s merely because it sits in a state', court => {
    const request = buildCourtChecklistRequest({ matter: 'Civil claim', court, jurisdiction: 'Ebonyi State' });
    expect(request).toContain(`The ${court}'s own applicable rules`);
    expect(practiceScope(request).states).toEqual([]);
  });
  it('does not retrieve state-court instruments for an explicitly federal-law research scope', () => {
    expect(practiceScope(buildJurisdictionBrief({ jurisdiction: 'Nigeria (Federal)' }) + '\nLagos facts').states).toEqual([]);
  });
  it.each([
    { court: 'High Court of a State', jurisdiction: 'Nigeria (Federal)' },
    { court: 'FCT High Court', jurisdiction: 'Ebonyi State' },
    { court: 'High Court of a State', jurisdiction: 'FCT (Abuja)' },
  ])('rejects inconsistent territorial checklist scope $court / $jurisdiction', selection => {
    expect(() => buildCourtChecklistRequest({ matter: 'Civil claim', ...selection })).toThrow();
  });
});

describe('nationwide analysis UI and drafting defaults', () => {
  it.each([['Legal Analysis Skill', LegalSkill], ['Research', Research], ['AI Assistant', AIAssistant]])('%s exposes every jurisdiction instead of using the profile default as the forum', (_name, Component) => {
    const html = renderToStaticMarkup(<Component />);
    for (const label of NIGERIAN_JURISDICTIONS) expect(html).toContain(`value="${label}"`);
    expect(html).toContain('Law-as-at date');
    expect(html).toContain('value="" selected=""');
    expect(html).not.toContain('value="Lagos State" selected=""');
  });
  it('shared fields render the selected state and court distinctly', () => {
    const html = renderToStaticMarkup(<JurisdictionFields scope={{ jurisdiction: 'Ebonyi State', court: 'High Court of a State', division: 'Abakaliki', lawAsAt: '2026-09-16' }} onChange={vi.fn()} />);
    expect(html).toContain('value="Ebonyi State" selected=""');
    expect(html).toContain('Abakaliki');
  });
  it('drafting offers all states and does not silently fall back to Lagos', () => {
    const mode = LEGAL_SKILL_MODES.find(m => m.id === 'draft-document');
    expect(mode).toBeTruthy();
    const field = mode.extraFields.find(f => f.key === 'governing_law');
    expect(field.options).toEqual(GOVERNING_LAW_OPTIONS);
    for (const label of NIGERIAN_JURISDICTIONS) expect(field.options).toContain(label);
    expect(mode.userPrefix({})).toContain('Not yet established');
    expect(mode.userPrefix({})).not.toContain('Lagos');
  });
  it('compliance keeps cross-border scope separate from the common state selector', () => {
    const mode = LEGAL_SKILL_MODES.find(m => m.id === 'compliance-check');
    expect(mode.extraFields.some(f => f.key === 'cross_border')).toBe(true);
    expect(mode.extraFields.some(f => f.key === 'jurisdiction')).toBe(false);
  });
  it('applies nationwide, date-sensitive reliability rules to all AI tasks', () => {
    expect(LEGAL_REASONING_POLICY).toContain('all 36 states and the FCT');
    expect(LEGAL_REASONING_POLICY).toContain('Never use Lagos or FCT as a silent fallback');
    expect(LEGAL_SKILL_MODES).toHaveLength(7);
  });
});

