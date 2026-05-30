// ============================================================
// lexi/components/AiPanels.jsx — reusable AI result panels
//   • ReasoningPanel — collapsible native-thinking trace
//   • GroundingSources — real, clickable web sources
//   • ConfidenceMeter — 4-axis confidence
//   • CitationAudit — verified/unverified badges + one-click live verifier
// ============================================================

import React, { useState } from 'react';
import {
  Brain, ChevronDown, Globe, ExternalLink, ShieldCheck, AlertTriangle,
  CheckCircle2, HelpCircle, XCircle, Loader2, BadgeCheck,
} from 'lucide-react';
import { useApp } from '../AppContext.jsx';
import { auditCitations } from '../citations.js';
import { verifyCitations } from '../webSearch.js';
import { confidenceBar, confidenceColor } from '../themes.js';
import { cn } from '../utils.js';
import { Badge, Button } from './ui.jsx';

export function ReasoningPanel({ thoughts }) {
  const [open, setOpen] = useState(false);
  if (!thoughts) return null;
  return (
    <div className="rounded-xl border border-violet-200 dark:border-violet-900/50 bg-violet-50/60 dark:bg-violet-900/10 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-violet-700 dark:text-violet-300"
      >
        <Brain className="w-4 h-4" />
        🧠 How LexiAssist reasoned
        <ChevronDown className={cn('w-4 h-4 ml-auto transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-violet-900/80 dark:text-violet-200/70 whitespace-pre-wrap thin-scrollbar max-h-80 overflow-y-auto border-t border-violet-200/60 dark:border-violet-900/40 pt-3">
          {thoughts}
        </div>
      )}
    </div>
  );
}

export function GroundingSources({ sources = [], queries = [] }) {
  if (!sources.length && !queries.length) return null;
  return (
    <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-900/10 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-2">
        <Globe className="w-4 h-4" /> Live web sources
        <Badge variant="success">{sources.length}</Badge>
      </div>
      {queries.length > 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
          Searched: {queries.map((q) => `"${q}"`).join(', ')}
        </p>
      )}
      <ul className="space-y-1.5">
        {sources.map((s, i) => (
          <li key={i}>
            <a
              href={s.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 text-sm text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span className="break-all">{s.title || s.uri}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

const AXES = [
  { key: 'statutory', label: 'Statutory Grounding' },
  { key: 'caselaw', label: 'Case Law Support' },
  { key: 'procedural', label: 'Procedural Certainty' },
  { key: 'position', label: 'Position-taking' },
];

export function ConfidenceMeter({ scores }) {
  if (!scores) return null;
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
        Confidence
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {AXES.map((a) => {
          const v = scores[a.key];
          return (
            <div key={a.key}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500 dark:text-slate-400">{a.label}</span>
                <span className={cn('font-semibold', confidenceColor(v))}>{v == null ? '—' : `${v}%`}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div className={cn('h-full rounded-full transition-all', confidenceBar(v))} style={{ width: `${v || 0}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const VERDICT_UI = {
  REAL: { icon: CheckCircle2, cls: 'text-emerald-500', badge: 'success' },
  'NOT FOUND': { icon: XCircle, cls: 'text-red-500', badge: 'danger' },
  UNCERTAIN: { icon: HelpCircle, cls: 'text-amber-500', badge: 'warning' },
};

export function CitationAudit({ text }) {
  const { apiKey, aiReady, model, showToast, recordUsage, audit, guardAi } = useApp();
  const audited = React.useMemo(() => auditCitations(text || ''), [text]);
  const [verifying, setVerifying] = useState(false);
  const [verdicts, setVerdicts] = useState(null);
  const [verifySources, setVerifySources] = useState([]);

  if (!audited.items.length && !audited.foreign.length && !audited.repealed.length) return null;

  const runVerify = async () => {
    if (!aiReady) {
      showToast('warning', 'Add your Gemini API key in Profile first.');
      return;
    }
    if (!guardAi()) return;
    setVerifying(true);
    try {
      const { verdicts: v, sources, usage } = await verifyCitations({
        apiKey,
        model,
        cases: audited.items.map((i) => ({ name: i.name, citation: i.citation })),
      });
      setVerdicts(v);
      setVerifySources(sources || []);
      recordUsage('citation-verify', { model, usage, grounded: true });
      audit('AI_VERIFY', `${v.length} citation(s)`);
    } catch (e) {
      showToast('error', e.message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
        <ShieldCheck className="w-4 h-4 text-emerald-500" /> Citation audit
        <span className="text-xs font-normal text-slate-400">
          {audited.verifiedCount} verified · {audited.unverifiedCount} unverified
        </span>
      </div>

      {audited.items.length > 0 && (
        <ul className="space-y-1.5">
          {audited.items.map((it, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              {it.status === 'verified' ? (
                <BadgeCheck className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              )}
              <span className="text-slate-700 dark:text-slate-300">
                <span className="font-medium">{it.name}</span>
                {it.verifiedCitation ? ` ${it.verifiedCitation}` : it.citation ? ` ${it.citation}` : ''}
                {it.status === 'verified' ? (
                  <Badge variant="success" className="ml-2">Verified</Badge>
                ) : (
                  <Badge variant="warning" className="ml-2">Unverified</Badge>
                )}
                {it.holding && <span className="block text-xs text-slate-400">{it.holding}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}

      {audited.repealed.map((r, i) => (
        <p key={`r${i}`} className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> Repealed/superseded: {r}
        </p>
      ))}
      {audited.foreign.length > 0 && (
        <p className="text-xs text-blue-600 dark:text-blue-400 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          Foreign authority detected ({audited.foreign.join(', ')}) — persuasive only, not binding in Nigeria.
        </p>
      )}

      {audited.items.length > 0 && (
        <Button size="sm" variant="outline" onClick={runVerify} isLoading={verifying} leftIcon={<Globe className="w-4 h-4" />}>
          🔎 Verify cited case(s) on the live web
        </Button>
      )}

      {verdicts && (
        <div className="space-y-1.5 border-t border-slate-200 dark:border-slate-700 pt-3">
          {verdicts.map((v, i) => {
            const ui = VERDICT_UI[v.verdict] || VERDICT_UI.UNCERTAIN;
            const Icon = ui.icon;
            return (
              <div key={i} className="text-sm">
                <div className="flex items-center gap-2">
                  <Icon className={cn('w-4 h-4 flex-shrink-0', ui.cls)} />
                  <span className="font-medium text-slate-700 dark:text-slate-300">{v.name}</span>
                  <Badge variant={ui.badge}>{v.verdict}</Badge>
                </div>
                {(v.citation || v.note) && (
                  <p className="ml-6 text-xs text-slate-500 dark:text-slate-400">
                    {v.citation} {v.note && `— ${v.note}`}
                  </p>
                )}
                {v.url && (
                  <a href={v.url} target="_blank" rel="noopener noreferrer" className="ml-6 text-xs text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> source
                  </a>
                )}
              </div>
            );
          })}
          {verifying && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
          {verifySources.length > 0 && <GroundingSources sources={verifySources} />}
        </div>
      )}
    </div>
  );
}
