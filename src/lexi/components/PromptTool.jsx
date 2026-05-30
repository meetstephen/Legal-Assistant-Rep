// ============================================================
// lexi/components/PromptTool.jsx — generic AI tool page
//
// A reusable single-screen AI tool: configurable input fields, a response-mode
// selector, a per-query grounding override, and the shared AiResult panel.
// ============================================================

import React, { useState } from 'react';
import { Sparkles, Square, Globe } from 'lucide-react';
import { useApp } from '../AppContext.jsx';
import { useAiRun } from '../useAiRun.js';
import { RESPONSE_MODES } from '../promptData/index.js';
import { Card, Button, Input, Textarea, Select, PageHeader, Toggle } from './ui.jsx';
import { AiResult } from './AiResult.jsx';

export function PromptTool({
  icon,
  title,
  subtitle,
  gradient,
  feature,
  fields,
  buildUserText,
  systemInstruction,
  defaultMode = 'standard',
  ctaLabel = 'Generate',
  resultTitle,
  intro,
}) {
  const { webGrounding } = useApp();
  const ai = useAiRun(feature);
  const [values, setValues] = useState(() =>
    Object.fromEntries((fields || []).map((f) => [f.key, f.default || '']))
  );
  const [mode, setMode] = useState(defaultMode);
  const [groundOverride, setGroundOverride] = useState(webGrounding);

  const set = (key, v) => setValues((prev) => ({ ...prev, [key]: v }));

  const canRun = (fields || []).filter((f) => f.required).every((f) => (values[f.key] || '').trim());

  const submit = () => {
    ai.run({
      systemInstruction: typeof systemInstruction === 'function' ? systemInstruction(values) : systemInstruction,
      userText: buildUserText(values),
      mode,
      webGrounding: groundOverride,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader icon={icon} title={title} subtitle={subtitle} gradient={gradient} />
      {intro && <Card variant="flat" className="text-sm text-slate-600 dark:text-slate-300">{intro}</Card>}

      <Card variant="glass" className="space-y-4">
        {(fields || []).map((f) => {
          if (f.kind === 'select') {
            return (
              <Select key={f.key} label={f.label} value={values[f.key]} onChange={(e) => set(f.key, e.target.value)} options={f.options} />
            );
          }
          if (f.kind === 'input') {
            return (
              <Input key={f.key} label={f.label} placeholder={f.placeholder} value={values[f.key]} onChange={(e) => set(f.key, e.target.value)} />
            );
          }
          return (
            <Textarea
              key={f.key}
              label={f.label}
              placeholder={f.placeholder}
              rows={f.rows || 6}
              value={values[f.key]}
              onChange={(e) => set(f.key, e.target.value)}
            />
          );
        })}

        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <Select
            label="Response depth"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            options={RESPONSE_MODES.map((m) => ({ value: m.id, label: `${m.label} — ${m.description}` }))}
            className="sm:max-w-xs"
          />
          <div className="flex-1">
            <Toggle checked={groundOverride} onChange={setGroundOverride} label="Live web grounding for this run" />
          </div>
          {ai.running ? (
            <Button variant="danger" onClick={ai.stop} leftIcon={<Square className="w-4 h-4" />}>Stop</Button>
          ) : (
            <Button onClick={submit} disabled={!canRun} leftIcon={<Sparkles className="w-4 h-4" />}>{ctaLabel}</Button>
          )}
        </div>
        {groundOverride && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" /> This run will search the live web and cite real sources.
          </p>
        )}
      </Card>

      <AiResult ai={ai} title={resultTitle || title} exportTitle={resultTitle || title} />
    </div>
  );
}
