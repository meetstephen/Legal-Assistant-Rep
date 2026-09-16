// ============================================================
// lexi/useAiRun.js — shared streaming-AI hook used by every AI page
// ============================================================

import { useState, useRef, useCallback, useEffect } from 'react';
import { createAiRunLifecycle } from './aiRunLifecycle.js';
import { useApp } from './AppContext.jsx';
import { streamGenerate, isWeakAnswer } from './ai.js';
import { parseConfidence } from './prompts.js';

export function useAiRun(feature = 'ai') {
  const { apiKey, aiReady, model, webGrounding, recordUsage, audit, showToast, guardAi } = useApp();
  const [running, setRunning] = useState(false);
  const [refining, setRefining] = useState(false);
  const [refined, setRefined] = useState(false);
  const [text, setText] = useState('');
  const [thoughts, setThoughts] = useState('');
  const [sources, setSources] = useState([]);
  const [queries, setQueries] = useState([]);
  const [scores, setScores] = useState(null);
  const [cleanText, setCleanText] = useState('');
  const [error, setError] = useState('');
  const [grounded, setGrounded] = useState(false);
  const lifecycleRef = useRef(null);
  if (!lifecycleRef.current) lifecycleRef.current = createAiRunLifecycle();
  useEffect(() => () => lifecycleRef.current.cancel(), []);

  const reset = useCallback(() => {
    lifecycleRef.current.cancel();
    setRunning(false);
    setText('');
    setThoughts('');
    setSources([]);
    setQueries([]);
    setScores(null);
    setCleanText('');
    setError('');
    setGrounded(false);
    setRefined(false);
    setRefining(false);
  }, []);

  const stop = useCallback(() => {
    lifecycleRef.current.cancel();
    setRunning(false);
    setRefining(false);
    showToast('info', 'Stopped.');
  }, [showToast]);

  const run = useCallback(
    async (opts = {}) => {
      if (!aiReady) {
        showToast('warning', 'Add your Gemini API key in Profile → Settings first.');
        return null;
      }
      if (!guardAi()) return null;
      reset();
      setRunning(true);
      const request = lifecycleRef.current.start();
      const { controller, isCurrent } = request;
      const useGrounding = opts.webGrounding != null ? opts.webGrounding : webGrounding;
      try {
        let result = await streamGenerate({
          apiKey,
          model,
          mode: opts.mode || 'standard',
          webGrounding: useGrounding,
          thinking: opts.thinking !== false,
          systemInstruction: opts.systemInstruction,
          userText: opts.userText,
          parts: opts.parts,
          signal: controller.signal,
          onText: (_chunk, full) => { if (isCurrent()) setText(full); },
          onThought: (_chunk, full) => { if (isCurrent()) setThoughts(full); },
        });
        if (!isCurrent()) return null;
        if (result.usage) recordUsage(feature, { model, usage: result.usage, grounded: result.grounded });
        let parsed = parseConfidence(result.text);

        // ---- Quality gate (opt-in): silently critique; if weak, regenerate
        // once under stricter instructions. Off by default to control cost.
        if (opts.qualityGate && opts.userText && isCurrent() && guardAi()) {
          setRefining(true);
          const weak = await isWeakAnswer({
            apiKey, model, question: opts.userText, answer: parsed.cleanText, signal: controller.signal,
          });
          if (!isCurrent()) return null;
          if (weak && guardAi()) {
            const stricter = `${opts.systemInstruction || ''}\n\nSTRICTER PASS: a first draft was judged weak. Be more rigorous and precise: ground every proposition in the correct Nigerian statute/section and a real authority, address counter-arguments, remove anything you cannot stand behind, and do NOT invent citations.`;
            const second = await streamGenerate({
              apiKey,
              model,
              mode: opts.mode || 'standard',
              webGrounding: useGrounding,
              thinking: opts.thinking !== false,
              systemInstruction: stricter,
              userText: opts.userText,
              parts: opts.parts,
              signal: controller.signal,
              onText: (_chunk, full) => { if (isCurrent()) setText(full); },
              onThought: (_chunk, full) => { if (isCurrent()) setThoughts(full); },
            });
            if (!isCurrent()) return null;
            if (second.usage) recordUsage(feature, { model, usage: second.usage, grounded: second.grounded });
            result = second;
            parsed = parseConfidence(second.text);
            setRefined(true);
          }
          setRefining(false);
        }

        if (!isCurrent()) return null;
        setText(result.text);
        setCleanText(parsed.cleanText);
        setScores(parsed.scores);
        setSources(result.sources || []);
        setQueries(result.queries || []);
        setGrounded(result.grounded);
        audit('AI_QUERY', feature);
        return { ...result, cleanText: parsed.cleanText, scores: parsed.scores };
      } catch (e) {
        if (!isCurrent()) return null;
        if (e.name === 'AbortError') {
          showToast('info', 'Stopped.');
        } else {
          setError(e.message);
          showToast('error', e.message);
        }
        return null;
      } finally {
        if (isCurrent()) {
          setRunning(false);
          setRefining(false);
          request.finish();
        }
      }
    },
    [apiKey, aiReady, model, webGrounding, recordUsage, audit, showToast, guardAi, reset, feature]
  );

  return {
    run, stop, reset, running, refining, refined,
    text, thoughts, sources, queries, scores, cleanText, error, grounded,
  };
}

