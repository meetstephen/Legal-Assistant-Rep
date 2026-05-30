// ============================================================
// lexi/utils.js — generic helpers (formatting, ids, markdown, downloads)
// ============================================================

export const cn = (...classes) => classes.filter(Boolean).join(' ');

export const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

export const formatCurrency = (amount, currency = '₦') => {
  const n = Number(amount) || 0;
  return `${currency}${n.toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
};

export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return String(date);
  return d.toLocaleString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const daysUntil = (date) => {
  const target = new Date(date);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

export const formatRelativeDate = (date) => {
  const diff = daysUntil(date);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 0 && diff <= 14) return `In ${diff} days`;
  if (diff < 0 && diff >= -14) return `${Math.abs(diff)} days ago`;
  return formatDate(date);
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

// Lightweight markdown -> HTML for rendering AI output safely.
// Escapes HTML first, then applies a small, safe subset of markdown.
export const escapeHtml = (str = '') =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const renderMarkdown = (text = '') => {
  let html = escapeHtml(text);
  // Links: [label](url) -> only http/https
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  // Bare urls
  html = html.replace(
    /(^|[\s(])(https?:\/\/[^\s)<]+)/g,
    '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>'
  );
  // Headings
  html = html.replace(/^######\s?(.*)$/gm, '<h3>$1</h3>');
  html = html.replace(/^#####\s?(.*)$/gm, '<h3>$1</h3>');
  html = html.replace(/^####\s?(.*)$/gm, '<h3>$1</h3>');
  html = html.replace(/^###\s?(.*)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s?(.*)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s?(.*)$/gm, '<h1>$1</h1>');
  // Bold / italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Newlines
  html = html.replace(/\n/g, '<br/>');
  return html;
};

export const truncate = (str = '', n = 120) =>
  str.length > n ? `${str.slice(0, n)}…` : str;

export const downloadBlob = (content, filename, mime) => {
  const blob =
    content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
