import React, { useState } from 'react';
import { BookOpen, ExternalLink } from 'lucide-react';
import { PRACTICE_DIRECTIONS, REVIEWED_ON } from '../practiceDirections.js';
import { Card, PageHeader, Badge } from '../components/ui.jsx';

export function PracticeDirections() {
  const [state, setState] = useState('Ebonyi');
  const entries = PRACTICE_DIRECTIONS.filter(d => state === 'All' || d.state === state);
  return (
    <div className="space-y-6">
      <PageHeader icon={BookOpen} title="State Practice Directions" subtitle="Official-source discovery for Ebonyi and the South-East states" />
      <Card className="space-y-3">
        <p className="text-sm">Reviewed {REVIEWED_ON}. This is a scoped discovery library, not a complete collection of current court rules. Confirm the signed document, amendments, commencement, court designation and registry requirements before filing. Small-claims rules do not govern every proceeding.</p>
        <label className="block text-sm">State
          <select value={state} onChange={e => setState(e.target.value)} className="ml-3 rounded border p-2 bg-white dark:bg-slate-900">
            {['Ebonyi', 'Abia', 'Anambra', 'Enugu', 'Imo', 'All'].map(s => <option key={s}>{s}</option>)}
          </select>
        </label>
      </Card>
      {entries.map(d => (
        <Card key={d.state} className="space-y-3">
          <Badge>{d.state}</Badge>
          <h2 className="font-semibold">{d.title}</h2>
          <p className="text-sm text-amber-600 dark:text-amber-400">{d.status}</p>
          <p className="text-sm">{d.notes}</p>
          <a href={d.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-emerald-600 hover:underline"><ExternalLink className="w-4 h-4" />Open official source</a>
        </Card>
      ))}
      <Card className="space-y-2 text-sm">
        <h2 className="font-semibold">Before relying on a procedural answer</h2>
        <p>Check subject-matter and territorial jurisdiction; applicable High Court/Magistrates' rules; state ACJL; pre-action protocols; service; filing and appeal triggers; prescribed forms; holidays and extensions. Never borrow Lagos or another state's rules just because a local source is unavailable.</p>
        <p>For Ebonyi's scanned PDF and Imo's unavailable downloads, obtain readable signed text from the judiciary or registry. The AI has these source leads and uncertainty flags, not invented provisions.</p>
      </Card>
    </div>
  );
}
