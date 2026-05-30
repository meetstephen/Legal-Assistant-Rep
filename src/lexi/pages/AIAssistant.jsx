// ============================================================
// lexi/pages/AIAssistant.jsx — the core 2.0 AI experience
// ============================================================

import React, { useState, useRef } from 'react';
import {
  Brain, Sparkles, Square, Globe, Upload, FileText, X, ShieldAlert,
  MessageSquare, Search, BookOpen, ChevronRight, Target, Scale, ClipboardCheck,
  GitCompare, Lightbulb, HelpCircle, Gauge,
} from 'lucide-react';
import { useApp } from '../AppContext.jsx';
import { useAiRun } from '../useAiRun.js';
import { TASK_TYPES, RESPONSE_MODES, DOC_ACTIONS } from '../promptData/index.js';
import { buildSystemPrompt, wrapDocument } from '../prompts.js';
import { extractDocument, ACCEPTED_DOC_TYPES } from '../docParse.js';
import { Card, Button, Textarea, Select, Badge, Toggle, PageHeader } from '../components/ui.jsx';
import { AiResult } from '../components/AiResult.jsx';
import { cn } from '../utils.js';

const ICON_MAP = {
  MessageSquare, Search, FileText, BookOpen, ChevronRight, Target, Scale, ClipboardCheck,
};

export function AIAssistant() {
  const { apiKey, webGrounding, profile, navigate, pageParams } = useApp();
  const ai = useAiRun('ai-assistant');
  const followup = useAiRun('ai-followup');

  const [taskId, setTaskId] = useState('general');
  const [mode, setMode] = useState('standard');
  const [groundOverride, setGroundOverride] = useState(webGrounding);
  const [thinking, setThinking] = useState(true);
  const [input, setInput] = useState('');

  // Prefill from another page (e.g. Templates → "Use in AI").
  React.useEffect(() => {
    if (pageParams && pageParams.prefill) {
      setInput(pageParams.prefill);
      if (pageParams.taskId) setTaskId(pageParams.taskId);
    }
     
  }, [pageParams]);

  // Document workflow
  const [doc, setDoc] = useState(null);
  const [docBusy, setDocBusy] = useState(false);
  const [docError, setDocError] = useState('');
  const fileRef = useRef(null);

  // Contract version diff
  const [showDiff, setShowDiff] = useState(false);

  const task = TASK_TYPES.find((t) => t.id === taskId) || TASK_TYPES[0];

  const systemFor = (overrideTask) =>
    buildSystemPrompt({
      taskId: overrideTask || taskId,
      modeId: mode,
      webGrounding: groundOverride,
      query: input || (doc ? doc.name : ''),
      firmName: profile.firmName,
      jurisdiction: profile.defaultJurisdiction,
    });

  const composeUser = (extra) => {
    const segments = [];
    if (input.trim()) segments.push(input.trim());
    if (doc) segments.push(wrapDocument(doc.sanitized));
    if (extra) segments.push(extra);
    return segments.join('\n\n');
  };

  const runMain = (extra, overrideTask) => {
    ai.run({
      systemInstruction: systemFor(overrideTask),
      userText: composeUser(extra),
      mode,
      webGrounding: groundOverride,
      thinking,
    });
  };

  const handleFile = async (file) => {
    if (!file) return;
    setDocBusy(true);
    try {
      const parsed = await extractDocument(file);
      setDoc(parsed);
    } catch (e) {
      setDoc(null);
      // surface via toast through context
       
      alertSafe(e.message);
    } finally {
      setDocBusy(false);
    }
  };

  const alertSafe = (msg) => {
    // light inline error
    setDocError(msg);
    setTimeout(() => setDocError(''), 6000);
  };

  const runDocAction = (action) => {
    if (!doc) return;
    setTaskId(action.id === 'risks' ? 'contract' : taskId);
    ai.run({
      systemInstruction: buildSystemPrompt({
        taskId: 'analysis',
        modeId: mode,
        webGrounding: groundOverride,
        query: doc.name,
        firmName: profile.firmName,
        jurisdiction: profile.defaultJurisdiction,
      }),
      userText: `${action.instruction}\n\n${wrapDocument(doc.sanitized)}`,
      mode,
      webGrounding: groundOverride,
      thinking,
    });
  };

  const canRun = (input.trim() || doc) && !ai.running;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Brain}
        title="AI Legal Assistant"
        subtitle="Reasons before it answers · grounded in Nigerian law · put it online for real sources"
        gradient="from-violet-500 to-fuchsia-500"
      />

      {!apiKey && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Add your Google Gemini API key to power the assistant (reasoning, grounding, drafting).
            </p>
            <Button size="sm" onClick={() => navigate('profile')}>Add API key</Button>
          </div>
        </Card>
      )}

      {/* Task types */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Task type</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {TASK_TYPES.map((t) => {
            const Icon = ICON_MAP[t.icon] || MessageSquare;
            const active = taskId === t.id;
            return (
              <button key={t.id} onClick={() => setTaskId(t.id)} className="text-left">
                <Card
                  className={cn(
                    'p-3.5 h-full',
                    active ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-950' : 'hover:border-emerald-300 dark:hover:border-emerald-700'
                  )}
                >
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-2', active ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500')}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{t.emoji} {t.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{t.description}</div>
                </Card>
              </button>
            );
          })}
        </div>
      </div>

      {/* Document workflow */}
      <Card variant="glass" className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Upload className="w-4 h-4" /> Work from a document <span className="text-xs font-normal text-slate-400">(optional · PDF / DOCX / TXT / RTF / CSV / JSON)</span>
          </h3>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED_DOC_TYPES}
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          {!doc && (
            <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()} isLoading={docBusy}>
              Upload document
            </Button>
          )}
        </div>
        {docError && <p className="text-sm text-red-500 flex items-center gap-1.5"><ShieldAlert className="w-4 h-4" /> {docError}</p>}
        {doc && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-emerald-500" />
              <span className="font-medium text-slate-700 dark:text-slate-200">{doc.name}</span>
              <Badge variant="default">{doc.chars.toLocaleString()} chars</Badge>
              {doc.truncated && <Badge variant="warning">truncated</Badge>}
              {doc.flags.length > 0 && <Badge variant="danger"><ShieldAlert className="w-3 h-3" /> injection neutralised</Badge>}
              <button onClick={() => setDoc(null)} className="ml-auto p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex flex-wrap gap-2">
              {DOC_ACTIONS.map((a) => (
                <Button key={a.id} size="sm" variant="outline" onClick={() => runDocAction(a)} disabled={ai.running}>
                  {a.emoji} {a.label}
                </Button>
              ))}
            </div>
            <p className="text-xs text-slate-400">
              Whole-document analysis (up to ~60 pages). Document text is sanitised against prompt injection and wrapped as data-only before it reaches the AI.
            </p>
          </div>
        )}
      </Card>

      {/* Input + controls */}
      <Card variant="glass" className="space-y-4">
        <Textarea
          label={`Describe your ${task.label.toLowerCase()} task or query`}
          rows={6}
          placeholder="e.g. Draft a 2-year commercial lease for a Lagos office with a rent-review clause and an option to renew…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="grid md:grid-cols-3 gap-4">
          <Select label="Response depth" value={mode} onChange={(e) => setMode(e.target.value)}
            options={RESPONSE_MODES.map((m) => ({ value: m.id, label: `${m.label} — ${m.description}` }))} />
          <div className="flex items-center"><Toggle checked={groundOverride} onChange={setGroundOverride} label="Live web grounding" hint="Cite real, current sources" /></div>
          <div className="flex items-center"><Toggle checked={thinking} onChange={setThinking} label="Native reasoning" hint="Think before answering" /></div>
        </div>
        <div className="flex items-center gap-2">
          {ai.running ? (
            <Button variant="danger" onClick={ai.stop} leftIcon={<Square className="w-4 h-4" />}>Stop</Button>
          ) : (
            <Button onClick={() => runMain()} disabled={!canRun} size="lg" leftIcon={<Sparkles className="w-5 h-5" />}>
              Generate
            </Button>
          )}
          <Button variant="ghost" onClick={() => setShowDiff((s) => !s)} leftIcon={<GitCompare className="w-4 h-4" />}>
            Contract version diff
          </Button>
        </div>
        {groundOverride && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" /> Online: this answer will be grounded in live web sources with clickable links.
          </p>
        )}
      </Card>

      {showDiff && <ContractDiff mode={mode} grounding={groundOverride} />}

      <AiResult ai={ai} title="LexiAssist Response" exportTitle={`LexiAssist ${task.label}`} />

      {/* Follow-up actions */}
      {!ai.running && (ai.cleanText || ai.text) && (
        <Card variant="flat" className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Take it further</h3>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => followup.run({
              systemInstruction: buildSystemPrompt({ taskId: 'analysis', modeId: 'standard', webGrounding: false, query: input, firmName: profile.firmName }),
              userText: `From the analysis below, list the discrete legal issues raised, each with the governing rule and the key authority.\n\nANALYSIS:\n${ai.cleanText || ai.text}`,
              mode: 'standard', webGrounding: false,
            })} leftIcon={<Lightbulb className="w-4 h-4" />}>Spot issues</Button>
            <Button size="sm" variant="secondary" onClick={() => followup.run({
              systemInstruction: 'You are a Nigerian litigation strategist. Generate the sharpest follow-up questions a lawyer should ask to strengthen the matter and close evidential gaps.',
              userText: `Suggest 6-10 targeted follow-up questions based on:\n\n${ai.cleanText || ai.text}`,
              mode: 'brief', webGrounding: false,
            })} leftIcon={<HelpCircle className="w-4 h-4" />}>Follow-up questions</Button>
            <Button size="sm" variant="secondary" onClick={() => followup.run({
              systemInstruction: 'You are a candid Nigerian senior advocate. Assess the strength of the position on a 0-100 scale with a clear label (Weak/Arguable/Strong), the main risks, and what would move the needle. Be honest, not optimistic.',
              userText: `Give a Case Strength assessment for:\n\n${ai.cleanText || ai.text}`,
              mode: 'brief', webGrounding: false,
            })} leftIcon={<Gauge className="w-4 h-4" />}>Case strength meter</Button>
          </div>
          <AiResult ai={followup} title="Follow-up" exportTitle="LexiAssist Follow-up" allowSave={false} showAudit={false} />
        </Card>
      )}
    </div>
  );
}

// ---- Contract version diffing ----------------------------------------------
function lineDiff(a, b) {
  const A = a.split('\n');
  const B = b.split('\n');
  const n = A.length;
  const m = B.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const ops = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) { ops.push({ t: 'eq', text: A[i] }); i += 1; j += 1; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { ops.push({ t: 'del', text: A[i] }); i += 1; }
    else { ops.push({ t: 'add', text: B[j] }); j += 1; }
  }
  while (i < n) { ops.push({ t: 'del', text: A[i] }); i += 1; }
  while (j < m) { ops.push({ t: 'add', text: B[j] }); j += 1; }
  return ops;
}

function ContractDiff({ mode, grounding }) {
  const ai = useAiRun('contract-diff');
  const [v1, setV1] = useState('');
  const [v2, setV2] = useState('');
  const ops = React.useMemo(() => (v1 && v2 ? lineDiff(v1, v2) : []), [v1, v2]);
  const changes = ops.filter((o) => o.t !== 'eq').length;

  const explain = () => {
    const changed = ops
      .filter((o) => o.t !== 'eq')
      .map((o) => `${o.t === 'add' ? '+ ' : '- '}${o.text}`)
      .join('\n');
    ai.run({
      systemInstruction: 'You are a Nigerian contracts lawyer. Explain the legal significance of the changes between two versions of a contract: who each change favours, the risk shifted, and whether to accept, push back, or redline. Be specific.',
      userText: `Here are the line-level changes from V1 to V2 (lines starting with "-" were removed, "+" were added):\n\n${changed}`,
      mode,
      webGrounding: grounding,
    });
  };

  return (
    <Card variant="glass" className="space-y-4">
      <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2"><GitCompare className="w-5 h-5 text-emerald-500" /> Contract version diff</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <Textarea label="Version 1 (original)" rows={8} value={v1} onChange={(e) => setV1(e.target.value)} placeholder="Paste V1 text…" />
        <Textarea label="Version 2 (revised)" rows={8} value={v2} onChange={(e) => setV2(e.target.value)} placeholder="Paste V2 text…" />
      </div>
      {ops.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 max-h-72 overflow-y-auto thin-scrollbar font-mono text-xs leading-relaxed">
          {ops.map((o, i) => (
            <div key={i} className={cn(
              o.t === 'add' && 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300',
              o.t === 'del' && 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 line-through',
              o.t === 'eq' && 'text-slate-400'
            )}>
              <span className="select-none mr-2">{o.t === 'add' ? '+' : o.t === 'del' ? '−' : ' '}</span>
              {o.text || '\u00A0'}
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-3">
        <Button onClick={explain} disabled={!v1 || !v2 || ai.running} isLoading={ai.running} leftIcon={<Sparkles className="w-4 h-4" />}>Explain legal significance</Button>
        {ops.length > 0 && <span className="text-xs text-slate-400">{changes} changed line(s)</span>}
      </div>
      <AiResult ai={ai} title="Diff explanation" exportTitle="Contract Diff Explanation" allowSave={false} showAudit={false} />
    </Card>
  );
}
