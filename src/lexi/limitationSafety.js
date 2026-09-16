import { computeDeadline } from './helpers.js';
import { normalizeJurisdiction } from './jurisdictions.js';

// This is calendar arithmetic on counsel-confirmed inputs, not a law lookup.
export function calculateVerifiedDeadline({ startDate, period, jurisdiction, source, confirmed }) {
  if (!confirmed || !normalizeJurisdiction(jurisdiction) || !String(source || '').trim()) return null;
  if (!/^[1-9]\d{0,3}\s+(?:days?|weeks?|months?|years?)$/i.test(String(period || '').trim())) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(startDate || ''))) return null;
  const date = new Date(`${startDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== startDate) return null;
  return computeDeadline(startDate, period);
}

