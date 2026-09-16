import { describe, it, expect, vi, afterEach } from 'vitest';
import { parseVerdicts } from '../src/lexi/webSearch.js';
import { generate } from '../src/lexi/ai.js';
import { practiceDirectionContext, PRACTICE_DIRECTIONS } from '../src/lexi/practiceDirections.js';
import { legalSystemInstruction } from '../src/lexi/legalPolicy.js';

afterEach(() => vi.unstubAllGlobals());
describe('Legal grounding safeguards', () => {
  const cases = [{ name: 'A v B' }, { name: 'C v D' }];
  it('does not confuse NOT REAL with REAL', () => {
    expect(parseVerdicts('1. NOT REAL | A v B | - | https://example.com | note', cases)[0].verdict).toBe('UNCERTAIN');
  });
  it('rejects fabricated confirming URLs and preserves omitted inputs', () => {
    const rows = parseVerdicts('2. REAL | C v D | citation | https://invented.com | note', cases, [{ uri: 'https://official.com' }]);
    expect(rows.map(r => r.name)).toEqual(['A v B', 'C v D']);
    expect(rows.every(r => r.verdict === 'UNCERTAIN')).toBe(true);
  });
  it('requires exact source support and matching input identity', () => {
    const text = '2. REAL | C v D | cite | https://official.com | check holding';
    expect(parseVerdicts(text, cases, [{ uri: 'https://official.com' }])[1].verdict).toBe('REAL');
    expect(parseVerdicts(text.replace('C v D', 'Other case'), cases, [{ uri: 'https://official.com' }])[1].verdict).toBe('UNCERTAIN');
  });
  it('rejects duplicate numbered verdicts', () => {
    const row = '1. REAL | A v B | cite | https://official.com | note';
    expect(parseVerdicts(row + '\n' + row, cases, [{ uri: 'https://official.com' }])[0].verdict).toBe('UNCERTAIN');
  });
  it('covers all five states without importing neighbouring rules into Ebonyi', () => {
    expect(PRACTICE_DIRECTIONS.map(d => d.state)).toEqual(['Ebonyi', 'Abia', 'Anambra', 'Enugu', 'Imo']);
    const context = practiceDirectionContext('Ebonyi High Court filing');
    expect(context).toContain('manual review');
    expect(context).not.toContain('N5 million');
    expect(practiceDirectionContext('Imo appeal')).toContain('unavailable');
    expect(practiceDirectionContext('Some important topic')).toBe('');
  });
  it('applies reliability instructions even when a caller supplies no system prompt', () => {
    expect(legalSystemInstruction('', [{ parts: [{ text: 'Enugu procedure' }] }])).toContain('Article 5');
    expect(legalSystemInstruction('Draft a motion')).toContain('mandatory for every task');
  });
  it('never falls back to memory when requested live search fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 400, json: async () => ({ error: { message: 'Unsupported search' } }) });
    vi.stubGlobal('fetch', fetchMock);
    await expect(generate({ apiKey: 'test', userText: 'Verify a case', webGrounding: true })).rejects.toThrow('Unsupported search');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).tools).toEqual([{ google_search: {} }]);
  });
  it('rejects source-less live answers and empty responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: 'Trust me' }] } }] }) }));
    await expect(generate({ apiKey: 'test', webGrounding: true })).rejects.toThrow('no source links');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ candidates: [] }) }));
    await expect(generate({ apiKey: 'test' })).rejects.toThrow('No usable answer');
  });
});
