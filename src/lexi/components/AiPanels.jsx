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
  HelpCircle, Loader2, BadgeCheck,
} from 'lucide-react';
import { useApp } from '../AppContext.jsx';
import { auditCitations, isValidCitationShape } from '../citations.js';
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

// ============================================================
// CitationAudit — unified 3-tier per-case verification badges:
//   ✓ Verified (in database)     — case matches the hand-verified DB
//   🌐 Web-sourced — confirm src  — a LIVE search returned it WITH a source URL
//   ⚠️ Needs Verification         — no confirming source, invalid shape, or risk
// Citation format alone is never enough: "web-sourced" requires a real source.
// ============================================================

const normName = (s = '') => s.toLowerCase().replace(/[^a-z0-9]/g, '');

export function CitationAudit({ text }) {
  const { apiKey, aiReady, model, showToast, recordUsage, audit, guardAi } = useApp();
  const audited = React.useMemo(() => auditCitations(text || ''), [text]);
  const [verifying, setVerifying] = useState(false);
  const [verdicts, setVerdicts] = useState(null);
  const [verifySources, setVerifySources] = useState([]);
  const [checked, setChecked] = useState(false);

  if (!audited.items.length && !audited.foreign.length && !audited.repealed.length) return null;

  const findVerdict = (item) => {
    if (!verdicts) return null;
    const k = normName(item.name);
    return (
      verdicts.find((v) => normName(v.name) === k) ||
      verdicts.find((v) => normName(v.name).includes(k) || k.includes(normName(v.name)))
    );
  };

  // Resolve each cited case to one of the three tiers.
  const rows = audited.items.map((it) => {
    if (it.status === 'verified') return { ...it, tier: 'db' };
    const v = findVerdict(it);
    if (v && v.verdict === 'REAL' && v.url) {
      return { ...it, tier: 'web', url: v.url, webCitation: v.citation, note: v.note };
    }
    if (checked) {
      return { ...it, tier: 'needs', note: (v && v.note) || 'The live search returned no confirming source.' };
    }
    if (it.hallucinationRisk) return { ...it, tier: 'needs', note: `Risk: ${it.hallucinationRisk}` };
    if (it.citation && !isValidCitationShape(it.citation)) {
      return { ...it, tier: 'needs', note: 'Citation shape is invalid — confirm before relying.' };
    }
    return { ...it, tier: 'pending' };
  });

  const counts = {
    db: rows.filter((r) => r.tier === 'db').length,
    web: rows.filter((r) => r.tier === 'web').length,
    needs: rows.filter((r) => r.tier === 'needs').length,
    pending: rows.filter((r) => r.tier === 'pending').length,
  };

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
        cases: audited.items.filter((i) => i.status !== 'verified').map((i) => ({ name: i.name, citation: i.citation })),
      });
      setVerdicts(v);
      setVerifySources(sources || []);
      setChecked(true);
      recordUsage('citation-verify', { model, usage, grounded: true });
      audit('AI_VERIFY', `${v.length} citation(s)`);
    } catch (e) {
      showToast('error', e.message);
    } finally {
      setVerifying(false);
    }
  };

  const TIER = {
    db: { icon: BadgeCheck, cls: 'text-emerald-500', badge: 'success', label: '✓ Verified (in database)' },
    web: { icon: Globe, cls: 'text-blue-500', badge: 'info', label: '🌐 Web-sourced — confirm source' },
    needs: { icon: AlertTriangle, cls: 'text-red-500', badge: 'danger', label: '⚠️ Needs Verification' },
    pending: { icon: HelpCircle, cls: 'text-amber-500', badge: 'warning', label: 'Unverified — run web check' },
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 flex-wrap">
        <ShieldCheck className="w-4 h-4 text-emerald-500" /> Citation audit
        <span className="text-xs font-normal text-slate-400">
          {counts.db} in DB · {counts.web} web-sourced · {counts.needs} need verification{counts.pending ? ` · ${counts.pending} unchecked` : ''}
        </span>
      </div>

      {rows.length > 0 && (
        <ul className="space-y-2">
          {rows.map((it, i) => {
            const t = TIER[it.tier];
            const Icon = t.icon;
            return (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', t.cls)} />
                <span className="text-slate-700 dark:text-slate-300 min-w-0">
                  <span className="font-medium">{it.name}</span>
                  {it.verifiedCitation ? ` ${it.verifiedCitation}` : it.webCitation ? ` ${it.webCitation}` : it.citation ? ` ${it.citation}` : ''}
                  <Badge variant={t.badge} className="ml-2">{t.label}</Badge>
                  {it.tier === 'db' && it.holding && <span className="block text-xs text-slate-400 mt-0.5">{it.holding}</span>}
                  {it.tier === 'web' && it.url && (
                    <a href={it.url} target="_blank" rel="noopener noreferrer" className="block text-xs text-blue-600 dark:text-blue-400 hover:underline mt-0.5 inline-flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> Open source to confirm
                    </a>
                  )}
                  {it.tier === 'needs' && it.note && <span className="block text-xs text-red-500 mt-0.5">{it.note}</span>}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {audited.repealed.map((r, i) => (
        <div key={`r${i}`} className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-medium">Repealed/superseded:</span> {r.note}
            {r.current && <span className="block text-emerald-600 dark:text-emerald-400 mt-0.5">→ Cite instead: <strong>{r.current}</strong></span>}
          </div>
        </div>
      ))}
      {audited.foreign.length > 0 && (
        <p className="text-xs text-blue-600 dark:text-blue-400 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          Foreign authority detected ({audited.foreign.join(', ')}) — persuasive only, not binding in Nigeria.
        </p>
      )}

      {(counts.pending > 0 || (!checked && counts.needs > 0)) && audited.items.some((i) => i.status !== 'verified') && (
        <Button size="sm" variant="outline" onClick={runVerify} isLoading={verifying} leftIcon={<Globe className="w-4 h-4" />}>
          🔎 Verify non-database case(s) on the live web
        </Button>
      )}
      {checked && (
        <p className="text-xs text-slate-400">
          Web-sourced cases were genuinely surfaced by a live search — still open each source to confirm. Cases marked “Needs Verification” returned no confirming source; treat as unconfirmed.
        </p>
      )}
      {verifying && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
      {verifySources.length > 0 && <GroundingSources sources={verifySources} />}
    </div>
  );
}
