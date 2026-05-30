import { describe, it, expect } from 'vitest';
import { parsePrecedents } from '../src/lexi/webSearch.js';

describe('Quick Precedent Finder parser', () => {
  it('parses pipe-delimited precedent lines', () => {
    const text = [
      'Mojekwu v Mojekwu | (1997) 7 NWLR (Pt 512) 283 | Court of Appeal | repugnancy of discriminatory custom | https://example.com/a',
      '2. Ukeje v Ukeje | (2014) 11 NWLR (Pt 1418) 384 | Supreme Court | female inheritance under s.42 | https://example.com/b',
    ].join('\n');
    const items = parsePrecedents(text);
    expect(items).toHaveLength(2);
    expect(items[0].name).toBe('Mojekwu v Mojekwu');
    expect(items[0].court).toBe('Court of Appeal');
    expect(items[0].url).toMatch(/^https:\/\//);
    expect(items[1].citation).toMatch(/NWLR/);
  });

  it('treats "-" as empty and drops NONE rows', () => {
    const text = [
      'Some Case v Other | - | High Court | on point | -',
      'NONE | - | - | no reliable authority found | -',
    ].join('\n');
    const items = parsePrecedents(text);
    expect(items).toHaveLength(1);
    expect(items[0].citation).toBe('');
    expect(items[0].url).toBe('');
  });

  it('returns an empty array for prose without pipes', () => {
    expect(parsePrecedents('I could not find anything reliable.')).toEqual([]);
  });
});
