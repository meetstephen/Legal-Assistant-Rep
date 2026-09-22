import { describe, it, expect } from 'vitest';
import { hasAiInput, hasSourceInput } from '../src/lexi/aiSubmission.js';

describe('AI submission readiness', () => {
  it('enables a typed or pasted request without guessing a jurisdiction', () => {
    expect(hasAiInput('  Ebonyi contract question  ')).toBe(true);
    expect(hasAiInput('\n\t')).toBe(false);
    expect(hasAiInput('', { name: 'brief.pdf' })).toBe(true);
  });
  it('does not submit while a document is processing or an answer is running', () => {
    expect(hasAiInput('research', null, true)).toBe(false);
    expect(hasAiInput('', { name: 'brief.pdf' }, true)).toBe(false);
  });
  it('requires both source documents and a question for source-grounded research', () => {
    expect(hasSourceInput('What does clause 7 say?', [{ name: 'contract.docx' }])).toBe(true);
    expect(hasSourceInput('What does clause 7 say?', [])).toBe(false);
    expect(hasSourceInput(' ', [{ name: 'contract.docx' }])).toBe(false);
  });
});
