import { describe, it, expect } from 'vitest';
import mammoth from 'mammoth';
import { libraryItems, filterLibrary } from '../src/lexi/library.js';
import { exportBlocks, exportBodyHtml } from '../src/lexi/exportBlocks.js';
import { createDocxBlob, htmlDocument } from '../src/lexi/exports.js';
import { LIMITATION_PERIODS, PROCEDURAL_TEMPLATES } from '../src/lexi/courtData.js';

describe('saved library', () => {
  const items = libraryItems({ analyses: [{ id: 'a', title: 'Ebonyi pleading', content: 'Abakaliki', caseId: 'c' }], templates: [{ id: 'a', name: 'Affidavit', content: 'Enugu', category: 'Evidence' }] });
  it('does not collide analysis and template identifiers', () => { expect(new Set(items.map(item => item.libraryId)).size).toBe(2); });
  it('searches saved body text and categories', () => { expect(filterLibrary(items, { query: 'abakaliki' })[0].kind).toBe('analysis'); expect(filterLibrary(items, { query: 'evidence' })[0].kind).toBe('template'); });
  it('filters by matter and item type without mutating input', () => { expect(filterLibrary(items, { caseId: 'unfiled', kind: 'template' })).toHaveLength(1); expect(items[0].title).toBe('Ebonyi pleading'); });
});
describe('clean legal document export', () => {
  const text = '# Advice\n**Important:** verify the law.\n- Review source\n| State | Amount |\n| --- | --- |\n| Ebonyi | ₦50,000 |\nhttps://example.org/source';
  it('creates real table blocks and escapes executable markup', () => { expect(exportBlocks(text).find(block => block.type === 'table').rows).toHaveLength(2); expect(exportBodyHtml('<script>alert(1)</script>')).not.toContain('<script>'); });
  it('renders print tables, readable margins and excludes banking details', () => { const html = htmlDocument(text, { profile: { bankDetails: 'PRIVATE BANK ACCOUNT' } }); expect(html).toContain('<table>'); expect(html).toContain('thead'); expect(html).toContain('25mm'); expect(html).not.toContain('PRIVATE BANK ACCOUNT'); });
  it('creates a genuine OOXML zip which Word parsers can read, preserving tables and currency', async () => {
    const blob = await createDocxBlob(text, { title: 'Legal Advice', profile: { firmName: 'Test Chambers' } });
    const buffer = Buffer.from(await blob.arrayBuffer());
    expect(buffer.subarray(0, 2).toString()).toBe('PK');
    const result = await mammoth.extractRawText({ buffer });
    expect(result.value).toContain('Test Chambers'); expect(result.value).toContain('₦50,000'); expect(result.value).toContain('https://example.org/source');
  });
});
describe('legacy diary periods', () => {
  it('never supplies an unverified automatic nationwide limitation period', () => { expect(LIMITATION_PERIODS.every(period => period.days === null && period.reviewRequired)).toBe(true); });
  it('keeps procedural checklist identifiers but requires reviewed dates', () => { expect(PROCEDURAL_TEMPLATES.high_court[0].id).toBe('appearance'); expect(Object.values(PROCEDURAL_TEMPLATES).flat().every(item => item.dueDays === null && item.reviewRequired)).toBe(true); });
});
