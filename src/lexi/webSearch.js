// ============================================================
// lexi/webSearch.js — live online research + one-click citation verifier
//
// Mirrors lexi/web_search.py. Everything here forces live web grounding ON
// (it does not depend on the app-wide sidebar switch) so results are sourced
// from the real, current web with clickable source links.
// ============================================================

import { generate } from './ai.js';

// ------------------------------------------------------------
// Live case-law / precedent search.
// ------------------------------------------------------------
export async function searchCaseLaw({ apiKey, model, query, signal }) {
  const system =
    'You are a Nigerian legal research assistant searching the live web. Find ' +
    'real, current Nigerian authorities relevant to the query. For each result ' +
    'give: case name, citation (if found), court, year, the holding/relevance, ' +
    'and which source you used. NEVER invent a case or a citation — if you ' +
    'cannot confirm one, say so. RELEVANCE GATE: only include a case that is ' +
    'genuinely on-point for the issue raised — a single incidental shared word ' +
    'is NOT enough; silently ignore any candidate that is off-topic. Prefer Law ' +
    'Pavilion, NWLR, official court and reputable legal sources.';
  const r = await generate({
    apiKey,
    model,
    mode: 'standard',
    webGrounding: true,
    thinking: false,
    signal,
    systemInstruction: system,
    userText: `Find relevant Nigerian cases and authorities for:\n\n${query}`,
  });
  return r; // { text, sources, queries, usage, grounded }
}

// ------------------------------------------------------------
// Verify specific cited cases on the live web.
// Returns parsed verdicts: REAL / NOT FOUND / UNCERTAIN with a source link.
// ------------------------------------------------------------
export async function verifyCitations({ apiKey, model, cases, signal }) {
  const list = cases
    .map((c, i) => `${i + 1}. ${c.name}${c.citation ? ` ${c.citation}` : ''}`)
    .join('\n');

  const system =
    'You verify whether Nigerian case citations are REAL by SEARCHING THE LIVE WEB. ' +
    'Critical rules:\n' +
    '• Citation format/plausibility is NEVER enough. Mark a case REAL only if your ' +
    'live search ACTUALLY returned a confirming source, and you MUST give that ' +
    'source URL.\n' +
    '• If your search returned no confirming source — even if the citation looks ' +
    'plausible or you "remember" the case — you MUST return NOT FOUND or UNCERTAIN ' +
    '(never REAL) and put "-" for the URL.\n' +
    '• Do not invent URLs or citations.\n' +
    'For EACH numbered case reply on its own line in EXACTLY this format:\n' +
    '<number>. <VERDICT> | <case name> | <best citation found or "-"> | <source URL or "-"> | <one-line note>\n' +
    'VERDICT must be one of: REAL, NOT FOUND, UNCERTAIN. After the lines, stop.';

  const r = await generate({
    apiKey,
    model,
    mode: 'standard',
    webGrounding: true,
    thinking: false,
    signal,
    systemInstruction: system,
    userText: `Verify these cases:\n${list}`,
  });

  const verdicts = parseVerdicts(r.text, cases);
  return { verdicts, sources: r.sources, raw: r.text, usage: r.usage };
}

function parseVerdicts(text, cases) {
  const lines = text.split('\n').filter((l) => /\|/.test(l));
  const out = [];
  lines.forEach((line) => {
    const cells = line.replace(/^\s*\d+\.\s*/, '').split('|').map((s) => s.trim());
    if (cells.length < 2) return;
    const [verdictRaw, name, citation, url, note] = cells;
    const v = (verdictRaw || '').toUpperCase();
    let verdict = 'UNCERTAIN';
    if (v.includes('REAL')) verdict = 'REAL';
    else if (v.includes('NOT')) verdict = 'NOT FOUND';
    out.push({
      name: name || '',
      verdict,
      citation: citation && citation !== '-' ? citation : '',
      url: url && /^https?:\/\//.test(url) ? url : '',
      note: note || '',
    });
  });
  // Fall back to one row per requested case if parsing failed.
  if (!out.length) {
    return cases.map((c) => ({
      name: c.name,
      verdict: 'UNCERTAIN',
      citation: c.citation || '',
      url: '',
      note: 'Could not parse a verdict — open the live sources to confirm.',
    }));
  }
  return out;
}

// ------------------------------------------------------------
// Quick Precedent Finder — fast, always-live search returning a compact,
// structured list of on-point Nigerian authorities (name · citation · court ·
// relevance · source link). Distinct from the deeper Research memo.
// ------------------------------------------------------------
export async function findPrecedents({ apiKey, model, query, signal }) {
  const system =
    'You are a Nigerian precedent finder searching the live web. Return up to 6 ' +
    'of the most on-point, REAL Nigerian authorities for the issue. RELEVANCE ' +
    'GATE: include a case ONLY if it is genuinely on-point — a single incidental ' +
    'shared word is NOT enough; silently ignore any candidate that is not truly ' +
    'on-point. Output ONLY one line per case in EXACTLY this pipe format and ' +
    'nothing else:\n' +
    '<case name> | <citation or "-"> | <court> | <one-line why it is on point> | <source URL or "-">\n' +
    'Never invent a case, citation or URL. If you cannot confirm a citation use ' +
    '"-". If you find nothing solid, return a single line: NONE | - | - | no ' +
    'reliable authority found | -';
  const r = await generate({
    apiKey,
    model,
    mode: 'standard',
    webGrounding: true,
    thinking: false,
    signal,
    systemInstruction: system,
    userText: `Find the leading Nigerian precedents on:\n\n${query}`,
  });
  return { items: parsePrecedents(r.text), sources: r.sources, raw: r.text, usage: r.usage, grounded: r.grounded };
}

// Exported for testing. Parses the pipe-delimited precedent list.
export function parsePrecedents(text = '') {
  const lines = text.split('\n').filter((l) => l.includes('|'));
  const out = [];
  lines.forEach((line) => {
    const cells = line.replace(/^\s*\d+[.)]\s*/, '').split('|').map((s) => s.trim());
    if (cells.length < 2) return;
    const [name, citation, court, relevance, url] = cells;
    if (!name || /^NONE$/i.test(name)) return;
    out.push({
      name,
      citation: citation && citation !== '-' ? citation : '',
      court: court && court !== '-' ? court : '',
      relevance: relevance && relevance !== '-' ? relevance : '',
      url: url && /^https?:\/\//.test(url) ? url : '',
    });
  });
  return out;
}

// ------------------------------------------------------------
// Practice Updates — always-live Nigerian legal news / developments.
// ------------------------------------------------------------
export async function fetchPracticeUpdates({ apiKey, model, topic, signal }) {
  const system =
    'You are a Nigerian legal current-awareness service searching the live web. ' +
    'Return the most recent, real developments (new legislation, notable ' +
    'judgments, regulatory/practice-direction changes, NBA news). For EACH item ' +
    'use this format and nothing else:\n' +
    '### <headline>\n' +
    'Date: <date or approx>\n' +
    'Summary: <2-3 plain-English sentences>\n' +
    'Practice impact: <why a lawyer should care>\n' +
    'Source: <real URL>\n\n' +
    'Only include items you can actually find with a real source link. If you ' +
    'find nothing solid, say so plainly rather than inventing news.';
  const r = await generate({
    apiKey,
    model,
    mode: 'standard',
    webGrounding: true,
    thinking: false,
    signal,
    systemInstruction: system,
    userText: topic
      ? `Recent Nigerian legal developments about: ${topic}`
      : 'Latest general Nigerian legal developments in the last few months.',
  });
  return r;
}
