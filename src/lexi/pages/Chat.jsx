// ============================================================
// lexi/pages/Chat.jsx — multi-turn conversational legal assistant
//
// NEW in the React edition (the original is single-shot only): a persistent,
// streaming conversation that keeps context across turns, with native
// reasoning, optional live web grounding, per-reply citation audit + sources,
// optional case-context attachment, and one-click "save reply to case".
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import {
  MessageCircle, Send, Square, Plus, Globe, Brain, Save, User, Sparkles, Paperclip, X,
} from 'lucide-react';
import { useApp } from '../AppContext.jsx';
import { streamGenerate } from '../ai.js';
import { parseConfidence } from '../prompts.js';
import { BASE_SYSTEM, GROUNDING_INSTRUCTION, RESPONSE_MODES } from '../promptData/index.js';
import { statuteGroundingBlock } from '../citations.js';
import { storage, STORAGE_KEYS } from '../database.js';
import { extractDocument, ACCEPTED_DOC_TYPES } from '../docParse.js';
import { wrapDocument } from '../prompts.js';
import { Card, Button, Select, Toggle, Badge, PageHeader } from '../components/ui.jsx';
import { ReasoningPanel, GroundingSources, CitationAudit } from '../components/AiPanels.jsx';
import { renderMarkdown, generateId } from '../utils.js';

const GREETING = {
  id: 'intro',
  role: 'model',
  text:
    "Hello — I'm LexiAssist. Ask me anything in Nigerian law and I'll reason it through, cite authorities, and (with grounding on) pull real, current sources. Attach a document or a case for context. How can I help?",
};

export function Chat() {
  const {
    apiKey, aiReady, model, webGrounding, profile, cases, navigate, pageParams,
    recordUsage, audit, showToast, saveAnalysis, pushHistory, guardAi,
  } = useApp();

  const [messages, setMessages] = useState(() => {
    const saved = storage.get(STORAGE_KEYS.CHAT, null);
    return Array.isArray(saved) && saved.length ? saved : [GREETING];
  });
  const [input, setInput] = useState('');
  const [running, setRunning] = useState(false);
  const [ground, setGround] = useState(webGrounding);
  const [thinking, setThinking] = useState(true);
  const [mode, setMode] = useState('standard');
  const [caseId, setCaseId] = useState('');
  const [doc, setDoc] = useState(null);
  const abortRef = useRef(null);
  const endRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    storage.set(STORAGE_KEYS.CHAT, messages.slice(-40));
  }, [messages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, running]);

  // Preselect a case when arriving via "Ask AI about this case".
  useEffect(() => {
    if (pageParams && pageParams.caseId) setCaseId(pageParams.caseId);
  }, [pageParams]);

  const buildSystem = () => {
    const parts = [
      BASE_SYSTEM,
      `DEFAULT JURISDICTION: ${profile.defaultJurisdiction || 'Nigeria (Federal)'}.`,
      'You are in an interactive chat. Keep continuity with earlier turns, ask a clarifying question when the facts are thin, and be concise unless asked to expand. Never invent cases or citations.',
    ];
    const rag = statuteGroundingBlock(input);
    if (rag) parts.push(rag);
    if (ground) parts.push(GROUNDING_INSTRUCTION);
    const c = cases.find((x) => x.id === caseId);
    if (c) {
      parts.push(
        `ACTIVE CASE CONTEXT — ${c.title} (Suit ${c.suitNo}${c.court ? `, ${c.court}` : ''}). Notes: ${c.notes || 'none'}. Use this as the matter background.`
      );
    }
    return parts.join('\n\n');
  };

  const stop = () => {
    abortRef.current?.abort();
    setRunning(false);
  };

  const send = async () => {
    const text = input.trim();
    if (!text && !doc) return;
    if (!aiReady) {
      showToast('warning', 'Add your Gemini API key in Profile → AI Settings first.');
      return;
    }
    if (!guardAi()) return;
    const userText = doc ? `${text}\n\n${wrapDocument(doc.sanitized)}` : text;
    const userMsg = { id: generateId(), role: 'user', text: text || `(document: ${doc.name})`, sentText: userText };
    const modelMsg = { id: generateId(), role: 'model', text: '', thoughts: '', sources: [], queries: [], scores: null, streaming: true };
    const history = [...messages.filter((m) => m.id !== 'intro'), userMsg];
    setMessages([...messages, userMsg, modelMsg]);
    setInput('');
    setDoc(null);
    setRunning(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const apiMessages = history.map((m) => ({ role: m.role, text: m.sentText || m.text }));

    try {
      const result = await streamGenerate({
        apiKey,
        model,
        mode,
        webGrounding: ground,
        thinking,
        systemInstruction: buildSystem(),
        messages: apiMessages,
        signal: controller.signal,
        onText: (_c, full) => setMessages((prev) => prev.map((m) => (m.id === modelMsg.id ? { ...m, text: full } : m))),
        onThought: (_c, full) => setMessages((prev) => prev.map((m) => (m.id === modelMsg.id ? { ...m, thoughts: full } : m))),
      });
      const parsed = parseConfidence(result.text);
      setMessages((prev) => prev.map((m) => (m.id === modelMsg.id
        ? { ...m, text: parsed.cleanText, thoughts: result.thoughts, sources: result.sources, queries: result.queries, scores: parsed.scores, grounded: result.grounded, streaming: false }
        : m)));
      if (result.usage) recordUsage('chat', { model, usage: result.usage, grounded: result.grounded });
      audit('AI_QUERY', 'chat');
      pushHistory({ feature: 'chat', prompt: text });
    } catch (e) {
      if (e.name === 'AbortError') {
        setMessages((prev) => prev.map((m) => (m.id === modelMsg.id ? { ...m, text: m.text || '_(stopped)_', streaming: false } : m)));
      } else {
        setMessages((prev) => prev.map((m) => (m.id === modelMsg.id ? { ...m, text: `⚠️ ${e.message}`, streaming: false } : m)));
        showToast('error', e.message);
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  };

  const newChat = () => {
    setMessages([GREETING]);
    setCaseId('');
    setDoc(null);
    showToast('info', 'Started a new chat.');
  };

  const attach = async (file) => {
    if (!file) return;
    try {
      const parsed = await extractDocument(file);
      setDoc(parsed);
      showToast('success', `Attached ${parsed.name}.`);
    } catch (e) {
      showToast('error', e.message);
    }
  };

  const saveReply = (m) => {
    saveAnalysis({ caseId: caseId || null, title: `Chat reply — ${new Date().toLocaleDateString()}`, content: m.text, grounded: m.grounded });
    showToast('success', caseId ? 'Saved to case.' : 'Saved to analyses.');
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!running) send();
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader icon={MessageCircle} title="AI Chat" subtitle="A conversation that remembers context — reasoned, grounded, and verifiable" gradient="from-fuchsia-500 to-purple-600">
        <Button variant="secondary" size="sm" onClick={newChat} leftIcon={<Plus className="w-4 h-4" />}>New chat</Button>
      </PageHeader>

      {!aiReady && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-amber-800 dark:text-amber-200">Add your Gemini API key to start chatting.</p>
            <Button size="sm" onClick={() => navigate('profile')}>Add API key</Button>
          </div>
        </Card>
      )}

      {/* Controls */}
      <Card variant="flat" className="grid sm:grid-cols-4 gap-3 items-center">
        <Select label="Depth" value={mode} onChange={(e) => setMode(e.target.value)} options={RESPONSE_MODES.map((m) => ({ value: m.id, label: m.label }))} />
        <Select label="Case context" value={caseId} onChange={(e) => setCaseId(e.target.value)} options={[{ value: '', label: 'None' }, ...cases.map((c) => ({ value: c.id, label: c.title }))]} />
        <div className="flex items-center pt-5"><Toggle checked={ground} onChange={setGround} label="Web grounding" /></div>
        <div className="flex items-center pt-5"><Toggle checked={thinking} onChange={setThinking} label="Reasoning" /></div>
      </Card>

      {/* Conversation */}
      <Card variant="glass" className="p-4 space-y-4 min-h-[40vh]">
        {messages.map((m) => (
          <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div className={m.role === 'user' ? 'max-w-[85%]' : 'max-w-[92%] w-full'}>
              {m.role === 'user' ? (
                <div className="rounded-2xl rounded-br-sm bg-emerald-500 text-white px-4 py-2.5 text-sm whitespace-pre-wrap">
                  <div className="flex items-center gap-1.5 text-emerald-50/80 text-xs mb-0.5"><User className="w-3 h-3" /> You</div>
                  {m.text}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-violet-500 font-medium">
                    <Brain className="w-3.5 h-3.5" /> LexiAssist
                    {m.grounded && <Badge variant="success"><Globe className="w-3 h-3" /> grounded</Badge>}
                    {m.streaming && <Sparkles className="w-3 h-3 animate-pulse" />}
                  </div>
                  {m.thoughts ? <ReasoningPanel thoughts={m.thoughts} /> : null}
                  <div className="rounded-2xl rounded-bl-sm bg-slate-100 dark:bg-slate-800 px-4 py-3">
                    <div className="lexi-prose text-sm text-slate-700 dark:text-slate-200" dangerouslySetInnerHTML={{ __html: renderMarkdown(m.text || (m.streaming ? '…' : '')) }} />
                  </div>
                  {!m.streaming && m.text && m.id !== 'intro' && (
                    <>
                      {m.sources?.length > 0 && <GroundingSources sources={m.sources} queries={m.queries} />}
                      <CitationAudit text={m.text} />
                      <Button size="sm" variant="ghost" onClick={() => saveReply(m)} leftIcon={<Save className="w-4 h-4" />}>
                        Save reply{caseId ? ' to case' : ''}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </Card>

      {/* Composer */}
      <Card variant="glass" className="space-y-2">
        {doc && (
          <div className="flex items-center gap-2 text-sm">
            <Paperclip className="w-4 h-4 text-emerald-500" />
            <span className="font-medium text-slate-700 dark:text-slate-200">{doc.name}</span>
            <Badge variant="default">{doc.chars.toLocaleString()} chars</Badge>
            <button onClick={() => setDoc(null)} className="ml-auto p-1 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <input ref={fileRef} type="file" accept={ACCEPTED_DOC_TYPES} className="hidden" onChange={(e) => attach(e.target.files?.[0])} />
          <button onClick={() => fileRef.current?.click()} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-emerald-500" title="Attach document">
            <Paperclip className="w-5 h-5" />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Ask a legal question…  (Enter to send, Shift+Enter for a new line)"
            className="flex-1 resize-none rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 max-h-40 thin-scrollbar"
          />
          {running ? (
            <Button variant="danger" onClick={stop} leftIcon={<Square className="w-4 h-4" />}>Stop</Button>
          ) : (
            <Button onClick={send} disabled={!input.trim() && !doc} leftIcon={<Send className="w-4 h-4" />}>Send</Button>
          )}
        </div>
        {ground && <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Replies will be grounded in live web sources with clickable links.</p>}
      </Card>
    </div>
  );
}
