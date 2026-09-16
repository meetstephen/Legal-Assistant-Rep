// ============================================================
// lexi/docParse.js — client-side document extraction
//
// Extracts text from uploaded files entirely in the browser (nothing is
// uploaded to a server). Heavy parsers (pdf.js, mammoth) are lazy-loaded so
// they do not bloat the initial bundle. PDF extraction is limited to 60 pages;
// both page and context limits are disclosed before analysis.
// ============================================================

import { sanitizeDocContext } from './crypto.js';

const MAX_PDF_PAGES = 60;
export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024; // 25 MiB

async function parsePdf(file) {
  const pdfjs = await import('pdfjs-dist');
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjs.getDocument({ data, isEvalSupported: false });
  try {
  const pdf = await loadingTask.promise;
  const pageCount = Math.min(pdf.numPages, MAX_PDF_PAGES);
  const chunks = [];
  for (let i = 1; i <= pageCount; i += 1) {
     
    const page = await pdf.getPage(i);
     
    try {
      const content = await page.getTextContent();
      const pageText = content.items.map((it) => it.str).join(' ').trim();
      if (pageText) chunks.push(`[PDF page ${i}]\n${pageText}`);
    } finally {
      page.cleanup();
    }
  }
  let text = chunks.join('\n\n');
  if (chunks.length && pdf.numPages > MAX_PDF_PAGES) {
    text = `[Extraction limit: document has ${pdf.numPages} pages; only the first ${MAX_PDF_PAGES} were extracted. Do not claim to have reviewed the remaining pages.]\n\n${text}`;
  }
  return { text, pages: pdf.numPages, extractedPages: pageCount, truncated: pdf.numPages > pageCount };
  } finally {
    await loadingTask.destroy();
  }
}

async function parseDocx(file) {
  const mammoth = (await import('mammoth')).default;
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value || '';
}

function stripRtf(rtf) {
  return rtf
    .replace(/\\par[d]?/g, '\n')
    .replace(/\{\\[^}]*\}/g, '')
    .replace(/\\[a-z]+-?\d* ?/gi, '')
    .replace(/[{}]/g, '')
    .trim();
}

export function validateDocumentFile(file) {
  if (!file || !Number.isFinite(file.size) || file.size < 0) throw new Error('Choose a valid document first.');
  if (file.size > MAX_DOCUMENT_BYTES) {
    throw new Error('This document is too large. Please upload a file smaller than 25 MB.');
  }
}

// Returns { name, type, pages, raw, sanitized, flags, truncated }
export async function extractDocument(file) {
  validateDocumentFile(file);
  const name = file.name || 'document';
  const lower = name.toLowerCase();
  let raw = '';
  let pdfInfo = null;
  const mime = typeof file.type === 'string' ? file.type : '';

  if (lower.endsWith('.pdf') || file.type === 'application/pdf') {
    pdfInfo = await parsePdf(file);
    raw = pdfInfo.text;
  } else if (lower.endsWith('.docx')) {
    raw = await parseDocx(file);
  } else if (lower.endsWith('.rtf')) {
    raw = stripRtf(await file.text());
  } else if (lower.endsWith('.json')) {
    const txt = await file.text();
    try {
      raw = JSON.stringify(JSON.parse(txt), null, 2);
    } catch {
      raw = txt;
    }
  } else if (
    lower.endsWith('.txt') ||
    lower.endsWith('.csv') ||
    lower.endsWith('.md') ||
    mime.startsWith('text/')
  ) {
    raw = await file.text();
  } else if (lower.endsWith('.doc')) {
    // Legacy binary .doc is not reliably parseable in-browser.
    throw new Error(
      'Legacy .doc files cannot be read in the browser. Please save as .docx, PDF, or paste the text.'
    );
  } else {
    throw new Error('Unsupported document format. Please use PDF, DOCX, RTF, TXT, CSV, JSON or Markdown.');
  }

  if (!raw || !raw.trim()) {
    throw new Error('No readable text was found in this file.');
  }

  const { text, flags, truncated } = sanitizeDocContext(raw);
  return {
    name,
    chars: text.length,
    raw,
    sanitized: text,
    flags,
    pages: pdfInfo?.pages ?? null,
    extractedPages: pdfInfo?.extractedPages ?? null,
    truncated: truncated || Boolean(pdfInfo?.truncated),
  };
}

export const ACCEPTED_DOC_TYPES =
  '.pdf,.docx,.txt,.rtf,.csv,.json,.md,application/pdf,text/plain';

