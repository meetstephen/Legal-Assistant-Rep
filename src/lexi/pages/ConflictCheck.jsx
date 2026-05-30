// ============================================================
// lexi/pages/ConflictCheck.jsx — fuzzy conflict-of-interest checker
// ============================================================

import React, { useState } from 'react';
import { ShieldAlert, Search, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';
import { useApp } from '../AppContext.jsx';
import { useAiRun } from '../useAiRun.js';
import { Card, Button, Input, PageHeader, Badge } from '../components/ui.jsx';
import { AiResult } from '../components/AiResult.jsx';

// Simple token/substring fuzzy score (0-1).
function fuzzyScore(a = '', b = '') {
  const A = a.toLowerCase().trim();
  const B = b.toLowerCase().trim();
  if (!A || !B) return 0;
  if (A === B) return 1;
  if (B.includes(A) || A.includes(B)) return 0.85;
  const at = new Set(A.split(/\s+/));
  const bt = new Set(B.split(/\s+/));
  const inter = [...at].filter((t) => t.length > 2 && bt.has(t)).length;
  const denom = Math.max(at.size, bt.size);
  return denom ? inter / denom : 0;
}

export function ConflictCheck() {
  const { clients, cases, getClientName } = useApp();
  const ai = useAiRun('conflict-check');
  const [name, setName] = useState('');
  const [results, setResults] = useState(null);

  const run = () => {
    const hits = [];
    clients.forEach((c) => {
      const score = fuzzyScore(name, c.name);
      if (score >= 0.4) hits.push({ type: 'Client', label: c.name, detail: c.type, score });
    });
    cases.forEach((c) => {
      const score = Math.max(fuzzyScore(name, c.title), c.clientId ? fuzzyScore(name, getClientName(c.clientId)) : 0);
      if (score >= 0.4) hits.push({ type: 'Case', label: c.title, detail: `Suit ${c.suitNo}`, score });
    });
    hits.sort((a, b) => b.score - a.score);
    setResults(hits);
  };

  const aiAnalyse = () => {
    ai.run({
      systemInstruction: 'You are a Nigerian legal ethics adviser. Analyse a potential conflict of interest under the Rules of Professional Conduct for Legal Practitioners (RPC). Explain whether acting would breach the duty of loyalty/confidentiality, when informed consent can cure it, and the safest course (decline, screen, or proceed with consent).',
      userText: `Proposed new party/matter: "${name}". Existing related records found: ${JSON.stringify(results || [])}. Advise on the conflict-of-interest position.`,
      mode: 'standard',
      webGrounding: false,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader icon={ShieldAlert} title="Conflict Check" subtitle="Screen a prospective party against your existing clients and matters" gradient="from-orange-400 to-red-500" />

      <Card variant="glass" className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input className="flex-1" placeholder="Enter prospective client / opposing party / company name…" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && run()} />
          <Button onClick={run} disabled={!name.trim()} leftIcon={<Search className="w-4 h-4" />}>Check</Button>
        </div>
        <p className="text-xs text-slate-400">Fuzzy-matches the name against {clients.length} client(s) and {cases.length} case(s) stored locally.</p>
      </Card>

      {results && (
        <Card variant="glass">
          {results.length === 0 ? (
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
              <div>
                <p className="font-semibold">No obvious conflicts found</p>
                <p className="text-sm text-slate-500">No close matches in your existing clients or cases. Still apply professional judgement.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-3">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-semibold">{results.length} potential match(es) — review before accepting instructions</span>
              </div>
              <ul className="space-y-2">
                {results.map((r, i) => (
                  <li key={i} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0">
                    <div>
                      <span className="font-medium text-slate-800 dark:text-slate-100">{r.label}</span>
                      <span className="text-sm text-slate-400"> · {r.detail}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="info">{r.type}</Badge>
                      <Badge variant={r.score > 0.8 ? 'danger' : 'warning'}>{Math.round(r.score * 100)}% match</Badge>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <Button variant="outline" onClick={aiAnalyse} isLoading={ai.running} leftIcon={<Sparkles className="w-4 h-4" />}>AI ethics analysis (RPC)</Button>
              </div>
            </>
          )}
        </Card>
      )}

      <AiResult ai={ai} title="Conflict-of-interest analysis" exportTitle="Conflict Check Analysis" allowSave={false} showAudit={false} />
    </div>
  );
}
