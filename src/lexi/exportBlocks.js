import { escapeHtml } from './utils.js';

// A deliberately small Markdown subset. Unknown syntax is preserved as text.
export function exportBlocks(content) {
  const lines = String(content || '').replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  const cells = line => line.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map(cell => cell.trim().replace(/\\\|/g, '|'));
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    if (line.includes('|') && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1] || '') && cells(lines[i + 1]).every(cell => /^:?-{3,}:?$/.test(cell))) {
      const rows = [cells(line)]; i++;
      while (lines[i + 1]?.includes('|') && lines[i + 1].trim()) rows.push(cells(lines[++i]));
      blocks.push({ type: 'table', rows }); continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    const bullet = line.match(/^\s*[-*+]\s+(.+)$/);
    const numbered = line.match(/^\s*(\d+)[.)]\s+(.+)$/);
    if (heading) blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] });
    else if (bullet) blocks.push({ type: 'bullet', text: bullet[1] });
    else if (numbered) blocks.push({ type: 'paragraph', text: `${numbered[1]}. ${numbered[2]}` });
    else blocks.push({ type: 'paragraph', text: line });
  }
  return blocks;
}

export function inlineRuns(text) {
  return String(text).split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean).map(part =>
    part.startsWith('**') && part.endsWith('**') ? { text: part.slice(2, -2), bold: true } :
      part.startsWith('*') && part.endsWith('*') ? { text: part.slice(1, -1), italics: true } : { text: part });
}
export function exportBodyHtml(content) {
  const inline = text => inlineRuns(text).map(run => run.bold ? `<strong>${escapeHtml(run.text)}</strong>` : run.italics ? `<em>${escapeHtml(run.text)}</em>` : escapeHtml(run.text)).join('');
  return exportBlocks(content).map(block => {
    if (block.type === 'table') return `<table><thead><tr>${block.rows[0].map(cell => `<th>${inline(cell)}</th>`).join('')}</tr></thead><tbody>${block.rows.slice(1).map(row => `<tr>${row.map(cell => `<td>${inline(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    if (block.type === 'heading') return `<h${Math.min(block.level, 3)}>${inline(block.text)}</h${Math.min(block.level, 3)}>`;
    if (block.type === 'bullet') return `<ul><li>${inline(block.text)}</li></ul>`;
    return `<p>${inline(block.text)}</p>`;
  }).join('\n');
}
