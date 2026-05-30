// ============================================================
// lexi/pages/Research.jsx — Case Law & Statutes + From My Sources
// Real online research (always offers live web grounding).
// ============================================================

import React, { useState } from 'react';
import { BookOpen, Search, Globe, Sparkles, Square, Database } from 'lucide-react';
import { useApp } from '../AppContext.jsx';
import { useAiRun } from '../useAiRun.js';
import { buildSystemPrompt, wrapDocument } from '../prompts.js';
import { extractDocument, ACCEPTED_DOC_TYPES } from '../docParse.js';
import { Card, Button, Input, Textarea, Toggle, PageHeader, Badge } from '../components/ui.jsx';
import { AiResult } from '../components/AiResult.jsx';
import { QuickPrecedentFinder } from '../components/QuickPrecedentFinder.jsx';
import { cn } from '../utils.js';

const TABS = [
  { id: 'caselaw', label: 'Case Law & Statutes' },
  { id: 'sources', label: 'From My Sources' },
];

export function Research() {
  const { profile } = useApp();
  const [tab, setTab] = useState('caselaw');
  const caselaw = useAiRun('research-caselaw');
  const sources = useAiRun('research-sources');

  const [query, setQuery] = useState('');
  const [ground, setGround] = useState(true);

  const [docs, setDocs] = useState([]);
  const [srcQuery, setSrcQuery] = useState('');

  const runResearch = () => {
    caselaw.run({
      systemInstruction: buildSystemPrompt({
        taskId: 'research', modeId: 'comprehensive', webGrounding: ground, query,
        firmName: profile.firmName, jurisdiction: profile.defaultJurisdiction,
      }),
      userText: `Conduct Nigerian legal research on:\n\n${query}\n\nGive applicable statutes (with sections), key authorities (name + citation + court + holding), the governing principles, practical guidance, and pitfalls. Mark anything uncertain.`,
      mode: 'comprehensive',
      webGrounding: ground,
    });
  };

  const addDocs = async (files) => {
    const list = [...files];
    for (const f of list) {
      try {
        const parsed = await extractDocument(f);
        setDocs((prev) => [...prev, parsed]);
      } catch {
        /* skip files that cannot be read */
      }
    }
  };

  const runFromSources = () => {
    const combined = docs.map((d) => `--- ${d.name} ---\n${wrapDocument(d.sanitized)}`).join('\n\n');
    sources.run({
      systemInstruction: 'You are a Nigerian legal research assistant. Answer ONLY from the supplied source documents where possible; quote and cite which document supports each point. If the sources do not answer the question, say so and clearly separate any general legal knowledge you add.',
      userText: `QUESTION:\n${srcQuery}\n\nSOURCE DOCUMENTS:\n${combined}`,
      mode: 'standard',
      webGrounding: false,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader icon={BookOpen} title="Legal Research" subtitle="Search live Nigerian case law & statutes, or research within your own documents" gradient="from-blue-400 to-indigo-500" />

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('px-4 py-2 rounded-lg text-sm font-medium', tab === t.id ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300')}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'caselaw' && (
        <>
          <QuickPrecedentFinder />
          <Card variant="glass" className="space-y-4">
            <Textarea label="Research query" rows={4}
              placeholder="e.g. Remedies for breach of a building contract in Nigeria; relevant authorities on liquidated damages…"
              value={query} onChange={(e) => setQuery(e.target.value)} />
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Toggle checked={ground} onChange={setGround} label="Search the live web" hint="Find real, current authorities with source links" />
              <div className="flex-1" />
              {caselaw.running ? (
                <Button variant="danger" onClick={caselaw.stop} leftIcon={<Square className="w-4 h-4" />}>Stop</Button>
              ) : (
                <Button onClick={runResearch} disabled={!query.trim()} leftIcon={<Search className="w-5 h-5" />}>Research</Button>
              )}
            </div>
            {ground && <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Online research — results grounded in real web sources.</p>}
          </Card>
          <AiResult ai={caselaw} title="Research Memo" exportTitle="LexiAssist Research" />
        </>
      )}

      {tab === 'sources' && (
        <>
          <Card variant="glass" className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Your source documents</label>
              <input type="file" multiple accept={ACCEPTED_DOC_TYPES} onChange={(e) => addDocs(e.target.files)} className="text-sm" />
              <div className="flex flex-wrap gap-2 mt-3">
                {docs.map((d, i) => (
                  <Badge key={i} variant="info"><Database className="w-3 h-3" /> {d.name}</Badge>
                ))}
              </div>
            </div>
            <Input label="Ask a question about your sources" value={srcQuery} onChange={(e) => setSrcQuery(e.target.value)} placeholder="What does clause 7 say about termination?" />
            {sources.running ? (
              <Button variant="danger" onClick={sources.stop} leftIcon={<Square className="w-4 h-4" />}>Stop</Button>
            ) : (
              <Button onClick={runFromSources} disabled={!docs.length || !srcQuery.trim()} leftIcon={<Sparkles className="w-5 h-5" />}>Research my sources</Button>
            )}
            {!docs.length && <p className="text-xs text-slate-400">Upload one or more documents (PDF/DOCX/TXT…) to ground the answer in your own materials.</p>}
          </Card>
          <AiResult ai={sources} title="From Your Sources" exportTitle="LexiAssist Source Research" />
        </>
      )}
    </div>
  );
}
