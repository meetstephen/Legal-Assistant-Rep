// ============================================================
// lexi/exports.js — TXT / HTML / PDF / DOC export with firm branding
//
// Mirrors lexi/exports.py. Firm name, lawyer details and footer are pulled
// from the profile and applied automatically. PDF export uses the browser's
// native print-to-PDF (dependency-free, print-ready). DOC export emits a
// Word-compatible HTML document.
// ============================================================

import { DISCLAIMER, BRAND_LABEL } from './runtime.js';
import { escapeHtml, downloadBlob } from './utils.js';
import { exportBlocks, inlineRuns, exportBodyHtml } from './exportBlocks.js';

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

export function htmlDocument(content, { profile = {}, title = 'Legal Document' } = {}) {
  const h = header(profile, title);
  const footer = profile.letterheadFooter || '';
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)} — ${escapeHtml(h.firm)}</title>
<style>
  @page { size: auto; margin: 25mm; }
  body { font-family: 'Times New Roman', Georgia, serif; font-size: 12pt; line-height: 1.5; color: #111; max-width: 720px; margin: 32px auto; padding: 0 24px; overflow-wrap: anywhere; }
  .lh { padding-bottom: 12px; margin-bottom: 8px; }
  .firm { font-size: 18pt; font-weight: 700; color: #111; }
  .meta { color: #475569; font-size: 13px; }
  h1,h2,h3 { color: #0f172a; }
  .content { margin: 24px 0; }
  .content a { color: #059669; }
  h1,h2,h3 { break-after: avoid; }
  p,li { orphans: 3; widows: 3; }
  table { border-collapse: collapse; width: 100%; table-layout: fixed; margin: 12pt 0; }
  th,td { border: 1px solid #d9d9d9; padding: 6pt; vertical-align: top; overflow-wrap: anywhere; }
  thead { display: table-header-group; } tr { break-inside: avoid; } ul { margin: 6pt 0; }
  .disclaimer { margin-top: 28px; font-size: 10pt; color: #444; }
  .footer { margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px; color: #64748b; font-size: 12px; }
  @media print { body { margin: 0; padding: 0; max-width: none; } a { color: inherit; } }
</style></head>
<body>
  <div class="lh">
    <div class="firm">${escapeHtml(h.firm)}</div>
    <div class="meta">${escapeHtml(h.lawyer.trim())}</div>
    <div class="meta">${escapeHtml(h.contact)}</div>
  </div>
  <div class="meta">${escapeHtml(title)} · Generated ${new Date().toLocaleString()}</div>
  <div class="content lexi-prose">${exportBodyHtml(content)}</div>
  <div class="disclaimer"><strong>⚖️ Disclaimer:</strong> ${escapeHtml(DISCLAIMER)}</div>
  <div class="footer">
    ${footer ? `${escapeHtml(footer)}<br/>` : ''}
    Produced with ${escapeHtml(BRAND_LABEL)}.
  </div>
</body></html>`;
}

export function exportHtml(content, opts = {}) {
  const html = htmlDocument(content, opts);
  downloadBlob(html, `${sanitizeFilename(opts.filename || opts.title || 'document')}.html`, 'text/html;charset=utf-8');
}

// Genuine Office Open XML document; heavy generation code is lazy-loaded.
export async function createDocxBlob(content, opts = {}) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } = await import('docx');
  const h = header(opts.profile, opts.title);
  const paragraph = (text, extra = {}) => new Paragraph({ children: inlineRuns(text).map(run => new TextRun(run)), spacing: { after: 120 }, ...extra });
  const border = { style: BorderStyle.SINGLE, size: 4, color: 'D9D9D9' };
  const blocks = exportBlocks(content).map(block => {
    if (block.type === 'table') return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border }, rows: block.rows.map((row, i) => new TableRow({ tableHeader: i === 0, children: row.map(cell => new TableCell({ margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [paragraph(cell)] })) })) });
    if (block.type === 'heading') return paragraph(block.text, { heading: block.level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2, keepNext: true });
    if (block.type === 'bullet') return paragraph(block.text, { bullet: { level: 0 } });
    return paragraph(block.text);
  });
  const document = new Document({
    styles: { default: { document: { run: { font: 'Times New Roman', size: 24, color: '000000' }, paragraph: { spacing: { line: 360 } } } }, paragraphStyles: ['Title', 'Heading1', 'Heading2'].map(id => ({ id, name: id, basedOn: 'Normal', run: { font: 'Times New Roman', color: '000000', bold: true, size: id === 'Title' ? 32 : 28 }, paragraph: { keepNext: true, spacing: { before: 180, after: 120 } } })) },
    sections: [{ properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } }, children: [
      paragraph(h.firm, { heading: HeadingLevel.TITLE }), paragraph(h.lawyer.trim()), paragraph(h.contact),
      paragraph(h.title, { heading: HeadingLevel.HEADING_1, keepNext: true }), ...blocks,
      paragraph(`Disclaimer: ${DISCLAIMER}`), paragraph(opts.profile?.letterheadFooter || ''), paragraph(`Produced with ${BRAND_LABEL}.`),
    ] }],
  });
  return Packer.toBlob(document);
}
export async function exportDoc(content, opts = {}) {
  const blob = await createDocxBlob(content, opts);
  downloadBlob(blob, `${sanitizeFilename(opts.filename || opts.title || 'document')}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
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
