// Dependency-free integrity checks; complements, does not replace, Vitest.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';
import console from 'node:console';
const root = new URL('../', import.meta.url);
const read = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const index = read('src/lexi/data/practiceCorpusIndex.json');
const categories = new Set(['small-claims', 'civil', 'criminal', 'appeals', 'adr', 'electronic', 'service', 'general']);
assert.equal(new Set(index.map(d => d.id)).size, index.length);
for (const meta of index) {
  const doc = read(`public/practice-directions/${meta.id}.json`);
  assert(categories.has(meta.category), `Untracked category: ${meta.id}`);
  for (const key of ['id', 'state', 'category', 'url', 'sha256', 'pageCount', 'extractionStatus']) assert.equal(doc[key], meta[key]);
  assert.equal(doc.pages.length, meta.pageCount);
  assert.equal(meta.currentForce, 'not-confirmed');
  assert(doc.pages.every((p, i) => p.page === i + 1 && typeof p.text === 'string'));
  assert.deepEqual(doc.reviewedExcerpts || [], meta.reviewedExcerpts || []);
  for (const p of doc.reviewedExcerpts || []) assert(p.page >= 1 && p.page <= doc.pageCount && p.label && p.text);
  if (meta.extractionStatus === 'text-available') assert(!meta.ocrUsed, `Unreviewed OCR must not be generally retrievable: ${meta.id}`);
}
const ebonyi = read('public/practice-directions/ebonyi-small-claims-2024.json');
assert.equal(ebonyi.extractionStatus, 'reviewed-excerpts');
const text = ebonyi.reviewedExcerpts.map(p => p.text).join('\n');
for (const phrase of ['N1,000,000', 'Six (6) days', 'within eight (8) days', 'shall not be invalid']) assert(text.includes(phrase));
const general = index.find(d => d.id === 'imo-general-directives');
assert.equal(general.sha256, index.find(d => d.id === 'imo-small-claims').sha256);
assert.equal(general.extractionStatus, 'identity-review-required');
const usable = index.filter(d => ['text-available', 'reviewed-excerpts'].includes(d.extractionStatus));
console.log(`Corpus checks passed: ${index.length} instrument records; ${usable.length} usable text/excerpt records across ${new Set(usable.map(d => d.state)).size} jurisdictions. Not current-force certification.`);

