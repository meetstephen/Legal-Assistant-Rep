import React, { useState } from 'react';
import { PRACTICE_CORPUS, PRACTICE_CATEGORIES, CORPUS_STATUS, usableDocument, practiceCoverage, loadPracticeDocument } from '../practiceCorpus.js';
import { Card, Badge, Button, Input } from './ui.jsx';

function DocumentText({ doc }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  async function open() {
    setLoading(true); setError('');
    try { setData(await loadPracticeDocument(doc.id)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }
  const pages = data?.extractionStatus === 'reviewed-excerpts' ? data.reviewedExcerpts : data?.pages;
  return <div className="space-y-2">
    {usableDocument(doc) && !data && <Button onClick={open} disabled={loading}>{loading ? 'Loading…' : 'Read collected page text'}</Button>}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    {data && <>
      <Button onClick={() => setData(null)}>Close text</Button>
      <Input aria-label={`Search pages of ${doc.title}`} placeholder="Search within this document" value={search} onChange={e => setSearch(e.target.value)} />
      <div className="max-h-96 overflow-y-auto space-y-4 border rounded p-3">
        {pages.filter(p => p.text.toLowerCase().includes(search.trim().toLowerCase())).map((p, i) => <section key={`${p.page}-${i}`}>
          <a className="text-emerald-600 underline text-sm" href={`${doc.url}#page=${p.page}`} target="_blank" rel="noopener noreferrer">PDF page {p.page} — confirm original</a>
          <p className="text-xs">{p.label || `${p.method}: extraction may contain errors or missing scanned content`}</p>
          <pre className="text-sm whitespace-pre-wrap font-sans mt-2">{p.text || '[No readable text on this page]'}</pre>
        </section>)}
        {!pages.some(p => p.text.toLowerCase().includes(search.trim().toLowerCase())) && <p>No matching page text.</p>}
      </div>
    </>}
  </div>;
}

export function PracticeCorpus({ states }) {
  const [category, setCategory] = useState('All');
  const docs = PRACTICE_CORPUS.filter(d => states.includes(d.state) && (category === 'All' || category === d.category));
  return <Card className="space-y-4">
    <h2 className="font-semibold">Actual court-document library & coverage gaps</h2>
    <p className="text-sm">This is a growing collection, not comprehensive operative-law coverage. All 36 states and FCT are tracked below. Small-claims documents do not fill civil, criminal or general High Court gaps. “Collected” means text is available, not that it remains in force.</p>
    <label className="text-sm">Court procedure category
      <select className="ml-2 border rounded p-2 bg-white dark:bg-slate-900" value={category} onChange={e => setCategory(e.target.value)}>
        <option value="All">All categories</option>
        {Object.entries(PRACTICE_CATEGORIES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
      </select>
    </label>
    <div className="overflow-x-auto">
      <table className="text-xs w-full"><caption className="text-left mb-2">Usable collected instruments / pending review or download. A dash means no text collected, NOT that no directions exist.</caption>
        <thead><tr><th className="text-left p-2">State / FCT</th>{Object.entries(PRACTICE_CATEGORIES).filter(([id]) => category === 'All' || category === id).map(([id, label]) => <th key={id} className="p-2 text-left">{label}</th>)}</tr></thead>
        <tbody>{states.map(state => <tr key={state} className="border-t"><th className="text-left p-2">{state}</th>{practiceCoverage(state).filter(p => category === 'All' || p.category === category).map(p => <td key={p.category} className="p-2">{p.available || p.pending ? `${p.available} collected / ${p.pending} pending` : '—'}</td>)}</tr>)}</tbody>
      </table>
    </div>
    {!docs.length && <p className="text-sm text-amber-600">No document collected for this selection. Request signed current directions for the exact court and proceeding from its registry. Source leads below are not substitutes.</p>}
    {docs.map(doc => <section key={doc.id} className="border-t pt-4 space-y-2">
      <div className="flex flex-wrap gap-2"><Badge>{doc.state}</Badge><Badge>{PRACTICE_CATEGORIES[doc.category]}</Badge></div>
      <h3 className="font-semibold text-sm">{doc.title}</h3>
      <p className="text-xs">Court: {doc.court}</p>
      <p className="text-sm text-amber-600">{CORPUS_STATUS[doc.extractionStatus]}</p>
      <p className="text-xs">{doc.reviewNote} {doc.extractionNote}</p>
      {doc.emptyPages?.length > 0 && <p className="text-xs">Low-text / scanned pages: {doc.emptyPages.join(', ')}. A search miss is not proof that a provision is absent.</p>}
      <a className="text-sm text-emerald-600 underline" href={doc.url} target="_blank" rel="noopener noreferrer">Open original official-source PDF</a>
      <details className="text-xs"><summary>Provenance and limitations</summary><p className="break-all">Collection review: {doc.reviewedOn}; {doc.pageCount} PDF pages; SHA-256: {doc.sha256 || 'not downloaded'}. Current force: {doc.currentForce}. No automated amendment monitoring or counsel validation.</p></details>
      <DocumentText doc={doc} />
    </section>)}
  </Card>;
}

