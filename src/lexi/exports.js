// ============================================================
// lexi/exports.js — TXT / HTML / PDF / DOC export with firm branding
//
// Mirrors lexi/exports.py. Firm name, lawyer details and footer are pulled
// from the profile and applied automatically. PDF export uses the browser's
// native print-to-PDF (dependency-free, print-ready). DOC export emits a
// Word-compatible HTML document.
// ============================================================

import { DISCLAIMER, BRAND_LABEL } from './runtime.js';
import { escapeHtml, renderMarkdown, downloadBlob } from './utils.js';

function header(profile = {}, title = 'Legal Document') {
  const firm = profile.firmName || 'LexiAssist';
  const lawyer = profile.lawyerName ? `\n${profile.lawyerName}` : '';
  const contact = [profile.email, profile.phone, profile.address]
    .filter(Boolean)
    .join(' · ');
  return { firm, lawyer, contact, title };
}

function sanitizeFilename(s = 'lexiassist') {
  return s.replace(/[^a-z0-9-_]+/gi, '_').slice(0, 60);
}

export function exportTxt(content, { profile = {}, title = 'Legal Document', filename } = {}) {
  const h = header(profile, title);
  const body = [
    h.firm.toUpperCase(),
    h.lawyer.trim(),
    h.contact,
    '='.repeat(64),
    title,
    `Generated: ${new Date().toLocaleString()}`,
    '='.repeat(64),
    '',
    content,
    '',
    '-'.repeat(64),
    `DISCLAIMER: ${DISCLAIMER}`,
    '',
    `Produced with ${BRAND_LABEL}.`,
  ].join('\n');
  downloadBlob(body, `${sanitizeFilename(filename || title)}.txt`, 'text/plain;charset=utf-8');
}

function htmlDocument(content, { profile = {}, title = 'Legal Document' } = {}) {
  const h = header(profile, title);
  const footer = profile.letterheadFooter || '';
  const bank = profile.bankDetails || '';
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)} — ${escapeHtml(h.firm)}</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; line-height: 1.7; color: #1e293b; max-width: 820px; margin: 32px auto; padding: 0 24px; }
  .lh { border-bottom: 3px solid #059669; padding-bottom: 12px; margin-bottom: 8px; }
  .firm { font-size: 22px; font-weight: 700; color: #064e3b; letter-spacing: .3px; }
  .meta { color: #475569; font-size: 13px; }
  h1,h2,h3 { color: #0f172a; }
  .content { margin: 24px 0; }
  .content a { color: #059669; }
  .disclaimer { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px 16px; margin-top: 28px; font-size: 13px; color: #78350f; }
  .footer { margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px; color: #64748b; font-size: 12px; }
  @media print { body { margin: 0; } }
</style></head>
<body>
  <div class="lh">
    <div class="firm">${escapeHtml(h.firm)}</div>
    <div class="meta">${escapeHtml(h.lawyer.trim())}</div>
    <div class="meta">${escapeHtml(h.contact)}</div>
  </div>
  <div class="meta">${escapeHtml(title)} · Generated ${new Date().toLocaleString()}</div>
  <div class="content lexi-prose">${renderMarkdown(content)}</div>
  <div class="disclaimer"><strong>⚖️ Disclaimer:</strong> ${escapeHtml(DISCLAIMER)}</div>
  <div class="footer">
    ${footer ? `${escapeHtml(footer)}<br/>` : ''}
    ${bank ? `${escapeHtml(bank)}<br/>` : ''}
    Produced with ${escapeHtml(BRAND_LABEL)}.
  </div>
</body></html>`;
}

export function exportHtml(content, opts = {}) {
  const html = htmlDocument(content, opts);
  downloadBlob(html, `${sanitizeFilename(opts.filename || opts.title || 'document')}.html`, 'text/html;charset=utf-8');
}

// Word-compatible HTML saved with a .doc extension — opens cleanly in MS Word.
export function exportDoc(content, opts = {}) {
  const html = htmlDocument(content, opts);
  downloadBlob(
    html,
    `${sanitizeFilename(opts.filename || opts.title || 'document')}.doc`,
    'application/msword'
  );
}

// Print-to-PDF: opens a styled, print-ready window and triggers the browser's
// print dialog (user chooses "Save as PDF"). No external dependency required.
export function exportPdf(content, opts = {}) {
  const html = htmlDocument(content, opts);
  const win = window.open('', '_blank');
  if (!win) {
    // Popup blocked — fall back to an HTML download.
    exportHtml(content, opts);
    return false;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 400);
  return true;
}

export function copyToClipboard(text) {
  if (navigator.clipboard) return navigator.clipboard.writeText(text);
  return Promise.reject(new Error('Clipboard unavailable'));
}
