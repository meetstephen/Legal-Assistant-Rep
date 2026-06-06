// ============================================================
// lexi/ai.js — core AI engine
//
// Mirrors lexi/ai.py from the README build. Implements:
//   • Gemini 2.5 native reasoning ("thinking") via thinkingConfig
//   • App-wide live web grounding via the google_search tool (real source links)
//   • Streaming output (streamGenerateContent?alt=sse)
//   • Graceful fallback chain: thinking+search -> search-only -> plain
//   • Per-call usage capture + estimated spend
//   • Optional silent quality-gate self-critique
//
// API key routing logic:
//   1. If the caller supplies a personal apiKey → direct call to Gemini API
//      (used by non-admin users who entered their own key in Settings)
//   2. No personal key + USE_PROXY=true → call goes through /api/gemini
//      (used by the admin whose key lives in a server-side env var)
//   3. No personal key + no proxy → throws, caller shows "add your key" prompt
// ============================================================

const API_ROOT = 'https://generativelanguage.googleapis.com/v1beta/models';

import { USE_PROXY } from './runtime.js';

// ---- Single network entry point -----------------------------------------
// Priority 1: personal key → direct Gemini call (key never goes to our server)
// Priority 2: no personal key + proxy enabled → /api/gemini (server injects key)
// Priority 3: neither → throw so the caller can surface the "add key" prompt
function callGemini({ apiKey, model, stream, body, signal }) {
  // Personal key takes priority — it is always used directly regardless of
  // whether the proxy is also configured.  This lets non-admin users bring
  // their own key while the proxy remains available for the admin (who has no
  // personal key set in the UI).
  if (apiKey) {
    const method = stream ? 'streamGenerateContent' : 'generateContent';
    const qs = stream
      ? `?alt=sse&key=${encodeURIComponent(apiKey)}`
      : `?key=${encodeURIComponent(apiKey)}`;
    return fetch(`${API_ROOT}/${model}:${method}${qs}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  }

  // No personal key — route through the server proxy so the admin's
  // GEMINI_API_KEY (stored in Vercel env vars) is injected server-side.
  if (USE_PROXY) {
    return fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, action: stream ? 'stream' : 'generate', body }),
      signal,
    });
  }

  throw new Error(
    'No Gemini API key configured. ' +
    'Please add your key in Profile → AI Settings.'
  );
}

export const MODELS = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (recommended)' },
  { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite (fast/cheap)' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (deepest reasoning)' },
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (legacy)' },
];

export const DEFAULT_MODEL = 'gemini-2.5-flash';

export const THINKING_BUDGETS = { brief: 1024, standard: 4096, comprehensive: 8192 };
export const OUTPUT_TOKENS = { brief: 2048, standard: 8192, comprehensive: 32768 };

const PRICING = {
  'gemini-2.5-flash': { in: 0.3, out: 2.5 },
  'gemini-2.5-flash-lite': { in: 0.1, out: 0.4 },
  'gemini-2.5-pro': { in: 1.25, out: 10.0 },
  'gemini-2.0-flash': { in: 0.1, out: 0.4 },
};

const SAFETY = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
];

export function estimateCost(model, usage) {
  const p = PRICING[model] || PRICING['gemini-2.5-flash'];
  const inTok = usage?.promptTokenCount || 0;
  const outTok = (usage?.candidatesTokenCount || 0) + (usage?.thoughtsTokenCount || 0);
  return (inTok * p.in + outTok * p.out) / 1_000_000;
}

function buildBody({ systemInstruction, contents, level, mode }) {
  const body = {
    contents,
    safetySettings: SAFETY,
    generationConfig: {
      temperature: 0.65,
      topP: 0.95,
      maxOutputTokens: OUTPUT_TOKENS[mode] || OUTPUT_TOKENS.standard,
    },
  };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }
  if (level.search) {
    body.tools = [{ google_search: {} }];
  }
  if (level.thinking) {
    body.generationConfig.thinkingConfig = {
      thinkingBudget: THINKING_BUDGETS[mode] || THINKING_BUDGETS.standard,
      includeThoughts: true,
    };
  }
  return body;
}

function buildLevels(webGrounding, thinking) {
  const levels = [];
  if (webGrounding) {
    if (thinking) levels.push({ thinking: true, search: true });
    levels.push({ thinking: false, search: true });
    levels.push({ thinking: false, search: false });
  } else {
    if (thinking) levels.push({ thinking: true, search: false });
    levels.push({ thinking: false, search: false });
  }
  return levels;
}

function extractSources(groundingMetadata, into) {
  if (!groundingMetadata) return;
  const chunks = groundingMetadata.groundingChunks || [];
  chunks.forEach((c) => {
    const w = c.web || c.retrievedContext;
    if (w && w.uri && !into.seen.has(w.uri)) {
      into.seen.add(w.uri);
      into.sources.push({ title: w.title || w.uri, uri: w.uri });
    }
  });
  (groundingMetadata.webSearchQueries || []).forEach((q) => {
    if (!into.queries.includes(q)) into.queries.push(q);
  });
}

function mergeChunk(chunk, acc, handlers) {
  const cand = chunk.candidates && chunk.candidates[0];
  if (cand && cand.content && cand.content.parts) {
    cand.content.parts.forEach((part) => {
      if (typeof part.text !== 'string') return;
      if (part.thought) {
        acc.thoughts += part.text;
        handlers.onThought && handlers.onThought(part.text, acc.thoughts);
      } else {
        acc.text += part.text;
        handlers.onText && handlers.onText(part.text, acc.text);
      }
    });
  }
  if (cand && cand.groundingMetadata) {
    extractSources(cand.groundingMetadata, acc.grounding);
  }
  if (chunk.usageMetadata) acc.usage = chunk.usageMetadata;
}

async function readErr(res) {
  try {
    const j = await res.json();
    const msg = typeof j?.error === 'string' ? j.error : j?.error?.message;
    return msg || `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

// ------------------------------------------------------------
// Streaming generation with graceful fallback.
// ------------------------------------------------------------
export async function streamGenerate({
  apiKey,
  model = DEFAULT_MODEL,
  systemInstruction,
  userText,
  parts,
  messages,
  mode = 'standard',
  webGrounding = false,
  thinking = true,
  signal,
  onThought,
  onText,
  onLevel,
}) {
  if (!apiKey && !USE_PROXY) {
    throw new Error('Add your Gemini API key in Profile → AI Settings first.');
  }
  const contentParts = parts || [{ text: userText || '' }];
  const contents = Array.isArray(messages) && messages.length
    ? messages.map((m) => ({ role: m.role === 'model' ? 'model' : 'user', parts: [{ text: m.text }] }))
    : [{ role: 'user', parts: contentParts }];
  const levels = buildLevels(webGrounding, thinking);

  let lastErr = '';
  for (let i = 0; i < levels.length; i += 1) {
    const level = levels[i];
    onLevel && onLevel(level, i);
    const body = buildBody({ systemInstruction, contents, level, mode });
    let res;
    try {
      res = await callGemini({ apiKey, model, stream: true, body, signal });
    } catch (e) {
      if (e.name === 'AbortError') throw e;
      lastErr = e.message;
      continue;
    }
    if (!res.ok || !res.body) {
      lastErr = await readErr(res);
      if (res.status === 429) break;
      continue;
    }

    const acc = {
      text: '',
      thoughts: '',
      usage: null,
      grounding: { sources: [], queries: [], seen: new Set() },
    };
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n');
      buffer = events.pop() || '';
      for (const line of events) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const json = trimmed.slice(5).trim();
        if (!json || json === '[DONE]') continue;
        try {
          mergeChunk(JSON.parse(json), acc, { onThought, onText });
        } catch {
          /* partial json — ignore */
        }
      }
    }
    return {
      text: acc.text.trim(),
      thoughts: acc.thoughts.trim(),
      sources: acc.grounding.sources,
      queries: acc.grounding.queries,
      usage: acc.usage,
      model,
      grounded: level.search && acc.grounding.sources.length > 0,
      searchAttempted: level.search,
      thoughtful: level.thinking,
    };
  }
  throw new Error(lastErr || 'The AI request failed.');
}

// ------------------------------------------------------------
// Non-streaming generation
// ------------------------------------------------------------
export async function generate({
  apiKey,
  model = DEFAULT_MODEL,
  systemInstruction,
  userText,
  parts,
  mode = 'standard',
  webGrounding = false,
  thinking = false,
  signal,
}) {
  if (!apiKey && !USE_PROXY) {
    throw new Error('Add your Gemini API key in Profile → AI Settings first.');
  }
  const contentParts = parts || [{ text: userText || '' }];
  const contents = [{ role: 'user', parts: contentParts }];
  const levels = buildLevels(webGrounding, thinking);

  let lastErr = '';
  for (let i = 0; i < levels.length; i += 1) {
    const level = levels[i];
    const body = buildBody({ systemInstruction, contents, level, mode });
    let res;
    try {
      res = await callGemini({ apiKey, model, stream: false, body, signal });
    } catch (e) {
      if (e.name === 'AbortError') throw e;
      lastErr = e.message;
      continue;
    }
    if (!res.ok) {
      lastErr = await readErr(res);
      if (res.status === 429) break;
      continue;
    }
    const data = await res.json();
    const acc = {
      text: '',
      thoughts: '',
      usage: data.usageMetadata || null,
      grounding: { sources: [], queries: [], seen: new Set() },
    };
    const cand = data.candidates && data.candidates[0];
    if (cand?.content?.parts) {
      cand.content.parts.forEach((part) => {
        if (typeof part.text !== 'string') return;
        if (part.thought) acc.thoughts += part.text;
        else acc.text += part.text;
      });
    }
    if (cand?.groundingMetadata) extractSources(cand.groundingMetadata, acc.grounding);
    return {
      text: acc.text.trim(),
      thoughts: acc.thoughts.trim(),
      sources: acc.grounding.sources,
      queries: acc.grounding.queries,
      usage: acc.usage,
      model,
      grounded: level.search && acc.grounding.sources.length > 0,
    };
  }
  throw new Error(lastErr || 'The AI request failed.');
}

// ------------------------------------------------------------
// Quality gate
// ------------------------------------------------------------
export async function isWeakAnswer({ apiKey, model, question, answer, signal }) {
  try {
    const r = await generate({
      apiKey,
      model,
      mode: 'brief',
      thinking: false,
      signal,
      systemInstruction:
        'You are a strict senior Nigerian legal editor. Judge whether the draft ' +
        'answer is adequate: legally grounded, on-point, and free of obvious ' +
        'hallucinated authorities. Reply with exactly one word: PASS or WEAK.',
      userText: `QUESTION:\n${question}\n\nDRAFT ANSWER:\n${answer}\n\nVerdict (PASS/WEAK):`,
    });
    return /\bWEAK\b/i.test(r.text);
  } catch {
    return false;
  }
}
