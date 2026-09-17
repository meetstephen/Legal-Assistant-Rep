export function libraryItems({ analyses = [], templates = [] } = {}) {
  return [
    ...analyses.map(item => ({ ...item, libraryId: `analysis:${item.id}`, kind: 'analysis', title: item.title || 'Saved analysis', content: item.content || '' })),
    ...templates.map(item => ({ ...item, libraryId: `template:${item.id}`, kind: 'template', title: item.name || 'Document template', content: item.content || '' })),
  ];
}
export function filterLibrary(items, { query = '', kind = 'all', caseId = 'all', sort = 'newest' } = {}) {
  const term = query.trim().toLowerCase();
  return items.filter(item => (kind === 'all' || item.kind === kind) &&
    (caseId === 'all' || (caseId === 'unfiled' ? !item.caseId : item.caseId === caseId)) &&
    (!term || [item.title, item.content, item.category].some(value => String(value || '').toLowerCase().includes(term))))
    .sort((a, b) => sort === 'title' ? a.title.localeCompare(b.title)
      : (Date.parse(b.createdAt || '') || 0) - (Date.parse(a.createdAt || '') || 0));
}
