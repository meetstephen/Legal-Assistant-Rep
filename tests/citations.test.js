import { describe, it, expect } from 'vitest';
import {
  auditCitations,
  retrieveStatutes,
  statuteGroundingBlock,
  registerVerifiedCases,
  VERIFIED_CASES,
} from '../src/lexi/citations.js';

describe('citation audit', () => {
  it('flags a known verified case as verified', () => {
    const r = auditCitations('See Garba v University of Maiduguri on fair hearing.');
    expect(r.items.length).toBeGreaterThanOrEqual(1);
    const garba = r.items.find((i) => /Garba/.test(i.name));
    expect(garba).toBeTruthy();
    expect(garba.status).toBe('verified');
  });

  it('flags an unknown case with hallucination risk as suspicious', () => {
    const r = auditCitations('In Imaginary Plaintiff v Fictional Defendant (2099) the court held...');
    const hit = r.items.find((i) => /Imaginary/.test(i.name));
    expect(hit).toBeTruthy();
    expect(hit.status).toBe('suspicious');
    expect(hit.hallucinationRisk).toMatch(/future year/);
  });

  it('flags an unknown case without risk signals as unverified', () => {
    const r = auditCitations('As held in Adamu v Bello (2018) 5 NWLR (Pt 1200) 100.');
    const hit = r.items.find((i) => /Adamu/.test(i.name));
    expect(hit).toBeTruthy();
    expect(hit.status).toBe('unverified');
    expect(hit.hallucinationRisk).toBe('');
  });

  it('detects repealed instruments', () => {
    const r = auditCitations('Relying on the Companies and Allied Matters Act 1990.');
    expect(r.repealed.length).toBeGreaterThanOrEqual(1);
  });

  it('detects foreign authorities', () => {
    const r = auditCitations('As in Donoghue v Stevenson (1932) AC 562.');
    expect(r.foreign.length).toBeGreaterThanOrEqual(1);
  });
});

describe('statute RAG', () => {
  it('retrieves relevant provisions by keyword', () => {
    const hits = retrieveStatutes('electronic evidence admissibility email', 5);
    expect(hits.some((h) => /84/.test(h.provision))).toBe(true);
  });

  it('builds a grounding block string', () => {
    const block = statuteGroundingBlock('fair hearing natural justice');
    expect(typeof block).toBe('string');
    expect(block).toMatch(/VERIFIED NIGERIAN STATUTE GROUNDING/);
  });
});

describe('admin-registered cases', () => {
  it('newly registered cases become verifiable', () => {
    const before = VERIFIED_CASES.length;
    registerVerifiedCases([{ name: 'Test Appellant v Test Respondent', citation: '(2025) 1 TEST 1', court: 'Supreme Court', holding: 'x' }]);
    expect(VERIFIED_CASES.length).toBe(before + 1);
    const r = auditCitations('Citing Test Appellant v Test Respondent here.');
    const hit = r.items.find((i) => /Test Appellant/.test(i.name));
    expect(hit.status).toBe('verified');
  });
});
