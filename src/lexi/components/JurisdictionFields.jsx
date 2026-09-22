import React from 'react';
import { Select, Input } from './ui.jsx';
import { COURTS } from '../legalData.js';
import { NIGERIAN_JURISDICTIONS } from '../jurisdictions.js';

export function JurisdictionFields({ scope, onChange, jurisdictionRef, error }) {
  const update = (key, value) => onChange({ ...scope, [key]: value });
  return <div className="space-y-2">
    <div className="grid sm:grid-cols-2 gap-3">
      <Select ref={jurisdictionRef} label="Matter jurisdiction * (all states + FCT)" value={scope.jurisdiction} error={error} onChange={e => update('jurisdiction', e.target.value)}
        options={[{ value: '', label: 'Select the actual state, FCT or federal scope' }, ...NIGERIAN_JURISDICTIONS.map(j => ({ value: j, label: j }))]} />
      <Select label="Court / forum (if established)" value={scope.court} onChange={e => update('court', e.target.value)}
        options={[{ value: '', label: 'Not yet established / non-contentious matter' }, ...COURTS.map(c => ({ value: c, label: c }))]} />
      <Input label="Judicial division / location" value={scope.division} onChange={e => update('division', e.target.value)} />
      <Input label="Law-as-at date (give event dates in facts)" type="date" value={scope.lawAsAt} onChange={e => update('lawAsAt', e.target.value)} />
    </div>
    <p className="text-xs text-amber-700 dark:text-amber-400">State selection scopes the research; it does not verify the law or establish court competence. Federal courts use their own rules. Missing operative state sources must be disclosed.</p>
  </div>;
}
