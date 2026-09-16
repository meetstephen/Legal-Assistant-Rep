import { describe, it, expect, vi, afterEach } from 'vitest';
import { createAiRunLifecycle } from '../src/lexi/aiRunLifecycle.js';
import { registerFailure } from '../src/lexi/auth.js';
import { extractDocument, validateDocumentFile } from '../src/lexi/docParse.js';

const pdfMocks = vi.hoisted(() => ({ getDocument: vi.fn() }));
vi.mock('pdfjs-dist', () => ({ GlobalWorkerOptions: {}, getDocument: pdfMocks.getDocument }));
vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({ default: 'worker-url' }));
afterEach(() => vi.restoreAllMocks());

describe('AI request ownership', () => {
  it('aborts and invalidates the old request when a new one starts', () => {
    const lifecycle = createAiRunLifecycle();
    const old = lifecycle.start();
    const current = lifecycle.start();
    expect(old.controller.signal.aborted).toBe(true);
    expect(old.isCurrent()).toBe(false);
    old.finish();
    expect(current.isCurrent()).toBe(true);
    lifecycle.cancel();
    expect(current.controller.signal.aborted).toBe(true);
  });
  it('invalidates callbacks after reset, stop or unmount cancellation', () => {
    const lifecycle = createAiRunLifecycle();
    const request = lifecycle.start();
    lifecycle.cancel();
    expect(request.isCurrent()).toBe(false);
    lifecycle.cancel();
  });
  it('releases completed requests without invalidating the next request', () => {
    const lifecycle = createAiRunLifecycle();
    const request = lifecycle.start();
    request.finish();
    expect(request.isCurrent()).toBe(false);
    expect(lifecycle.start().isCurrent()).toBe(true);
  });
});

describe('expired passcode lockouts', () => {
  it('allows a fresh five-attempt window after expiry', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000000);
    const state = registerFailure({ attempts: 5, lockedUntil: 999999 });
    expect(state.attempts).toBe(1);
    expect(state.lockedUntil).toBe(0);
  });
  it('does not extend an active lockout', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000000);
    const state = { attempts: 5, lockedUntil: 1100000 };
    expect(registerFailure(state)).toBe(state);
  });
});

describe('document extraction', () => {
  it.each([NaN, Infinity, -1])('rejects invalid file size %s', (size) => {
    expect(() => validateDocumentFile({ size })).toThrow(/valid document/);
  });
  it('accepts a text extension without MIME metadata', async () => {
    const result = await extractDocument({ name: 'brief.txt', size: 5, text: async () => 'Brief text' });
    expect(result.raw).toBe('Brief text');
  });
  it('rejects unsupported binary documents instead of interpreting them as text', async () => {
    await expect(extractDocument({ name: 'scan.png', size: 5, text: vi.fn() })).rejects.toThrow(/Unsupported/);
  });
  it('reports the PDF page limit and releases pages and the worker', async () => {
    const cleanup = vi.fn();
    const destroy = vi.fn();
    pdfMocks.getDocument.mockReturnValue({ promise: Promise.resolve({ numPages: 61,
      getPage: async () => ({ getTextContent: async () => ({ items: [{ str: 'Court text' }] }), cleanup }),
    }), destroy });
    const result = await extractDocument({ name: 'rules.pdf', size: 5, arrayBuffer: async () => new ArrayBuffer(0) });
    expect(result.pages).toBe(61);
    expect(result.extractedPages).toBe(60);
    expect(result.truncated).toBe(true);
    expect(result.raw).toContain('[PDF page 1]');
    expect(cleanup).toHaveBeenCalledTimes(60);
    expect(destroy).toHaveBeenCalledOnce();
    expect(pdfMocks.getDocument.mock.calls[0][0].isEvalSupported).toBe(false);
  });
  it('releases resources even when extraction fails', async () => {
    const cleanup = vi.fn();
    const destroy = vi.fn();
    pdfMocks.getDocument.mockReturnValue({ promise: Promise.resolve({ numPages: 1,
      getPage: async () => ({ getTextContent: async () => { throw new Error('Broken PDF'); }, cleanup }),
    }), destroy });
    await expect(extractDocument({ name: 'broken.pdf', size: 5, arrayBuffer: async () => new ArrayBuffer(0) })).rejects.toThrow('Broken PDF');
    expect(cleanup).toHaveBeenCalledOnce();
    expect(destroy).toHaveBeenCalledOnce();
  });
  it('does not mistake page labels for readable text in scanned PDFs', async () => {
    pdfMocks.getDocument.mockReturnValue({ promise: Promise.resolve({ numPages: 61,
      getPage: async () => ({ getTextContent: async () => ({ items: [] }), cleanup: vi.fn() }),
    }), destroy: vi.fn() });
    await expect(extractDocument({ name: 'scan.pdf', size: 5, arrayBuffer: async () => new ArrayBuffer(0) })).rejects.toThrow(/No readable text/);
  });
});

