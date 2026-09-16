import React, { useState } from 'react';
import { BookOpen, ExternalLink } from 'lucide-react';
import { PRACTICE_DIRECTIONS, REVIEWED_ON, JURISDICTIONS, SOURCE_KIND_LABELS, filterPracticeDirections } from '../practiceDirections.js';
import { Card, PageHeader, Badge, Input } from '../components/ui.jsx';

export function PracticeDirections() {
  const [state, setState] = useState('Ebonyi');
  const [zone, setZone] = useState('All');
  const [sourceKind, setSourceKind] = useState('All');
  const [query, setQuery] = useState('');
  const entries = filterPracticeDirections({ state, zone, sourceKind, query });
  const zones = [...new Set(PRACTICE_DIRECTIONS.map(d => d.zone))].sort();
  return (
    <div className="space-y-6">
      <PageHeader icon={BookOpen} title="State & FCT Practice Directions" subtitle="Nationwide source discovery — all 36 states and the Federal Capital Territory" />
      <Card className="space-y-3">
        <p className="text-sm">Reviewed {REVIEWED_ON}. All jurisdictions are indexed, but not every entry has verified direction text. Documents, catalogues, contact leads and reports are labelled separately. Confirm signed text, amendments, commencement, court designation and registry requirements before filing.</p>
        <div className="flex flex-wrap gap-3 text-sm">
          <label>State / FCT
            <select value={state} onChange={e => { setState(e.target.value); setZone('All'); }} className="ml-2 rounded border p-2 bg-white dark:bg-slate-900">
              <option value="All">All jurisdictions</option>
              {JURISDICTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label>Zone
            <select value={zone} onChange={e => { setZone(e.target.value); setState('All'); }} className="ml-2 rounded border p-2 bg-white dark:bg-slate-900">
              <option>All</option>
              {zones.map(z => <option key={z}>{z}</option>)}
            </select>
          </label>
          <label>Source type
            <select value={sourceKind} onChange={e => setSourceKind(e.target.value)} className="ml-2 rounded border p-2 bg-white dark:bg-slate-900">
              <option value="All">All source types</option>
              {Object.entries(SOURCE_KIND_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </label>
        </div>
        <Input aria-label="Search practice-direction sources" placeholder="Search subject, title or verification notes" value={query} onChange={e => setQuery(e.target.value)} />
        <p className="text-xs">{entries.length} matching entries. Nationwide index: {PRACTICE_DIRECTIONS.length} jurisdictions; {PRACTICE_DIRECTIONS.filter(d => d.sourceKind === 'gap').length} with no confirmed direction-text link. A link is not proof of current force.</p>
      </Card>
      {!entries.length && <Card>No matching entries. Adjust the state, zone, source type or search.</Card>}
      {entries.map(d => (
        <Card key={d.state} className="space-y-3">
          <div className="flex flex-wrap gap-2"><Badge>{d.state}</Badge><Badge>{d.zone}</Badge><Badge>{SOURCE_KIND_LABELS[d.sourceKind]}</Badge></div>
          <h2 className="font-semibold">{d.title}</h2>
          <p className="text-sm text-amber-600 dark:text-amber-400">{d.status}</p>
          <p className="text-sm">{d.notes}</p>
          {d.url ? <a href={d.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-emerald-600 hover:underline"><ExternalLink className="w-4 h-4" />{d.sourceKind === 'document' ? 'Open published document' : 'Open source lead'}</a> : <p className="text-sm text-amber-600">No confirmed official direction-text link. Request signed current text from the judiciary or registry; this does not mean directions do not exist.</p>}
          <p className="text-xs text-slate-500">Source review: {d.reviewedOn}. Subsequent amendments are not automatically tracked.</p>
        </Card>
      ))}
      <Card className="space-y-2 text-sm">
        <h2 className="font-semibold">Before relying on a procedural answer</h2>
        <p>Check subject-matter and territorial jurisdiction; applicable High Court/Magistrates'/District Court rules; state ACJL; pre-action protocols; service; filing and appeal triggers; prescribed forms; holidays and extensions. Small-claims directions do not govern every proceeding. FCT High Court is distinct from the Federal High Court.</p>
        <p>Scanned, unavailable, unsigned or mismatched documents must be resolved with the issuing court. The AI receives jurisdiction-specific source leads and uncertainty flags, not invented missing rules.</p>
      </Card>
    </div>
  );
}
