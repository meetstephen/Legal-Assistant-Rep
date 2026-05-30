// ============================================================
// lexi/pages/AuthorityVerify.jsx — standalone Authority Verification
//
// Paste any argument/draft/memo; every case, statute, and authority cited is
// extracted, classified, and (optionally) confirmed on the live web. Produces
// a downloadable TXT verification report.
// ============================================================

import React, { useState } from 'react';
import { ShieldCheck, Globe, Download, BadgeCheck, AlertTriangle, FileText } from 'lucide-react';
import { useApp } from '../AppContext.jsx';
import { auditCitations } from '../citations.js';
import { verifyCitations } from '../webSearch.js';
import { Card, Button, Textarea, PageHeader, Badge } from '../components/ui.jsx';
import { downloadBlob } from '../utils.js';

export function AuthorityVerify() {
  const { apiKey, aiReady, model, showToast, recordUsage, audit, profile, guardAi } = useApp();
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [verdicts, setVerdicts] = useState(null);
  const [busy, setBusy] = useState(false);

  const analyse = () => {
    const r = auditCitations(text);
    setResult(r);
    setVerdicts(null);
    if (!r.items.length) showToast('info', 'No case citations detected in the text.');
  };

  const verifyLive = async () => {
    if (!result?.items.length) return;
    if (!aiReady) { showToast('warning', 'Add your Gemini API key in Profile first.'); return; }
    if (!guardAi()) return;
    setBusy(true);
    try {
      const { verdicts: v, usage } = await verifyCitations({
        apiKey, model, cases: result.items.map((i) => ({ name: i.name, citation: i.citation })),
      });
      setVerdicts(v);
      recordUsage('authority-verify', { model, usage, grounded: true });
      audit('AI_VERIFY', `${v.length} authority(ies)`);
    } catch (e) {
      showToast('error', e.message);
    } finally {
      setBusy(false);
    }
  };

  const downloadReport = () => {
    if (!result) return;
    const lines = [];
    lines.push(`${(profile.firmName || 'LexiAssist')} — AUTHORITY VERIFICATION REPORT`);
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push('='.repeat(60));
    lines.push(`Citations found: ${result.items.length} (verified ${result.verifiedCount}, unverified ${result.unverifiedCount})`);
    lines.push('');
    result.items.forEach((it, i) => {
      const live = verdicts?.find((v) => v.name === it.name);
      lines.push(`${i + 1}. ${it.name}${it.verifiedCitation || it.citation ? ` — ${it.verifiedCitation || it.citation}` : ''}`);
      lines.push(`   Status: ${it.status === 'verified' ? 'VERIFIED (database)' : 'UNVERIFIED (not in local DB)'}`);
      if (it.holding) lines.push(`   Holding: ${it.holding}`);
      if (live) lines.push(`   Live web: ${live.verdict}${live.url ? ` — ${live.url}` : ''}`);
      lines.push('');
    });
    if (result.repealed.length) { lines.push('REPEALED / SUPERSEDED:'); result.repealed.forEach((r) => lines.push(`  - ${r}`)); lines.push(''); }
    if (result.foreign.length) { lines.push(`FOREIGN AUTHORITIES (persuasive only): ${result.foreign.join(', ')}`); lines.push(''); }
    lines.push('-'.repeat(60));
    lines.push('All authorities must be independently confirmed (NWLR / LPELR / Law Pavilion) before reliance.');
    downloadBlob(lines.join('\n'), 'Authority_Verification_Report.txt', 'text/plain;charset=utf-8');
    audit('EXPORT', 'authority-report');
  };

  return (
    <div className="space-y-6">
      <PageHeader icon={ShieldCheck} title="Authority Verification" subtitle="Extract & classify every case, statute and authority cited — then confirm on the live web" gradient="from-emerald-500 to-cyan-500" />

      <Card variant="glass" className="space-y-3">
        <Textarea label="Paste an AI-generated argument, draft, or memo" rows={9}
          placeholder="Paste the text whose citations you want to verify…"
          value={text} onChange={(e) => setText(e.target.value)} />
        <div className="flex gap-2 flex-wrap">
          <Button onClick={analyse} disabled={!text.trim()} leftIcon={<ShieldCheck className="w-4 h-4" />}>Extract & classify</Button>
          {result?.items.length > 0 && (
            <Button variant="outline" onClick={verifyLive} isLoading={busy} leftIcon={<Globe className="w-4 h-4" />}>Confirm on live web</Button>
          )}
          {result && <Button variant="secondary" onClick={downloadReport} leftIcon={<Download className="w-4 h-4" />}>Download report</Button>}
        </div>
      </Card>

      {result && (
        <Card variant="glass" className="space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <Badge variant="success">{result.verifiedCount} verified</Badge>
            <Badge variant="warning">{result.unverifiedCount} unverified</Badge>
            {result.seriesDetected.length > 0 && <span className="text-xs text-slate-400">Series: {result.seriesDetected.join(', ')}</span>}
          </div>

          {result.items.length === 0 ? (
            <p className="text-sm text-slate-500">No case-name citations (e.g. “X v Y”) were detected.</p>
          ) : (
            <ul className="space-y-2">
              {result.items.map((it, i) => {
                const live = verdicts?.find((v) => v.name === it.name);
                return (
                  <li key={i} className="flex items-start gap-2 text-sm border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0">
                    {it.status === 'verified'
                      ? <BadgeCheck className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      : <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />}
                    <div className="flex-1">
                      <span className="font-medium text-slate-800 dark:text-slate-100">{it.name}</span>
                      {(it.verifiedCitation || it.citation) && <span className="text-slate-500"> {it.verifiedCitation || it.citation}</span>}
                      {it.status === 'verified'
                        ? <Badge variant="success" className="ml-2">Verified (DB)</Badge>
                        : <Badge variant="warning" className="ml-2">Unverified</Badge>}
                      {live && (
                        <span className="ml-2">
                          <Badge variant={live.verdict === 'REAL' ? 'success' : live.verdict === 'NOT FOUND' ? 'danger' : 'warning'}>Live: {live.verdict}</Badge>
                          {live.url && <a href={live.url} target="_blank" rel="noopener noreferrer" className="ml-2 text-xs text-emerald-600 dark:text-emerald-400 hover:underline">source</a>}
                        </span>
                      )}
                      {it.holding && <p className="text-xs text-slate-400 mt-0.5">{it.holding}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {result.repealed.map((r, i) => (
            <p key={i} className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1.5"><AlertTriangle className="w-3.5 h-3.5 mt-0.5" /> {r}</p>
          ))}
          {result.foreign.length > 0 && (
            <p className="text-xs text-blue-600 dark:text-blue-400 flex items-start gap-1.5"><FileText className="w-3.5 h-3.5 mt-0.5" /> Foreign authorities ({result.foreign.join(', ')}) are persuasive only, not binding in Nigeria.</p>
          )}
        </Card>
      )}
    </div>
  );
}
