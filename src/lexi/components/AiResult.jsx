// ============================================================
// lexi/components/AiResult.jsx — full AI answer presentation
// ============================================================

import React, { useState, useEffect } from 'react';
import { FileText, Download, Copy, Save, Globe, Loader2 } from 'lucide-react';
import { useApp } from '../AppContext.jsx';
import { renderMarkdown } from '../utils.js';
import { DISCLAIMER } from '../runtime.js';
import { exportTxt, exportDoc, exportPdf, copyToClipboard } from '../exports.js';
import { Card, Button, Badge, Disclaimer } from './ui.jsx';
import { ReasoningPanel, GroundingSources, ConfidenceMeter, CitationAudit } from './AiPanels.jsx';

export function AiResult({ ai, title = 'LexiAssist Response', exportTitle, allowSave = true, showAudit = true }) {
  const { profile, cases, saveAnalysis, showToast, audit, navigate } = useApp();
  const [saveCaseId, setSaveCaseId] = useState('');
  const [savedId, setSavedId] = useState('');
  const body = ai.cleanText || ai.text;
  useEffect(() => { setSavedId(''); }, [body]);

  if (!ai.running && !body && !ai.error) return null;

  const doExport = async (fn, kind) => {
    try {
      const sources = (ai.sources || []).filter(source => /^https?:\/\//i.test(source.uri || ''));
      const exportedBody = sources.length ? `${body}\n\n## Search-linked sources (verify before reliance)\n${sources.map(source => `- ${source.title || 'Source'}: ${source.uri}`).join('\n')}` : body;
      const result = await fn(exportedBody, { profile, title: exportTitle || title, filename: exportTitle || title });
      audit('EXPORT', kind);
      showToast(result === false ? 'warning' : 'success', kind === 'PDF' ? (result === false ? 'Popup blocked. Downloaded a printable HTML copy instead.' : 'Print dialog opened. Choose Save as PDF to create your PDF.') : `Exported as ${kind}.`);
    } catch { showToast('error', 'Export failed. Please try again.'); }
  };

  const handleSave = () => {
    const saved = saveAnalysis({
      caseId: saveCaseId || null,
      title: exportTitle || title,
      content: body,
      grounded: ai.grounded,
      sources: ai.sources || [], queries: ai.queries || [], scores: ai.scores || null,
    });
    setSavedId(saved.id);
    showToast('success', saveCaseId ? 'Saved to case.' : 'Saved to analyses.');
  };

  return (
    <div className="space-y-4">
      {ai.running && !body && (
        <Card variant="glass" className="flex items-center gap-3 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
          <span className="text-sm">
            LexiAssist is reasoning through the Nigerian legal framework{ai.thoughts ? ' — see the trace below' : ''}…
          </span>
        </Card>
      )}

      {ai.refining && (
        <Card variant="flat" className="flex items-center gap-3 text-sm text-violet-600 dark:text-violet-300">
          <Loader2 className="w-4 h-4 animate-spin" />
          Editorial review: improving clarity and coverage (not independent fact verification)…
        </Card>
      )}

      <ReasoningPanel thoughts={ai.thoughts} />

      {(body || ai.running) && (
        <Card variant="glass">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                <FileText className="w-5 h-5 text-emerald-500" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
              {ai.grounded && <Badge variant="success"><Globe className="w-3 h-3" /> Search-linked</Badge>}
              {ai.refined && <Badge variant="violet">Editorially refined</Badge>}
              {ai.running && <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />}
            </div>
            {body && !ai.running && (
              <div className="flex gap-1.5 flex-wrap">
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(body).then(() => showToast('success', 'Copied.'))} leftIcon={<Copy className="w-4 h-4" />}>Copy</Button>
                <Button size="sm" variant="secondary" onClick={() => doExport(exportTxt, 'TXT')}>TXT</Button>
                <Button size="sm" variant="secondary" onClick={() => doExport(exportDoc, 'DOCX')}>DOCX</Button>
                <Button size="sm" variant="secondary" onClick={() => doExport(exportPdf, 'PDF')} leftIcon={<Download className="w-4 h-4" />}>PDF</Button>
              </div>
            )}
          </div>
          <div
            className="lexi-prose text-slate-700 dark:text-slate-200 text-[15px]"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }}
          />
        </Card>
      )}

      {!ai.running && body && (
        <>
          <GroundingSources sources={ai.sources} queries={ai.queries} />
          <p className="text-xs text-amber-600 dark:text-amber-400">Source links and model confidence are not proof of legal accuracy. Confirm operative provisions, judgment holdings and current court rules before reliance.</p>
          <ConfidenceMeter scores={ai.scores} />
          {showAudit && <CitationAudit text={body} />}

          {allowSave && (
            <Card variant="flat" className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <Save className="w-4 h-4" /> Save this result
              </span>
              <select
                value={saveCaseId}
                onChange={(e) => setSaveCaseId(e.target.value)}
                className="rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm"
              >
                <option value="">Unfiled (general analyses)</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
              <Button size="sm" onClick={handleSave} leftIcon={<Save className="w-4 h-4" />}>Save</Button>
              {savedId && <Button size="sm" variant="secondary" onClick={() => navigate('library', { libraryId: `analysis:${savedId}` })}>Open in Library</Button>}
            </Card>
          )}

          <Disclaimer text={DISCLAIMER} />
        </>
      )}

      {ai.error && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <p className="text-sm text-red-600 dark:text-red-400">{ai.error}</p>
        </Card>
      )}
    </div>
  );
}
