import { describe, it, expect } from 'vitest';
import App from '../src/App.jsx';
import { parseConfidence, buildSystemPrompt } from '../src/lexi/prompts.js';
import { TASK_TYPES, RESPONSE_MODES, DOC_ACTIONS } from '../src/lexi/promptData/index.js';
import { NAV_SECTIONS, ALL_PAGE_IDS } from '../src/lexi/nav.js';
import { streamGenerate } from '../src/lexi/ai.js';

describe('app wiring', () => {
  it('exports a renderable App component (whole import graph resolves)', () => {
    expect(typeof App).toBe('function');
  });

  it('has 8 task types, 3 modes and 4 document actions (README parity)', () => {
    expect(TASK_TYPES).toHaveLength(8);
    expect(RESPONSE_MODES).toHaveLength(3);
    expect(DOC_ACTIONS).toHaveLength(4);
  });

  it('exposes the new multi-turn Chat route in navigation', () => {
    expect(ALL_PAGE_IDS).toContain('chat');
    const practice = NAV_SECTIONS.find((s) => s.title.includes('Practice'));
    expect(practice.items.some((i) => i.id === 'chat')).toBe(true);
    expect(typeof streamGenerate).toBe('function');
  });
});

describe('prompt builder', () => {
  it('includes jurisdiction, task, mode and confidence rubric', () => {
    const sys = buildSystemPrompt({ taskId: 'analysis', modeId: 'comprehensive', query: 'fair hearing', webGrounding: true });
    expect(sys).toMatch(/Nigeria/);
    expect(sys).toMatch(/CONFIDENCE/);
    expect(sys).toMatch(/Live web grounding is ON/);
  });

  it('parses the confidence block out of an answer', () => {
    const answer = 'Main answer.\n[[CONFIDENCE]]\nStatutory Grounding: 80\nCase Law Support: 60\nProcedural Certainty: 70\nPosition-taking: 50\n[[/CONFIDENCE]]';
    const { scores, cleanText } = parseConfidence(answer);
    expect(scores.statutory).toBe(80);
    expect(cleanText).not.toMatch(/CONFIDENCE/);
  });
});
