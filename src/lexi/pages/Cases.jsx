// ============================================================
// lexi/pages/Cases.jsx — Case Manager + Hearing Calendar + Bundle Export
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  FolderOpen, Plus, Trash2, Calendar, Building2, Filter, Download,
  CalendarClock, FileText, Package, MessageCircle,
} from 'lucide-react';
import { useApp } from '../AppContext.jsx';
import { Card, Button, Input, Textarea, Select, Badge, Modal, EmptyState, PageHeader } from '../components/ui.jsx';
import { STATUS_BADGE } from '../themes.js';
import { formatDate, formatRelativeDate, daysUntil, cn } from '../utils.js';
import { exportPdf, exportTxt } from '../exports.js';

const STATUSES = ['active', 'pending', 'completed', 'archived'];

export function Cases() {
  const { cases, addCase, updateCase, deleteCase, clients, getClientName, analyses, showToast, profile, navigate } = useApp();
  const [tab, setTab] = useState('manager');
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [expanded, setExpanded] = useState(null);

  function emptyForm() {
    return { title: '', suitNo: '', court: '', clientId: '', status: 'active', notes: '', nextHearing: '' };
  }

  const filtered = useMemo(() => (filter === 'all' ? cases : cases.filter((c) => c.status === filter)), [cases, filter]);

  const allHearings = useMemo(() => {
    const out = [];
    cases.forEach((c) => {
      if (c.nextHearing) out.push({ caseId: c.id, title: c.title, suitNo: c.suitNo, court: c.court, date: c.nextHearing });
      (c.hearings || []).forEach((h) => out.push({ caseId: c.id, title: c.title, suitNo: c.suitNo, court: c.court, date: h.date, note: h.note }));
    });
    return out.filter((h) => h.date).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [cases]);

  const submit = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Required';
    if (!form.suitNo.trim()) e.suitNo = 'Required';
    if (Object.keys(e).length) { setErrors(e); return; }
    addCase(form);
    showToast('success', 'Case added.');
    setShowModal(false);
    setForm(emptyForm());
    setErrors({});
  };

  const addHearing = (caseItem) => {
    const date = window.prompt('Hearing date (YYYY-MM-DD):');
    if (!date) return;
    const note = window.prompt('Note (optional):') || '';
    updateCase(caseItem.id, { hearings: [...(caseItem.hearings || []), { date, note }] });
    showToast('success', 'Hearing added.');
  };

  const exportBundle = (c, kind) => {
    const caseAnalyses = analyses.filter((a) => a.caseId === c.id);
    const parts = [];
    parts.push(`CASE: ${c.title}`);
    parts.push(`Suit No: ${c.suitNo}`);
    if (c.court) parts.push(`Court: ${c.court}`);
    if (c.clientId) parts.push(`Client: ${getClientName(c.clientId)}`);
    parts.push(`Status: ${c.status}`);
    if (c.notes) parts.push(`\nNOTES:\n${c.notes}`);
    const hearings = [c.nextHearing && { date: c.nextHearing }, ...(c.hearings || [])].filter(Boolean);
    if (hearings.length) {
      parts.push('\nHEARINGS:');
      hearings.forEach((h) => parts.push(`  • ${formatDate(h.date)}${h.note ? ` — ${h.note}` : ''}`));
    }
    if (caseAnalyses.length) {
      parts.push('\n' + '='.repeat(50) + '\nSAVED ANALYSES\n' + '='.repeat(50));
      caseAnalyses.forEach((a, i) => {
        parts.push(`\n[${i + 1}] ${a.title} (${formatDate(a.createdAt)})\n${a.content}`);
      });
    }
    const content = parts.join('\n');
    const opts = { profile, title: `Case Bundle — ${c.title}`, filename: `Case_Bundle_${c.title}` };
    if (kind === 'PDF') exportPdf(content, opts); else exportTxt(content, opts);
    showToast('success', `Case bundle exported (${kind}).`);
  };

  return (
    <div className="space-y-6">
      <PageHeader icon={FolderOpen} title="Cases" subtitle={`${cases.length} matter(s) · case manager + hearing calendar`} gradient="from-emerald-400 to-teal-500">
        <Button onClick={() => setShowModal(true)} leftIcon={<Plus className="w-4 h-4" />}>Add case</Button>
      </PageHeader>

      <div className="flex gap-2">
        {[{ id: 'manager', label: 'Case Manager' }, { id: 'calendar', label: 'Hearing Calendar' }].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('px-4 py-2 rounded-lg text-sm font-medium', tab === t.id ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300')}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'manager' && (
        <>
          <Card variant="flat" className="flex items-center gap-3 flex-wrap py-3">
            <Filter className="w-4 h-4 text-slate-400" />
            {['all', ...STATUSES].map((s) => (
              <button key={s} onClick={() => setFilter(s)}
                className={cn('px-3 py-1 rounded-lg text-sm capitalize', filter === s ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300')}>
                {s}
              </button>
            ))}
          </Card>

          {filtered.length === 0 ? (
            <EmptyState icon={FolderOpen} title="No cases yet" description="Track your matters, hearings, and saved analyses in one place." action={{ label: 'Add case', onClick: () => setShowModal(true), icon: <Plus className="w-4 h-4" /> }} />
          ) : (
            <div className="grid gap-4">
              {filtered.map((c) => {
                const caseAnalyses = analyses.filter((a) => a.caseId === c.id);
                const open = expanded === c.id;
                return (
                  <Card key={c.id} variant="glass">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{c.title}</h3>
                          <select value={c.status} onChange={(e) => updateCase(c.id, { status: e.target.value })}
                            className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium border-0 cursor-pointer', STATUS_BADGE[c.status])}>
                            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                          <div><span className="font-medium">Suit No:</span> {c.suitNo}</div>
                          {c.court && <div className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /> {c.court}</div>}
                          {c.clientId && <div><span className="font-medium">Client:</span> {getClientName(c.clientId)}</div>}
                          {c.nextHearing && <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {formatDate(c.nextHearing)} ({formatRelativeDate(c.nextHearing)})</div>}
                        </div>
                        {c.notes && <p className="text-sm text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">{c.notes}</p>}
                        <div className="flex flex-wrap gap-2 pt-1">
                          <Button size="sm" variant="ghost" onClick={() => navigate('chat', { caseId: c.id })} leftIcon={<MessageCircle className="w-4 h-4" />}>Ask AI</Button>
                          <Button size="sm" variant="ghost" onClick={() => addHearing(c)} leftIcon={<CalendarClock className="w-4 h-4" />}>Add hearing</Button>
                          <Button size="sm" variant="ghost" onClick={() => setExpanded(open ? null : c.id)} leftIcon={<FileText className="w-4 h-4" />}>
                            Analyses ({caseAnalyses.length})
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => exportBundle(c, 'PDF')} leftIcon={<Package className="w-4 h-4" />}>Bundle PDF</Button>
                          <Button size="sm" variant="ghost" onClick={() => exportBundle(c, 'TXT')} leftIcon={<Download className="w-4 h-4" />}>Bundle TXT</Button>
                        </div>
                        {open && (
                          <div className="space-y-2 pt-2">
                            {caseAnalyses.length === 0 ? (
                              <p className="text-xs text-slate-400">No saved analyses. Use the AI Assistant and “Save to case”.</p>
                            ) : caseAnalyses.map((a) => (
                              <div key={a.id} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{a.title}</p>
                                <p className="text-xs text-slate-400 mb-1">{formatDate(a.createdAt)}</p>
                                <p className="text-xs text-slate-500 line-clamp-3 whitespace-pre-wrap">{a.content.slice(0, 300)}…</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => { if (window.confirm('Delete this case?')) deleteCase(c.id); }} className="text-red-500 self-start">
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'calendar' && (
        <Card variant="glass">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Upcoming hearings</h3>
          {allHearings.length === 0 ? (
            <EmptyState icon={Calendar} title="No hearings scheduled" description="Add hearing dates to your cases to see them here." />
          ) : (
            <div className="space-y-3">
              {allHearings.map((h, i) => {
                const d = daysUntil(h.date);
                const tone = d < 0 ? 'border-slate-200 dark:border-slate-700' : d <= 3 ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20' : d <= (profile.reminderWindow || 7) ? 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20' : 'border-slate-200 dark:border-slate-700';
                return (
                  <button key={i} onClick={() => { setTab('manager'); setExpanded(h.caseId); }} className="w-full text-left">
                    <div className={cn('p-4 rounded-xl border-2', tone)}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{h.title}</p>
                          <p className="text-sm text-slate-500">Suit No: {h.suitNo}{h.court ? ` · ${h.court}` : ''}</p>
                          {h.note && <p className="text-sm text-slate-500 mt-1">{h.note}</p>}
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1 flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {formatDate(h.date)}</p>
                        </div>
                        <Badge variant={d < 0 ? 'default' : d <= 3 ? 'danger' : d <= 7 ? 'warning' : 'default'}>{formatRelativeDate(h.date)}</Badge>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add case" size="lg">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Case title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} error={errors.title} placeholder="John Doe v. State" />
            <Input label="Suit number *" value={form.suitNo} onChange={(e) => setForm({ ...form, suitNo: e.target.value })} error={errors.suitNo} placeholder="FHC/L/CS/123/2025" />
            <Input label="Court" value={form.court} onChange={(e) => setForm({ ...form, court: e.target.value })} placeholder="Federal High Court, Lagos" />
            <Input label="Next hearing" type="date" value={form.nextHearing} onChange={(e) => setForm({ ...form, nextHearing: e.target.value })} />
            <Select label="Client" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              options={[{ value: '', label: 'Unassigned' }, ...clients.map((c) => ({ value: c.id, label: c.name }))]} />
            <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
              options={STATUSES.map((s) => ({ value: s, label: s }))} />
          </div>
          <Textarea label="Notes" rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={submit}>Save case</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
