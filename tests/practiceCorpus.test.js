import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { PRACTICE_CORPUS, practiceCoverage, practiceScope, preparePracticeEvidence, clearPracticeCache, loadPracticeDocument, rankPracticeExcerpts } from '../src/lexi/practiceCorpus.js';
import { JURISDICTIONS } from '../src/lexi/practiceDirections.js';
import { generate, streamGenerate } from '../src/lexi/ai.js';

function snapshot(id) { return JSON.parse(readFileSync(new URL(`../public/practice-directions/${id}.json`, import.meta.url), 'utf8')); }
function localFetch(url) {
  const id = url.match(/\/practice-directions\/([a-z0-9-]+)\.json$/)?.[1];
  if (!id) throw new Error('Unexpected request');
  return Promise.resolve({ ok: true, text: async () => JSON.stringify(snapshot(id)) });
}
afterEach(() => { vi.unstubAllGlobals(); clearPracticeCache(); });

describe('Court-specific document corpus', () => {
  it('tracks eight distinct coverage categories for every jurisdiction without pretending gaps are filled', () => {
    for (const state of JURISDICTIONS) expect(practiceCoverage(state)).toHaveLength(8);
    expect(practiceCoverage('Ebonyi').find(p => p.category === 'civil').available).toBe(0);
    expect(practiceCoverage('Ebonyi').find(p => p.category === 'small-claims').available).toBe(1);
    expect(practiceCoverage('Lagos').every(p => p.available === 0)).toBe(true);
  });
  it('preserves source metadata and complete page addresses in every snapshot', () => {
    for (const meta of PRACTICE_CORPUS) {
      const doc = snapshot(meta.id);
      expect(doc.id).toBe(meta.id);
      expect(doc.pages).toHaveLength(meta.pageCount);
      expect(doc.url).toMatch(/^https:\/\//);
      expect(doc.currentForce).toBe('not-confirmed');
      expect(doc.pages.every((p, i) => p.page === i + 1)).toBe(true);
    }
  });
  it('keeps actual Ebonyi provisions separately from unchecked OCR', () => {
    const doc = snapshot('ebonyi-small-claims-2024');
    expect(doc.extractionStatus).toBe('reviewed-excerpts');
    const text = rankPracticeExcerpts(doc, 'Ebonyi small claims defence appeal').map(p => p.text).join('\n');
    expect(text).toContain('N1,000,000');
    expect(text).toContain('Six (6) days');
    expect(text).toContain('within eight (8) days');
    expect(text).toContain('shall not be invalid');
    expect(rankPracticeExcerpts(doc, 'appeal').every(p => p.method === 'visual-transcription')).toBe(true);
  });
  it('excludes the Imo general download whose contents duplicate small claims', async () => {
    const general = snapshot('imo-general-directives');
    expect(general.sha256).toBe(snapshot('imo-small-claims').sha256);
    expect(general.extractionStatus).toBe('identity-review-required');
    const result = await preparePracticeEvidence('Imo civil High Court pre-action procedure');
    expect(result.sources).toEqual([]);
    expect(result.context).toContain('no usable text collected');
  });
  it('does not infer small claims from a debt or ordinary High Court query', () => {
    expect(practiceScope('Ebonyi High Court debt defence').categories).toEqual([]);
    expect(practiceScope('Ebonyi civil suit').categories).toEqual(['civil']);
    expect(practiceScope('Ebonyi small-claims appeal').categories).toEqual(['small-claims']);
    expect(practiceScope('Akwa-Ibom criminal case').states).toEqual(['Akwa Ibom']);
    expect(practiceScope('Nigeria civil proceedings').states).toEqual([]);
  });
  it('does not mistake a federal court located in a state or Abuja for the state/FCT court', async () => {
    const result = await preparePracticeEvidence('Abuja Federal High Court service of process');
    expect(result.sources).toEqual([]);
    expect(result.context).toContain('No state corpus text retrieved');
  });
  it('retrieves only the selected jurisdiction and produces page-linked, bounded evidence', async () => {
    vi.stubGlobal('fetch', vi.fn(localFetch));
    const evidence = await preparePracticeEvidence('Ebonyi small claims appeal filing deadline');
    expect(evidence.context).toContain('within eight (8) days');
    expect(evidence.context).not.toContain('Anambra');
    expect(evidence.sources.some(s => s.uri.endsWith('#page=9'))).toBe(true);
    expect(evidence.sources.every(s => s.kind === 'court-corpus')).toBe(true);
    expect(evidence.context.length).toBeLessThan(16500);
  });
  it('caches successful document loads without caching failures', async () => {
    const mock = vi.fn(localFetch); vi.stubGlobal('fetch', mock);
    await loadPracticeDocument('ebonyi-small-claims-2024');
    await loadPracticeDocument('ebonyi-small-claims-2024');
    expect(mock).toHaveBeenCalledTimes(1);
    clearPracticeCache(); mock.mockResolvedValueOnce({ ok: false });
    await expect(loadPracticeDocument('ebonyi-small-claims-2024')).rejects.toThrow('could not be loaded');
    await loadPracticeDocument('ebonyi-small-claims-2024');
    expect(mock).toHaveBeenCalledTimes(3);
  });
  it('rejects mismatched snapshots, unknown IDs and cancelled requests', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => JSON.stringify({ ...snapshot('ebonyi-small-claims-2024'), state: 'Lagos' }) }));
    await expect(loadPracticeDocument('ebonyi-small-claims-2024')).rejects.toThrow('does not match');
    await expect(loadPracticeDocument('../private')).rejects.toThrow('No collected document');
    const controller = new AbortController(); controller.abort();
    await expect(loadPracticeDocument('ebonyi-small-claims-2024', { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
  });
  it('exposes loading failures as gaps rather than pretending source evidence was supplied', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Offline')));
    const evidence = await preparePracticeEvidence('Ebonyi small claims appeal');
    expect(evidence.sources).toEqual([]);
    expect(evidence.context).toContain('No memory fallback');
  });
  it('supplies corpus evidence to generation without treating it as live search verification', async () => {
    vi.stubGlobal('fetch', vi.fn((url, opts) => {
      if (url.includes('/practice-directions/')) return localFetch(url);
      expect(JSON.parse(opts.body).systemInstruction.parts[0].text).toContain('within eight (8) days');
      return Promise.resolve({ ok: true, json: async () => ({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'Conditional advice' }] } }] }) });
    }));
    const result = await generate({ apiKey: 'test', userText: 'Ebonyi small claims appeal' });
    expect(result.grounded).toBe(false);
    expect(result.sources.length).toBeGreaterThan(0);
    await expect(generate({ apiKey: 'test', userText: 'Ebonyi small claims appeal', webGrounding: true })).rejects.toThrow('no source links');
  });
  it('uses the newest user jurisdiction in streamed conversations', async () => {
    vi.stubGlobal('fetch', vi.fn((url, opts) => {
      expect(url).not.toContain('practice-directions');
      const prompt = JSON.parse(opts.body).systemInstruction.parts[0].text;
      expect(prompt).toContain('Lagos / Civil proceedings: no usable text collected');
      const text = 'data: ' + JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'Missing current Lagos text' }] } }] }) + '\n';
      return Promise.resolve({ ok: true, body: new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode(text)); c.close(); } }) });
    }));
    const result = await streamGenerate({ apiKey: 'test', thinking: false, messages: [{ role: 'user', text: 'Ebonyi small claims appeal' }, { role: 'model', text: 'Earlier answer' }, { role: 'user', text: 'Now Lagos civil filing' }] });
    expect(result.sources).toEqual([]);
  });
});

