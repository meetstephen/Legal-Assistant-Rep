// ============================================================
// lexi/components/QuickPrecedentFinder.jsx — fast, always-live precedent search
//
// A compact widget (used on Home and Research) that returns a short, structured
// list of on-point Nigerian authorities with clickable source links. Always
// grounded on the live web; rate-limited like every other AI feature.
// ============================================================

import React, { useState } from 'react';
import { Gavel, Search, ExternalLink, Loader2, Globe } from 'lucide-react';
import { useApp } from '../AppContext.jsx';
import { findPrecedents } from '../webSearch.js';
import { Card, Button, Input, Badge } from './ui.jsx';

export function QuickPrecedentFinder({ compact = false }) {
  const { aiReady, model, apiKey, showToast, recordUsage, audit, guardAi, navigate } = useApp();
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState(null);
  const [sources, setSources] = useState([]);

  const run = async () => {
    if (!query.trim()) return;
    if (!aiReady) {
      showToast('warning', 'Add your Gemini API key in Profile first.');
      navigate && navigate('profile');
      return;
    }
    if (!guardAi()) return;
    setBusy(true);
    setItems(null);
    try {
      const r = await findPrecedents({ apiKey, model, query });
      setItems(r.items);
      setSources(r.sources || []);
      recordUsage('precedent-finder', { model, usage: r.usage, grounded: true });
      audit('AI_QUERY', 'precedent-finder');
      if (!r.items.length) showToast('info', 'No reliable authority found — try rephrasing the issue.');
    } catch (e) {
      showToast('error', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card variant="glass" className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
          <Gavel className="w-4 h-4 text-emerald-500" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Quick Precedent Finder</h3>
          <p className="text-[11px] text-slate-400 flex items-center gap-1"><Globe className="w-3 h-3" /> Always live — real Nigerian authorities with source links</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Input
          className="flex-1"
          leftIcon={<Search className="w-4 h-4" />}
          placeholder="e.g. liquidated damages vs penalty in building contracts"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && run()}
        />
        <Button onClick={run} isLoading={busy} disabled={!query.trim()}>Find</Button>
      </div>

      {busy && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-500" /> Searching the live web…
        </div>
      )}

      {items && items.length > 0 && (
        <ul className="space-y-2">
          {items.slice(0, compact ? 4 : 6).map((it, i) => (
            <li key={i} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 dark:text-slate-100 text-sm">
                    {it.name}{it.citation ? <span className="text-slate-500 font-normal"> {it.citation}</span> : ''}
                  </p>
                  {it.relevance && <p className="text-xs text-slate-500 mt-0.5">{it.relevance}</p>}
                </div>
                {it.court && <Badge variant="info" className="flex-shrink-0">{it.court}</Badge>}
              </div>
              {it.url && (
                <a href={it.url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 mt-1.5">
                  <ExternalLink className="w-3 h-3" /> source
                </a>
              )}
            </li>
          ))}
        </ul>
      )}

      {items && items.length > 0 && !compact && sources.length > 0 && (
        <p className="text-[11px] text-slate-400">
          Open and confirm each authority (NWLR / LPELR / Law Pavilion) before relying on it.
        </p>
      )}
    </Card>
  );
}
