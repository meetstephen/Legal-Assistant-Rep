// ============================================================
// lexi/pages/Tools.jsx — legal tools hub
//   ⏳ Limitation · 🧮 Deadline · 🏛️ Hierarchy · 📜 Maxims · 🛡️ AML/SCUML · 📋 Checklist
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  Wrench, Clock, Calculator, Building, ScrollText, ShieldCheck, ClipboardList,
  Search, Sparkles, AlertTriangle, CalendarPlus, Landmark, BookText, Globe,
} from 'lucide-react';
import { useApp } from '../AppContext.jsx';
import { useAiRun } from '../useAiRun.js';
import {
  LIMITATION_PERIODS, COURT_HIERARCHY, SPECIAL_COURT_NOTES, LEGAL_MAXIMS,
  AML_THRESHOLDS, AML_RED_FLAGS, MATTER_TYPES, COURTS,
  NIGERIAN_STATES, GEO_ZONES, STATE_COURT_RULES, RULES_OF_PROFESSIONAL_CONDUCT,
} from '../legalData.js';
import { computeDeadline } from '../helpers.js';
import { Card, Button, Input, Select, Badge, PageHeader } from '../components/ui.jsx';
import { AiResult } from '../components/AiResult.jsx';
import { formatDate, todayISO, cn } from '../utils.js';

const TABS = [
  { id: 'limitation', label: 'Limitation Periods', icon: Clock },
  { id: 'deadline', label: 'Deadline Calculator', icon: Calculator },
  { id: 'hierarchy', label: 'Court Hierarchy', icon: Building },
  { id: 'states', label: 'State Rules', icon: Landmark },
  { id: 'rpc', label: 'Prof. Conduct (RPC)', icon: BookText },
  { id: 'maxims', label: 'Legal Maxims', icon: ScrollText },
  { id: 'aml', label: 'AML / SCUML', icon: ShieldCheck },
  { id: 'checklist', label: 'Court Process Checklist', icon: ClipboardList },
];

export function Tools() {
  const [tab, setTab] = useState('limitation');
  return (
    <div className="space-y-6">
      <PageHeader icon={Wrench} title="Tools" subtitle="Reference tables, calculators, and the AI filing-checklist generator" gradient="from-slate-500 to-slate-700" />
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap', tab === t.id ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300')}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'limitation' && <Limitation />}
      {tab === 'deadline' && <Deadline />}
      {tab === 'hierarchy' && <Hierarchy />}
      {tab === 'states' && <StateRules />}
      {tab === 'rpc' && <Rpc />}
      {tab === 'maxims' && <Maxims />}
      {tab === 'aml' && <Aml />}
      {tab === 'checklist' && <Checklist />}
    </div>
  );
}

function Limitation() {
  return (
    <Card variant="glass">
      <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Limitation periods (general guide)</h3>
      <p className="text-xs text-amber-600 dark:text-amber-400 mb-4 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Limitation in Nigeria is largely state-specific — always verify against the applicable State Limitation Law.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-slate-400 border-b border-slate-200 dark:border-slate-700">
            <tr><th className="py-2 pr-4">Cause of action</th><th className="pr-4">Period</th><th className="pr-4">Basis</th><th>Note</th></tr>
          </thead>
          <tbody>
            {LIMITATION_PERIODS.map((l, i) => (
              <tr key={i} className="border-b border-slate-100 dark:border-slate-800 align-top">
                <td className="py-2 pr-4 font-medium text-slate-700 dark:text-slate-200">{l.cause}</td>
                <td className="pr-4"><Badge variant="info">{l.period}</Badge></td>
                <td className="pr-4 text-slate-500">{l.basis}</td>
                <td className="text-slate-400 text-xs">{l.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Deadline() {
  const { addTask, showToast } = useApp();
  const [start, setStart] = useState(todayISO());
  const [idx, setIdx] = useState('0');
  const item = LIMITATION_PERIODS[Number(idx)];
  const deadline = useMemo(() => computeDeadline(start, item?.period), [start, item]);

  const createTask = () => {
    if (!deadline) return;
    const due = deadline.toISOString().slice(0, 10);
    addTask({
      title: `Limitation deadline: ${item.cause}`,
      due,
      priority: 'high',
      status: 'todo',
      notes: `Auto-created from the Deadline Calculator. Cause accrued ${start}; period ${item.period} (${item.basis}). VERIFY against the applicable state law before relying.`,
    });
    showToast('success', 'Reminder task created (High priority).');
  };

  return (
    <Card variant="glass" className="space-y-4">
      <h3 className="font-semibold text-slate-900 dark:text-white">Deadline calculator</h3>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Date cause of action accrued" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        <Select label="Cause of action" value={idx} onChange={(e) => setIdx(e.target.value)}
          options={LIMITATION_PERIODS.map((l, i) => ({ value: String(i), label: `${l.cause} (${l.period})` }))} />
      </div>
      {deadline && (
        <div className="rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4">
          <p className="text-sm text-slate-500">Approximate limitation deadline</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatDate(deadline)}</p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-start gap-1.5"><AlertTriangle className="w-3.5 h-3.5 mt-0.5" /> {item.note} Verify the applicable state law, public-officer exceptions (3 months), continuing injury, and fraud/concealment rules.</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={createTask} leftIcon={<CalendarPlus className="w-4 h-4" />}>Create reminder task</Button>
        </div>
      )}
    </Card>
  );
}

function Hierarchy() {
  return (
    <Card variant="glass" className="space-y-4">
      <h3 className="font-semibold text-slate-900 dark:text-white">Nigerian court hierarchy</h3>
      <div className="space-y-2">
        {COURT_HIERARCHY.map((c) => (
          <div key={c.level} className="flex items-start gap-3" style={{ marginLeft: `${(c.level - 1) * 16}px` }}>
            <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">{c.level}</div>
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-100">{c.name}</p>
              <p className="text-xs text-slate-400">{c.note}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
        <p className="text-xs font-semibold text-slate-500 mb-1">Jurisdiction notes</p>
        <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
          {SPECIAL_COURT_NOTES.map((n, i) => <li key={i}>{n}</li>)}
        </ul>
      </div>
    </Card>
  );
}

function StateRules() {
  const ai = useAiRun('state-rules');
  const [state, setState] = useState('Anambra');
  const known = STATE_COURT_RULES[state];
  const meta = NIGERIAN_STATES.find((s) => s.name === state);

  const fetchDirections = () => {
    ai.run({
      systemInstruction:
        'You are a Nigerian procedural-law researcher searching the live web. Report the CURRENT High Court (Civil Procedure) Rules and any standalone Practice Directions in force for the named state, with year/edition and real source links. Note frontloading, ADR/Multi-Door referral, and pre-action requirements. If you cannot confirm the current edition, say so clearly.',
      userText: `Current Civil Procedure Rules and Practice Directions of the High Court of ${state} State, Nigeria.`,
      mode: 'standard',
      webGrounding: true,
    });
  };

  return (
    <Card variant="glass" className="space-y-4">
      <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2"><Landmark className="w-5 h-5 text-emerald-500" /> State rules & practice directions</h3>
      <Select label="State" value={state} onChange={(e) => setState(e.target.value)}>
        {GEO_ZONES.map((zone) => (
          <optgroup key={zone} label={zone}>
            {NIGERIAN_STATES.filter((s) => s.zone === zone).map((s) => (
              <option key={s.name} value={s.name}>{s.name}{s.zone === 'South East' ? ' ★' : ''}</option>
            ))}
          </optgroup>
        ))}
      </Select>
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-sm">
        <p className="text-slate-700 dark:text-slate-200 font-medium">{state} State {meta ? `· ${meta.zone} · capital ${meta.capital}` : ''}</p>
        <p className="text-slate-500 mt-1">{known || `${state} State High Court (Civil Procedure) Rules — confirm the current edition and any standalone Practice Directions (use the live fetch below).`}</p>
      </div>
      <Button onClick={fetchDirections} isLoading={ai.running} leftIcon={<Globe className="w-4 h-4" />}>Find current practice directions (live)</Button>
      <p className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1.5"><AlertTriangle className="w-3.5 h-3.5 mt-0.5" /> Rules and Practice Directions change — always confirm the edition in force at the relevant registry before filing.</p>
      <AiResult ai={ai} title={`${state} State — rules & directions`} exportTitle={`${state} State Rules`} allowSave showAudit={false} />
    </Card>
  );
}

function Rpc() {
  const [q, setQ] = useState('');
  const filtered = RULES_OF_PROFESSIONAL_CONDUCT.filter(
    (r) => `${r.rule} ${r.title} ${r.summary}`.toLowerCase().includes(q.toLowerCase())
  );
  return (
    <Card variant="glass" className="space-y-4">
      <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2"><BookText className="w-5 h-5 text-emerald-500" /> Rules of Professional Conduct (2007)</h3>
      <Input leftIcon={<Search className="w-4 h-4" />} placeholder="Search the RPC (e.g. conflict, client money, candour)…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="space-y-2">
        {filtered.map((r) => (
          <div key={r.rule} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{r.rule} — {r.title}</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">{r.summary}</p>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-slate-400">No matching rule.</p>}
      </div>
      <p className="text-xs text-amber-600 dark:text-amber-400">Paraphrased for quick reference — confirm exact wording against the RPC for Legal Practitioners 2007 (and any amendments). Breaches are tried by the LPDC.</p>
    </Card>
  );
}

function Maxims() {
  const { showToast } = useApp();
  const [q, setQ] = useState('');
  const [custom, setCustom] = useState([]);
  const all = [...LEGAL_MAXIMS, ...custom];
  const filtered = all.filter((m) => `${m.latin} ${m.meaning}`.toLowerCase().includes(q.toLowerCase()));
  const add = () => {
    const latin = window.prompt('Maxim (Latin):');
    if (!latin) return;
    const meaning = window.prompt('Meaning:') || '';
    setCustom((p) => [...p, { latin, meaning }]);
    showToast('success', 'Maxim added (this session).');
  };
  return (
    <Card variant="glass" className="space-y-4">
      <div className="flex gap-3">
        <Input className="flex-1" leftIcon={<Search className="w-4 h-4" />} placeholder="Search maxims…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button variant="secondary" onClick={add}>Add</Button>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {filtered.map((m, i) => (
          <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
            <p className="font-semibold text-emerald-600 dark:text-emerald-400 italic">{m.latin}</p>
            <p className="text-sm text-slate-500">{m.meaning}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Aml() {
  return (
    <div className="space-y-4">
      <Card variant="glass">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-500" /> AML / CFT thresholds (MLPPA 2022)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-400 border-b border-slate-200 dark:border-slate-700"><tr><th className="py-2 pr-4">Item</th><th className="pr-4">Threshold</th><th>Basis</th></tr></thead>
            <tbody>
              {AML_THRESHOLDS.map((a, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-800"><td className="py-2 pr-4 font-medium">{a.item}</td><td className="pr-4"><Badge variant="warning">{a.threshold}</Badge></td><td className="text-slate-400 text-xs">{a.basis}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card variant="glass">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Red flags</h3>
        <ul className="list-disc list-inside text-sm text-slate-500 space-y-1">{AML_RED_FLAGS.map((f, i) => <li key={i}>{f}</li>)}</ul>
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">Legal practitioners are DNFBPs — register with SCUML where engaging in covered activities and report suspicious transactions to the NFIU.</p>
      </Card>
    </div>
  );
}

function Checklist() {
  const ai = useAiRun('court-checklist');
  const [matter, setMatter] = useState(MATTER_TYPES[0]);
  const [court, setCourt] = useState(COURTS[2]);
  const RULE_SETS = ['Federal (FHC/NIC Rules)', ...NIGERIAN_STATES.map((s) => `${s.name} State`)];
  const [rules, setRules] = useState('Anambra State');

  const generate = () => {
    ai.run({
      systemInstruction: 'You are a Nigerian litigation registrar/practitioner. Produce a precise, rule-cited filing checklist for the given matter type, court, and rules of court. Sections: 1) Pre-action requirements, 2) Documents to file (with copies), 3) Filing steps & where, 4) Frontloading requirements, 5) Service, 6) Common defects that get processes struck out, 7) Indicative timeline. Cite the specific Order/Rule where you can; flag that registry fees change.',
      userText: `Filing checklist for: ${matter}\nCourt: ${court}\nRules of court: ${rules}`,
      mode: 'comprehensive',
      webGrounding: false,
    });
  };

  return (
    <Card variant="glass" className="space-y-4">
      <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2"><ClipboardList className="w-5 h-5 text-emerald-500" /> Court Process Checklist generator</h3>
      <div className="grid sm:grid-cols-3 gap-3">
        <Select label="Matter type" value={matter} onChange={(e) => setMatter(e.target.value)} options={MATTER_TYPES.map((m) => ({ value: m, label: m }))} />
        <Select label="Court" value={court} onChange={(e) => setCourt(e.target.value)} options={COURTS.map((c) => ({ value: c, label: c }))} />
        <Select label="Rules of court" value={rules} onChange={(e) => setRules(e.target.value)} options={RULE_SETS.map((s) => ({ value: s, label: s }))} />
      </div>
      <Button onClick={generate} isLoading={ai.running} leftIcon={<Sparkles className="w-4 h-4" />}>Generate checklist</Button>
      <AiResult ai={ai} title="Filing checklist" exportTitle={`Checklist — ${matter}`} allowSave showAudit={false} />
    </Card>
  );
}
