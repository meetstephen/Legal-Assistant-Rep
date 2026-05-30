// ============================================================
// lexi/pages/PracticeUpdates.jsx — always-live Nigerian legal news feed
// ============================================================

import React, { useState } from 'react';
import { Newspaper, RefreshCw, ExternalLink, Globe, Sparkles } from 'lucide-react';
import { useApp } from '../AppContext.jsx';
import { fetchPracticeUpdates } from '../webSearch.js';
import { Card, Button, Input, PageHeader, Badge } from '../components/ui.jsx';
import { useAiRun } from '../useAiRun.js';
import { AiResult } from '../components/AiResult.jsx';
import { renderMarkdown } from '../utils.js';

function parseItems(text) {
  // Split on "### " headlines.
  const blocks = text.split(/\n(?=###\s)/).map((b) => b.trim()).filter(Boolean);
  return blocks
    .map((b) => {
      const headline = (b.match(/^###\s*(.+)$/m) || [])[1] || '';
      const date = (b.match(/Date:\s*(.+)$/m) || [])[1] || '';
      const summary = (b.match(/Summary:\s*([\s\S]*?)(?:\nPractice impact:|\nSource:|$)/m) || [])[1] || '';
      const impact = (b.match(/Practice impact:\s*([\s\S]*?)(?:\nSource:|$)/m) || [])[1] || '';
      const source = (b.match(/Source:\s*(\S+)/m) || [])[1] || '';
      if (!headline) return null;
      return { headline, date, summary: summary.trim(), impact: impact.trim(), source };
    })
    .filter(Boolean);
}

export function PracticeUpdates() {
  const { apiKey, aiReady, model, showToast, recordUsage, audit, guardAi } = useApp();
  const [topic, setTopic] = useState('');
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState(null);
  const [raw, setRaw] = useState('');
  const [sources, setSources] = useState([]);
  const deep = useAiRun('practice-deepdive');

  const load = async () => {
    if (!aiReady) {
      showToast('warning', 'Add your Gemini API key in Profile first.');
      return;
    }
    if (!guardAi()) return;
    setBusy(true);
    setItems(null);
    try {
      const r = await fetchPracticeUpdates({ apiKey, model, topic });
      const parsed = parseItems(r.text || '');
      setItems(parsed);
      setRaw(r.text || '');
      setSources(r.sources || []);
      recordUsage('practice-updates', { model, usage: r.usage, grounded: true });
      audit('AI_QUERY', 'practice-updates');
      if (!parsed.length) showToast('info', 'No structured items returned — see the raw feed below.');
    } catch (e) {
      showToast('error', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader icon={Newspaper} title="Practice Updates" subtitle="Always sourced live from the web — real, recent Nigerian developments with source links" gradient="from-amber-400 to-rose-500" />

      <Card variant="glass" className="space-y-3">
        <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" /> This feed forces live web search ON by default — it does not depend on the sidebar switch.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input className="flex-1" placeholder="Optional: focus topic (e.g. 'tax', 'electoral law', 'CAMA', 'data protection')" value={topic} onChange={(e) => setTopic(e.target.value)} />
          <Button onClick={load} isLoading={busy} leftIcon={<RefreshCw className="w-4 h-4" />}>{items ? 'Refresh' : 'Fetch updates'}</Button>
        </div>
      </Card>

      {items && items.length > 0 && (
        <div className="grid gap-4">
          {items.map((it, i) => (
            <Card key={i} variant="glass" hover>
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-semibold text-slate-900 dark:text-white">{it.headline}</h3>
                {it.date && <Badge variant="default">{it.date}</Badge>}
              </div>
              {it.summary && <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{it.summary}</p>}
              {it.impact && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">Practice impact: </span>{it.impact}
                </p>
              )}
              <div className="flex items-center gap-3">
                {it.source && (
                  <a href={it.source} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1">
                    <ExternalLink className="w-3.5 h-3.5" /> Source
                  </a>
                )}
                <Button size="sm" variant="ghost" onClick={() => deep.run({
                  systemInstruction: 'You are a Nigerian legal analyst. Give a deep-dive on this development: background, what changed, who it affects, action points for lawyers, and open questions. Ground in live web sources and cite them.',
                  userText: `Deep dive on this Nigerian legal development: ${it.headline}. ${it.summary}`,
                  mode: 'standard', webGrounding: true,
                })} leftIcon={<Sparkles className="w-4 h-4" />}>Deep dive</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {items && items.length === 0 && raw && (
        <Card variant="glass">
          <div className="lexi-prose text-sm text-slate-700 dark:text-slate-200" dangerouslySetInnerHTML={{ __html: renderMarkdown(raw) }} />
        </Card>
      )}

      {sources.length > 0 && (
        <Card variant="flat">
          <p className="text-xs font-semibold text-slate-500 mb-2">Sources used</p>
          <ul className="space-y-1">
            {sources.map((s, i) => (
              <li key={i}><a href={s.uri} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline break-all">{s.title || s.uri}</a></li>
            ))}
          </ul>
        </Card>
      )}

      <AiResult ai={deep} title="Deep dive" exportTitle="Practice Update Deep Dive" allowSave={false} showAudit={false} />
    </div>
  );
}
