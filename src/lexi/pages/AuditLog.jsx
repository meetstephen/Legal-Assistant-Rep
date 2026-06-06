// ============================================================
// lexi/pages/AuditLog.jsx — hash-chained audit log viewer (admin only)
// ============================================================

import React, { useMemo, useState, useEffect } from 'react';
import { History, Download, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useApp } from '../AppContext.jsx';
import { AUDIT_EVENTS, verifyAuditChain, toCsv } from '../helpers.js';
import { Card, Select, EmptyState, PageHeader } from '../components/ui.jsx';
import { formatDateTime, downloadBlob, cn } from '../utils.js';

const COLOR = {
  emerald: 'text-emerald-500',
  red:     'text-red-500',
  slate:   'text-slate-400',
  blue:    'text-blue-500',
  violet:  'text-violet-500',
  cyan:    'text-cyan-500',
  amber:   'text-amber-500',
};

export function AuditLog() {
  const { auditLog, showToast, isAdmin, navigate } = useApp();

  // Hard guard — redirect any non-admin who somehow reaches this page.
  // isAdmin is computed from the authenticated user's email in AppContext
  // and cannot be spoofed via localStorage or profile edits.
  useEffect(() => {
    if (!isAdmin) {
      showToast('warning', 'Access denied — admin only.');
      navigate('home');
    }
  }, [isAdmin, navigate, showToast]);

  const [filter, setFilter] = useState('all');

  const chain    = useMemo(() => verifyAuditChain(auditLog), [auditLog]);
  const filtered = filter === 'all'
    ? auditLog
    : auditLog.filter((e) => e.type === filter);

  if (!isAdmin) return null;

  const exportCsv = () => {
    const csv = toCsv(auditLog, [
      { label: 'Timestamp', key: 'ts'                                         },
      { label: 'Event',     get: (r) => AUDIT_EVENTS[r.type]?.label || r.type },
      { label: 'Type',      key: 'type'                                        },
      { label: 'Detail',    key: 'detail'                                      },
      { label: 'Hash',      key: 'hash'                                        },
      { label: 'Prev',      key: 'prev'                                        },
    ]);
    downloadBlob(csv, 'lexiassist_audit_log.csv', 'text/csv;charset=utf-8');
    showToast('success', 'Audit log exported.');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={History}
        title="Audit Log"
        subtitle="Hash-chained activity trail — retroactive tampering is detectable"
        gradient="from-slate-600 to-slate-800"
      />

      {/* Chain integrity indicator */}
      <Card
        variant={chain.ok ? 'flat' : 'glass'}
        className={cn(
          'flex items-center gap-3',
          !chain.ok && 'border-red-300 dark:border-red-800'
        )}
      >
        {chain.ok
          ? <ShieldCheck className="w-5 h-5 text-emerald-500" />
          : <ShieldAlert  className="w-5 h-5 text-red-500"     />}
        <span className="text-sm">
          {chain.ok
            ? `Chain intact — ${auditLog.length} event(s) verified.`
            : `Chain broken at entry #${chain.brokenAt + 1} — the log may have been tampered with.`}
        </span>
      </Card>

      <Card variant="glass">
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-xs"
            options={[
              { value: 'all', label: 'All events' },
              ...Object.entries(AUDIT_EVENTS).map(([k, v]) => ({ value: k, label: v.label })),
            ]}
          />
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" /> CSV
          </button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={History}
            title="No audit events"
            description="Activity (AI queries, edits, exports, settings changes) is recorded here automatically."
          />
        ) : (
          <div className="max-h-[60vh] overflow-y-auto thin-scrollbar">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-400 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-900">
                <tr>
                  <th className="py-2 pr-3">Time</th>
                  <th className="pr-3">Event</th>
                  <th className="pr-3">Detail</th>
                  <th>Hash</th>
                </tr>
              </thead>
              <tbody>
                {[...filtered].reverse().map((e) => {
                  const meta = AUDIT_EVENTS[e.type] || { label: e.type, color: 'slate' };
                  return (
                    <tr key={e.id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-1.5 pr-3 text-slate-500 whitespace-nowrap">
                        {formatDateTime(e.ts)}
                      </td>
                      <td className="pr-3">
                        <span className={cn('font-medium', COLOR[meta.color])}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="pr-3 text-slate-500">{e.detail}</td>
                      <td className="text-slate-300 dark:text-slate-600 font-mono text-xs">
                        {e.hash?.slice(0, 10)}…
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
