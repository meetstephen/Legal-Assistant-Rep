import React, { useState, useMemo } from 'react';
import { Library as LibraryIcon, Search, FileText, Trash2 } from 'lucide-react';
import { useApp } from '../AppContext.jsx';
import { libraryItems, filterLibrary } from '../library.js';
import { Card, Button, Input, Select, Badge, PageHeader, EmptyState } from '../components/ui.jsx';
import { AiResult } from '../components/AiResult.jsx';
import { formatDate, truncate } from '../utils.js';

export function Library() {
  const { analyses = [], templates = [], cases = [], pageParams, navigate, deleteAnalysis, deleteTemplate, showToast } = useApp();
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('all');
  const [caseId, setCaseId] = useState('all');
  const [sort, setSort] = useState('newest');
  const [selectedId, setSelectedId] = useState(pageParams?.libraryId || '');
  const items = useMemo(() => libraryItems({ analyses, templates }), [analyses, templates]);
  const filtered = useMemo(() => filterLibrary(items, { query, kind, caseId, sort }), [items, query, kind, caseId, sort]);
  const selected = items.find(item => item.libraryId === selectedId);
  React.useEffect(() => { if (pageParams?.libraryId) setSelectedId(pageParams.libraryId); }, [pageParams]);
  const remove = item => {
    if (!window.confirm(`Delete “${item.title}” from your saved library? This cannot be undone.`)) return;
    if (item.kind === 'analysis') deleteAnalysis(item.id); else deleteTemplate(item.id);
    setSelectedId(''); showToast('success', 'Saved item removed.');
  };
  return <div className="space-y-5">
    <PageHeader icon={LibraryIcon} title="Saved Library" subtitle="Find and open saved analyses, drafts and document templates" gradient="from-slate-600 to-slate-900" />
    <Card variant="glass" className="space-y-3">
      <Input label="Search saved content" leftIcon={<Search className="w-4 h-4" />} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search titles, body text or template categories" />
      <div className="grid sm:grid-cols-3 gap-3">
        <Select label="Item type" value={kind} onChange={e => setKind(e.target.value)} options={[{ value: 'all', label: 'All saved items' }, { value: 'analysis', label: 'Analyses and drafts' }, { value: 'template', label: 'Templates' }]} />
        <Select label="Matter" value={caseId} onChange={e => setCaseId(e.target.value)} options={[{ value: 'all', label: 'All matters' }, { value: 'unfiled', label: 'Unfiled / general items' }, ...cases.map(c => ({ value: c.id, label: c.title }))]} />
        <Select label="Sort" value={sort} onChange={e => setSort(e.target.value)} options={[{ value: 'newest', label: 'Newest saved first' }, { value: 'title', label: 'Title A–Z' }]} />
      </div>
      <p className="text-xs text-slate-500">{filtered.length} matching items. Outputs appear here after you choose Save. Downloaded files are not automatically uploaded or indexed.</p>
    </Card>
    {selected && <Card className="space-y-3">
      <div className="flex justify-between gap-3 flex-wrap"><h2 className="font-semibold text-lg">{selected.title}</h2><div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => navigate('ai', { prefill: selected.content })}>Use in AI Assistant</Button>
        <Button size="sm" variant="secondary" onClick={() => setSelectedId('')}>Close item</Button>
      </div></div>
      <AiResult ai={{ text: selected.content, cleanText: selected.content, running: false, grounded: selected.grounded, sources: selected.sources || [], queries: selected.queries || [], scores: selected.scores }} title={selected.title} exportTitle={selected.title} allowSave={false} />
    </Card>}
    {!filtered.length && <EmptyState icon={LibraryIcon} title="No saved items match" description="Save an AI result or add a template. Try clearing search and filters." />}
    <div className="space-y-2">{filtered.map(item => <Card key={item.libraryId} variant="flat" className="flex items-start gap-3">
      <FileText className="w-5 h-5 text-slate-400 shrink-0" />
      <button className="text-left flex-1 min-w-0" onClick={() => setSelectedId(item.libraryId)}>
        <span className="font-semibold block">{item.title}</span><span className="text-sm text-slate-500 block">{truncate(item.content, 150)}</span>
        <span className="text-xs text-slate-400">{item.createdAt ? formatDate(item.createdAt) : 'Template / date not recorded'} · {cases.find(c => c.id === item.caseId)?.title || (item.caseId ? 'Linked matter unavailable' : 'Unfiled')}</span>
      </button>
      <Badge variant="default">{item.kind === 'analysis' ? 'Saved output' : 'Template'}</Badge>
      <Button size="sm" variant="danger" aria-label={`Delete ${item.title}`} onClick={() => remove(item)} leftIcon={<Trash2 className="w-4 h-4" />} />
    </Card>)}</div>
  </div>;
}
