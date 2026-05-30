// ============================================================
// lexi/components/AiResult.jsx — full AI answer presentation
// ============================================================

import React, { useState } from 'react';
import { FileText, Download, Copy, Save, Globe, Loader2 } from 'lucide-react';
import { useApp } from '../AppContext.jsx';
import { renderMarkdown } from '../utils.js';
import { DISCLAIMER } from '../runtime.js';
import { exportTxt, exportDoc, exportPdf, copyToClipboard } from '../exports.js';
import { Card, Button, Badge, Disclaimer } from './ui.jsx';
import { ReasoningPanel, GroundingSources, ConfidenceMeter, CitationAudit } from './AiPanels.jsx';

export function AiResult({ ai, title = 'LexiAssist Response', exportTitle, allowSave = true, showAudit = true }) {
  const { profile, cases, saveAnalysis, showToast, audit } = useApp();
  const [saveCaseId, setSaveCaseId] = useState('');
  const body = ai.cleanText || ai.text;

  if (!ai.running && !body && !ai.error) return null;

  const doExport = (fn, kind) => {
    fn(body, { profile, title: exportTitle || title, filename: exportTitle || title });
    audit('EXPORT', kind);
    showToast('success', `Exported as ${kind}.`);
  };

  const handleSave = () => {
    saveAnalysis({
      caseId: saveCaseId || null,
      title: exportTitle || title,
      content: body,
      grounded: ai.grounded,
    });
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
          Quality gate: checking the draft and tightening it if needed…
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
              {ai.grounded && <Badge variant="success"><Globe className="w-3 h-3" /> Grounded</Badge>}
              {ai.refined && <Badge variant="violet">Quality-checked</Badge>}
              {ai.running && <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />}
            </div>
            {body && !ai.running && (
              <div className="flex gap-1.5 flex-wrap">
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(body).then(() => showToast('success', 'Copied.'))} leftIcon={<Copy className="w-4 h-4" />}>Copy</Button>
                <Button size="sm" variant="secondary" onClick={() => doExport(exportTxt, 'TXT')}>TXT</Button>
                <Button size="sm" variant="secondary" onClick={() => doExport(exportDoc, 'DOC')}>DOC</Button>
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
