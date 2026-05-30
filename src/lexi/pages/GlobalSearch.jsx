// ============================================================
// lexi/pages/GlobalSearch.jsx — cross-cutting workspace search
// ============================================================

import React, { useState, useMemo } from 'react';
import { Search, FolderOpen, Users, FileText, History as HistoryIcon } from 'lucide-react';
import { useApp } from '../AppContext.jsx';
import { Card, Input, Badge, PageHeader, EmptyState } from '../components/ui.jsx';
import { formatDate, truncate } from '../utils.js';

export function GlobalSearch() {
  const { cases, clients, analyses, aiHistory, navigate } = useApp();
  const [q, setQ] = useState('');

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return null;
    const match = (s) => (s || '').toLowerCase().includes(term);
    return {
      cases: cases.filter((c) => match(c.title) || match(c.suitNo) || match(c.court) || match(c.notes)),
      clients: clients.filter((c) => match(c.name) || match(c.email) || match(c.phone)),
      analyses: analyses.filter((a) => match(a.title) || match(a.content)),
      history: aiHistory.filter((h) => match(h.prompt) || match(h.feature)),
    };
  }, [q, cases, clients, analyses, aiHistory]);

  const total = results ? results.cases.length + results.clients.length + results.analyses.length + results.history.length : 0;

  return (
    <div className="space-y-6">
      <PageHeader icon={Search} title="Global Search" subtitle="Search across cases, clients, saved analyses and AI history at once" gradient="from-slate-500 to-slate-700" />

      <Card variant="glass">
        <Input leftIcon={<Search className="w-5 h-5" />} placeholder="Search the whole workspace…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      </Card>

      {results && total === 0 && <EmptyState icon={Search} title="No matches" description={`Nothing found for “${q}”.`} />}

      {results && total > 0 && (
        <div className="space-y-5">
          <Group title="Cases" icon={FolderOpen} count={results.cases.length}>
            {results.cases.map((c) => (
              <Row key={c.id} onClick={() => navigate('cases')} title={c.title} sub={`${c.suitNo}${c.court ? ` · ${c.court}` : ''}`} tag={c.status} />
            ))}
          </Group>
          <Group title="Clients" icon={Users} count={results.clients.length}>
            {results.clients.map((c) => (
              <Row key={c.id} onClick={() => navigate('clients')} title={c.name} sub={c.email || c.phone || ''} tag={c.type} />
            ))}
          </Group>
          <Group title="Saved analyses" icon={FileText} count={results.analyses.length}>
            {results.analyses.map((a) => (
              <Row key={a.id} onClick={() => navigate(a.caseId ? 'cases' : 'profile')} title={a.title} sub={truncate(a.content, 90)} tag={formatDate(a.createdAt)} />
            ))}
          </Group>
          <Group title="AI history" icon={HistoryIcon} count={results.history.length}>
            {results.history.map((h) => (
              <Row key={h.id} onClick={() => navigate('ai')} title={truncate(h.prompt, 80)} sub={h.feature} tag={formatDate(h.ts)} />
            ))}
          </Group>
        </div>
      )}
    </div>
  );
}

function Group({ title, icon: Icon, count, children }) {
  if (!count) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
        <Icon className="w-4 h-4" /> {title} <Badge variant="default">{count}</Badge>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ title, sub, tag, onClick }) {
  return (
    <button onClick={onClick} className="w-full text-left">
      <Card variant="flat" hover className="py-3 px-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium text-slate-800 dark:text-slate-100 truncate">{title}</p>
            {sub && <p className="text-xs text-slate-400 truncate">{sub}</p>}
          </div>
          {tag && <Badge variant="default" className="capitalize flex-shrink-0">{tag}</Badge>}
        </div>
      </Card>
    </button>
  );
}
