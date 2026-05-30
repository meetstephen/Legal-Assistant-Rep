// ============================================================
// lexi/useAiRun.js — shared streaming-AI hook used by every AI page
// ============================================================

import { useState, useRef, useCallback } from 'react';
import { useApp } from './AppContext.jsx';
import { streamGenerate } from './ai.js';
import { parseConfidence } from './prompts.js';

export function useAiRun(feature = 'ai') {
  const { apiKey, aiReady, model, webGrounding, recordUsage, audit, showToast, guardAi } = useApp();
  const [running, setRunning] = useState(false);
  const [text, setText] = useState('');
  const [thoughts, setThoughts] = useState('');
  const [sources, setSources] = useState([]);
  const [queries, setQueries] = useState([]);
  const [scores, setScores] = useState(null);
  const [cleanText, setCleanText] = useState('');
  const [error, setError] = useState('');
  const [grounded, setGrounded] = useState(false);
  const abortRef = useRef(null);

  const reset = useCallback(() => {
    setText('');
    setThoughts('');
    setSources([]);
    setQueries([]);
    setScores(null);
    setCleanText('');
    setError('');
    setGrounded(false);
  }, []);

  const stop = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setRunning(false);
  }, []);

  const run = useCallback(
    async (opts = {}) => {
      if (!aiReady) {
        showToast('warning', 'Add your Gemini API key in Profile → Settings first.');
        return null;
      }
      if (!guardAi()) return null;
      reset();
      setRunning(true);
      const controller = new AbortController();
      abortRef.current = controller;
      const useGrounding = opts.webGrounding != null ? opts.webGrounding : webGrounding;
      try {
        const result = await streamGenerate({
          apiKey,
          model,
          mode: opts.mode || 'standard',
          webGrounding: useGrounding,
          thinking: opts.thinking !== false,
          systemInstruction: opts.systemInstruction,
          userText: opts.userText,
          parts: opts.parts,
          signal: controller.signal,
          onText: (_chunk, full) => setText(full),
          onThought: (_chunk, full) => setThoughts(full),
        });
        const parsed = parseConfidence(result.text);
        setText(result.text);
        setCleanText(parsed.cleanText);
        setScores(parsed.scores);
        setSources(result.sources || []);
        setQueries(result.queries || []);
        setGrounded(result.grounded);
        if (result.usage) recordUsage(feature, { model, usage: result.usage, grounded: result.grounded });
        audit('AI_QUERY', feature);
        return { ...result, cleanText: parsed.cleanText, scores: parsed.scores };
      } catch (e) {
        if (e.name === 'AbortError') {
          showToast('info', 'Stopped.');
        } else {
          setError(e.message);
          showToast('error', e.message);
        }
        return null;
      } finally {
        setRunning(false);
        abortRef.current = null;
      }
    },
    [apiKey, aiReady, model, webGrounding, recordUsage, audit, showToast, guardAi, reset, feature]
  );

  return {
    run, stop, reset, running,
    text, thoughts, sources, queries, scores, cleanText, error, grounded,
  };
}
