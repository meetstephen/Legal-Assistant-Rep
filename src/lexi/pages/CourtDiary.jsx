// ============================================================
// lexi/pages/CourtDiary.jsx — Court Diary & Limitation Tracker
//
// Tabs: Upcoming · Limitations · Deadlines · All Matters
// Features:
//   • Hearing schedule with adjournment logging
//   • Limitation period countdown (colour-coded by urgency)
//   • Per-matter procedural deadline chains (FHC, HC, CA, SC, NIC, etc.)
//   • Standalone limitation calculator
//   • Export to CSV
// Storage key: 'lexi2:court-diary' (localStorage / Supabase-synced if
//   added to CLOUD_KEYS in AppContext.jsx)
// ============================================================

import React, {
  useState, useMemo, useCallback, useEffect,
} from 'react';
import {
  CalendarDays, Scale, Plus, ChevronRight, Clock, AlertTriangle,
  CheckCircle2, Circle, RotateCcw, Trash2, Edit3, Download,
  BookOpen, Gavel, Calculator, Search, Filter, X, Save,
  Bell, CheckCheck, ChevronDown, ChevronUp, Info,
} from 'lucide-react';
import { useApp } from '../AppContext.jsx';
import {
  COURTS, LIMITATION_PERIODS, PROCEDURAL_TEMPLATES,
  HEARING_TYPES, ADJOURNMENT_REASONS, MATTER_STATUSES,
  COUNSEL_ROLES,
} from '../courtData.js';
import {
  Card, Button, Input, Select, Textarea, Badge,
  PageHeader, Modal, EmptyState,
} from '../components/ui.jsx';
import { generateId, cn, formatDate, downloadBlob } from '../utils.js';

// ── Storage ─────────────────────────────────────────────────────────────────
const DIARY_KEY = 'lexi2:court-diary';

function loadMatters() {
  try {
    return JSON.parse(localStorage.getItem(DIARY_KEY) || '[]');
  } catch { return []; }
}

function saveMatters(list) {
  localStorage.setItem(DIARY_KEY, JSON.stringify(list));
}

// ── Date helpers ─────────────────────────────────────────────────────────────
function addDays(iso, n) {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function daysFrom(iso) {
  if (!iso) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(iso); target.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / 86400000);
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-NG', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function urgencyClass(days) {
  if (days === null) return '';
  if (days < 0)   return 'text-red-600 dark:text-red-400 font-bold';
  if (days <= 7)  return 'text-red-500 dark:text-red-400 font-semibold';
  if (days <= 30) return 'text-amber-600 dark:text-amber-400 font-medium';
  if (days <= 90) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-emerald-600 dark:text-emerald-400';
}

function urgencyBadge(days) {
  if (days === null) return null;
  if (days < 0)   return { label: `Overdue ${Math.abs(days)}d`, variant: 'danger'  };
  if (days === 0) return { label: 'TODAY',                        variant: 'danger'  };
  if (days === 1) return { label: 'TOMORROW',                     variant: 'danger'  };
  if (days <= 7)  return { label: `${days}d left`,                variant: 'danger'  };
  if (days <= 30) return { label: `${days}d left`,                variant: 'warning' };
  if (days <= 90) return { label: `${days}d left`,                variant: 'info'    };
  return { label: `${days}d left`, variant: 'success' };
}

function courtLabel(id) {
  return COURTS.find((c) => c.id === id)?.label || id;
}

function statusColor(id) {
  return MATTER_STATUSES.find((s) => s.id === id)?.color || 'slate';
}

// ── Default new matter form ───────────────────────────────────────────────────
const BLANK = {
  title: '', caseNo: '', court: 'fhc', courtLocation: '',
  counselRole: COUNSEL_ROLES[0],
  causeOfActionId: '', actionAroseDate: '',
  nextHearingDate: '', nextHearingTime: '9:00 AM', hearingType: HEARING_TYPES[0],
  status: 'active', notes: '',
};

// ── Add / Edit Matter Modal ───────────────────────────────────────────────────
function MatterModal({ matter, onClose, onSave }) {
  const isEdit = !!matter?.id;
  const [f, setF] = useState(matter || BLANK);

  const period = LIMITATION_PERIODS.find((p) => p.id === f.causeOfActionId);
  const limitationDeadline = period?.days && f.actionAroseDate
    ? addDays(f.actionAroseDate, period.days)
    : null;

  const courtOptions = COURTS.map((c) => ({ value: c.id, label: c.label }));
  const causeOptions = [
    { value: '', label: '— Select cause of action (optional) —' },
    ...LIMITATION_PERIODS.map((p) => ({ value: p.id, label: p.label })),
  ];

  const submit = () => {
    if (!f.title.trim()) return;
    const now = new Date().toISOString();
    const templates = PROCEDURAL_TEMPLATES[f.court] || [];
    onSave({
      ...f,
      id: f.id || generateId(),
      adjournments: f.adjournments || [],
      // Pre-populate procedural deadlines from template (only on create)
      deadlines: f.deadlines || templates.map((t) => ({
        id: generateId(),
        label: t.label,
        triggerEvent: t.triggerEvent,
        dueDays: t.dueDays,
        triggerDate: '',   // user fills in later
        dueDate: '',       // computed once triggerDate is set
        done: false,
        notes: '',
      })),
      createdAt: f.createdAt || now,
      updatedAt: now,
    });
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose}
      title={isEdit ? `Edit — ${f.title}` : 'Add Court Matter'}
      className="max-w-2xl">
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1 thin-scrollbar">

        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Matter / suit title *" value={f.title}
            onChange={(e) => setF({ ...f, title: e.target.value })}
            placeholder="Eze v Okafor (2024)" className="sm:col-span-2" />
          <Input label="Suit number" value={f.caseNo}
            onChange={(e) => setF({ ...f, caseNo: e.target.value })}
            placeholder="FHC/ABJ/CS/123/2024" />
          <Input label="Court location" value={f.courtLocation}
            onChange={(e) => setF({ ...f, courtLocation: e.target.value })}
            placeholder="Abuja, Lagos…" />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Select label="Court" value={f.court}
            onChange={(e) => setF({ ...f, court: e.target.value })}
            options={courtOptions} />
          <Select label="Your role" value={f.counselRole}
            onChange={(e) => setF({ ...f, counselRole: e.target.value })}
            options={COUNSEL_ROLES.map((r) => ({ value: r, label: r }))} />
        </div>

        <hr className="border-slate-200 dark:border-slate-700" />
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Limitation Period
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Select label="Cause of action" value={f.causeOfActionId}
            onChange={(e) => setF({ ...f, causeOfActionId: e.target.value })}
            options={causeOptions} className="sm:col-span-2" />
          <Input label="Date cause of action arose" type="date"
            value={f.actionAroseDate}
            onChange={(e) => setF({ ...f, actionAroseDate: e.target.value })} />
          {limitationDeadline && (
            <div className="flex flex-col justify-end pb-1">
              <p className="text-xs text-slate-500 mb-1">Limitation deadline</p>
              <p className={cn('text-sm font-semibold', urgencyClass(daysFrom(limitationDeadline)))}>
                {fmtDate(limitationDeadline)}
                {daysFrom(limitationDeadline) !== null && (
                  <span className="ml-2 font-normal text-xs">
                    ({daysFrom(limitationDeadline) >= 0
                      ? `${daysFrom(limitationDeadline)} days left`
                      : `${Math.abs(daysFrom(limitationDeadline))} days overdue`})
                  </span>
                )}
              </p>
            </div>
          )}
          {period && (
            <p className="text-xs text-slate-400 sm:col-span-2 italic">{period.law}</p>
          )}
        </div>

        <hr className="border-slate-200 dark:border-slate-700" />
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Next Hearing
        </p>
        <div className="grid sm:grid-cols-3 gap-3">
          <Input label="Hearing date" type="date" value={f.nextHearingDate}
            onChange={(e) => setF({ ...f, nextHearingDate: e.target.value })} />
          <Input label="Time" value={f.nextHearingTime}
            onChange={(e) => setF({ ...f, nextHearingTime: e.target.value })}
            placeholder="9:00 AM" />
          <Select label="Hearing type" value={f.hearingType}
            onChange={(e) => setF({ ...f, hearingType: e.target.value })}
            options={HEARING_TYPES.map((h) => ({ value: h, label: h }))} />
        </div>

        <Select label="Matter status" value={f.status}
          onChange={(e) => setF({ ...f, status: e.target.value })}
          options={MATTER_STATUSES.map((s) => ({ value: s.id, label: s.label }))} />

        <Textarea label="Notes" rows={2} value={f.notes}
          onChange={(e) => setF({ ...f, notes: e.target.value })}
          placeholder="Judge, parties, brief facts…" />

        <div className="flex gap-2 justify-end pt-2 sticky bottom-0 bg-white dark:bg-slate-900 py-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} leftIcon={<Save className="w-4 h-4" />} disabled={!f.title.trim()}>
            {isEdit ? 'Save changes' : 'Add matter'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Adjournment Modal ─────────────────────────────────────────────────────────
function AdjournModal({ matter, onClose, onSave }) {
  const [form, setForm] = useState({
    fromDate: matter.nextHearingDate || '',
    toDate: '', reason: ADJOURNMENT_REASONS[0], notes: '',
    hearingType: matter.hearingType || HEARING_TYPES[0],
  });

  const submit = () => {
    if (!form.toDate) return;
    onSave(matter.id, form);
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} title={`Adjourn — ${matter.title}`}>
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Adjourned from" type="date" value={form.fromDate}
            onChange={(e) => setForm({ ...form, fromDate: e.target.value })} />
          <Input label="New hearing date *" type="date" value={form.toDate}
            onChange={(e) => setForm({ ...form, toDate: e.target.value })} />
        </div>
        <Select label="Hearing type for new date" value={form.hearingType}
          onChange={(e) => setForm({ ...form, hearingType: e.target.value })}
          options={HEARING_TYPES.map((h) => ({ value: h, label: h }))} />
        <Select label="Reason for adjournment" value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
          options={ADJOURNMENT_REASONS.map((r) => ({ value: r, label: r }))} />
        <Textarea label="Notes (optional)" rows={2} value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!form.toDate}
            leftIcon={<RotateCcw className="w-4 h-4" />}>
            Record adjournment
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Deadline row ──────────────────────────────────────────────────────────────
function DeadlineRow({ dl, onChange }) {
  const days = dl.dueDate ? daysFrom(dl.dueDate) : null;
  const badge = urgencyBadge(days);
  return (
    <div className={cn(
      'flex items-start gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800',
      dl.done && 'opacity-50'
    )}>
      <button onClick={() => onChange({ ...dl, done: !dl.done })}
        className="mt-0.5 flex-shrink-0 text-slate-400 hover:text-emerald-500 transition-colors">
        {dl.done
          ? <CheckCheck className="w-5 h-5 text-emerald-500" />
          : <Circle className="w-5 h-5" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', dl.done && 'line-through text-slate-400')}>
          {dl.label}
        </p>
        <p className="text-xs text-slate-400">After: {dl.triggerEvent}</p>
        {dl.triggerDate && (
          <div className="flex items-center gap-3 mt-1">
            <p className="text-xs text-slate-500">Due: {fmtDate(dl.dueDate)}</p>
            {badge && !dl.done && (
              <Badge variant={badge.variant} className="text-xs">{badge.label}</Badge>
            )}
          </div>
        )}
        {!dl.triggerDate && (
          <div className="mt-1 flex items-center gap-2">
            <input type="date" value={dl.triggerDate || ''}
              onChange={(e) => {
                const td = e.target.value;
                onChange({ ...dl, triggerDate: td, dueDate: td ? addDays(td, dl.dueDays) : '' });
              }}
              className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300" />
            <span className="text-xs text-slate-400">+ {dl.dueDays} days = due date</span>
          </div>
        )}
        {dl.triggerDate && !dl.done && (
          <button onClick={() => onChange({ ...dl, triggerDate: '', dueDate: '' })}
            className="text-xs text-slate-400 hover:text-slate-600 mt-0.5">
            Clear trigger date
          </button>
        )}
      </div>
    </div>
  );
}

// ── Matter card ───────────────────────────────────────────────────────────────
function MatterCard({ matter, onEdit, onAdjourn, onDelete, expanded, onToggle }) {
  const { showToast } = useApp();
  const daysToHearing = matter.nextHearingDate ? daysFrom(matter.nextHearingDate) : null;
  const hearingBadge = urgencyBadge(daysToHearing);

  const period = LIMITATION_PERIODS.find((p) => p.id === matter.causeOfActionId);
  const limitDeadline = period?.days && matter.actionAroseDate
    ? addDays(matter.actionAroseDate, period.days)
    : null;
  const daysToLimit = limitDeadline ? daysFrom(limitDeadline) : null;
  const limitBadge = urgencyBadge(daysToLimit);

  const overdueDeadlines = (matter.deadlines || []).filter(
    (d) => !d.done && d.dueDate && daysFrom(d.dueDate) < 0
  ).length;

  return (
    <Card variant="glass" className={cn(
      'border-l-4 transition-shadow hover:shadow-md',
      statusColor(matter.status) === 'emerald' ? 'border-l-emerald-500' :
      statusColor(matter.status) === 'amber'   ? 'border-l-amber-500'   :
      statusColor(matter.status) === 'red'     ? 'border-l-red-500'     :
      statusColor(matter.status) === 'blue'    ? 'border-l-blue-500'    :
      statusColor(matter.status) === 'violet'  ? 'border-l-violet-500'  :
      'border-l-slate-300'
    )}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-slate-900 dark:text-white truncate">{matter.title}</p>
            <Badge variant={statusColor(matter.status) === 'emerald' ? 'success' :
                           statusColor(matter.status) === 'red' ? 'danger' :
                           statusColor(matter.status) === 'amber' ? 'warning' :
                           statusColor(matter.status) === 'blue' ? 'info' :
                           statusColor(matter.status) === 'violet' ? 'violet' : 'default'}>
              {MATTER_STATUSES.find((s) => s.id === matter.status)?.label || matter.status}
            </Badge>
            {overdueDeadlines > 0 && (
              <Badge variant="danger">{overdueDeadlines} overdue deadline{overdueDeadlines > 1 ? 's' : ''}</Badge>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            {courtLabel(matter.court)}
            {matter.courtLocation && ` — ${matter.courtLocation}`}
            {matter.caseNo && ` · ${matter.caseNo}`}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">{matter.counselRole}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => onAdjourn(matter)}
            className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-400 hover:text-amber-500"
            title="Record adjournment">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button onClick={() => onEdit(matter)}
            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-500"
            title="Edit matter">
            <Edit3 className="w-4 h-4" />
          </button>
          <button onClick={() => {
            if (window.confirm(`Delete "${matter.title}"? This cannot be undone.`)) onDelete(matter.id);
          }}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500"
            title="Delete matter">
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            title={expanded ? 'Collapse' : 'Expand'}>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Key dates row */}
      <div className="flex flex-wrap gap-4 mt-3">
        {/* Next hearing */}
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <div>
            <p className="text-xs text-slate-400">Next hearing</p>
            <p className={cn('text-sm font-medium', urgencyClass(daysToHearing))}>
              {matter.nextHearingDate ? fmtDate(matter.nextHearingDate) : 'Not set'}
              {matter.nextHearingTime && matter.nextHearingDate && (
                <span className="ml-1 text-xs font-normal text-slate-500">{matter.nextHearingTime}</span>
              )}
            </p>
            {hearingBadge && (
              <Badge variant={hearingBadge.variant} className="text-xs mt-0.5">{hearingBadge.label}</Badge>
            )}
          </div>
        </div>

        {/* Limitation */}
        {limitDeadline && (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-400">Limitation deadline</p>
              <p className={cn('text-sm font-medium', urgencyClass(daysToLimit))}>
                {fmtDate(limitDeadline)}
              </p>
              {limitBadge && (
                <Badge variant={limitBadge.variant} className="text-xs mt-0.5">{limitBadge.label}</Badge>
              )}
            </div>
          </div>
        )}

        {/* Adjournment count */}
        {(matter.adjournments || []).length > 0 && (
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-400">Adjournments</p>
              <p className={cn('text-sm font-medium',
                (matter.adjournments || []).length >= 5 ? 'text-amber-500' : 'text-slate-700 dark:text-slate-300'
              )}>
                {matter.adjournments.length}
                {(matter.adjournments || []).length >= 5 && (
                  <span className="ml-1 text-xs font-normal text-amber-500">⚠ review delay</span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-4 space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          {/* Procedural deadlines */}
          {(matter.deadlines || []).length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Procedural Deadlines
              </p>
              {matter.deadlines.map((dl) => (
                <DeadlineRow key={dl.id} dl={dl} onChange={(updated) => {
                  const newDeadlines = matter.deadlines.map((d) => d.id === updated.id ? updated : d);
                  // Propagate via onEdit as a lightweight update
                  onEdit({ ...matter, deadlines: newDeadlines, _silent: true });
                }} />
              ))}
            </div>
          )}

          {/* Adjournment history */}
          {(matter.adjournments || []).length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Adjournment History ({matter.adjournments.length})
              </p>
              <div className="space-y-1.5">
                {[...matter.adjournments].reverse().map((adj, i) => (
                  <div key={adj.id || i}
                    className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{fmtDate(adj.fromDate)} → <strong>{fmtDate(adj.toDate)}</strong></span>
                    <span className="text-slate-400">·</span>
                    <span className="text-xs">{adj.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {matter.notes && (
            <p className="text-sm text-slate-500 italic">{matter.notes}</p>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Limitation Calculator (standalone) ───────────────────────────────────────
function LimitationCalculator() {
  const [sel, setSel] = useState('');
  const [date, setDate] = useState('');
  const period = LIMITATION_PERIODS.find((p) => p.id === sel);
  const deadline = period?.days && date ? addDays(date, period.days) : null;
  const days = deadline ? daysFrom(deadline) : null;

  return (
    <Card variant="glass" className="space-y-4">
      <div className="flex items-center gap-2">
        <Calculator className="w-5 h-5 text-violet-500" />
        <h3 className="font-semibold text-slate-900 dark:text-white">
          Limitation Period Calculator
        </h3>
      </div>
      <p className="text-sm text-slate-500">
        Enter the date the cause of action arose to instantly compute the limitation deadline.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        <Select label="Cause of action"
          value={sel}
          onChange={(e) => setSel(e.target.value)}
          options={[
            { value: '', label: '— Select —' },
            ...LIMITATION_PERIODS.map((p) => ({ value: p.id, label: p.label })),
          ]}
          className="sm:col-span-2"
        />
        <Input label="Date cause of action arose" type="date" value={date}
          onChange={(e) => setDate(e.target.value)} />
        {deadline && (
          <div className="flex flex-col justify-end pb-1">
            <p className="text-xs text-slate-500 mb-1">Deadline to file suit</p>
            <p className={cn('text-xl font-bold', urgencyClass(days))}>
              {fmtDate(deadline)}
            </p>
            {days !== null && (
              <p className={cn('text-sm mt-0.5', urgencyClass(days))}>
                {days >= 0
                  ? `${days} day${days !== 1 ? 's' : ''} remaining`
                  : `⚠ ${Math.abs(days)} days past the deadline`}
              </p>
            )}
          </div>
        )}
      </div>
      {period && (
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 space-y-1.5 text-sm">
          <p className="text-slate-600 dark:text-slate-300">
            <strong>Applicable law:</strong> {period.law}
          </p>
          {period.days && (
            <p className="text-slate-500">
              <strong>Limitation period:</strong>{' '}
              {period.years ? `${period.years} year${period.years > 1 ? 's' : ''} (${period.days} days)` : `${period.days} days`}
            </p>
          )}
          {period.note && (
            <p className="text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {period.note}
            </p>
          )}
          {period.isPreAction && (
            <p className="text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              Pre-action notice required — serve written notice before filing the suit. The limitation clock also runs; do not wait.
            </p>
          )}
          {period.urgent && (
            <p className="text-red-600 dark:text-red-400 font-medium flex items-start gap-1.5">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              URGENT — this is a short limitation period. Act immediately.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Main CourtDiary page ──────────────────────────────────────────────────────
const TABS = [
  { id: 'upcoming',    label: 'Upcoming Hearings', icon: CalendarDays },
  { id: 'limitations', label: 'Limitations',        icon: Clock        },
  { id: 'deadlines',   label: 'Deadlines',          icon: CheckCircle2 },
  { id: 'all',         label: 'All Matters',         icon: BookOpen     },
  { id: 'calculator',  label: 'Calculator',          icon: Calculator   },
];

export function CourtDiary() {
  const { showToast, audit } = useApp();
  const [matters, setMatters] = useState(loadMatters);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [showAdd, setShowAdd] = useState(false);
  const [editMatter, setEditMatter] = useState(null);
  const [adjournMatter, setAdjournMatter] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [searchQ, setSearchQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const persist = useCallback((list) => {
    setMatters(list);
    saveMatters(list);
  }, []);

  const addMatter = useCallback((data) => {
    const updated = [...matters, data];
    persist(updated);
    audit('DIARY_ADD', data.title);
    showToast('success', `"${data.title}" added to your diary.`);
  }, [matters, persist, audit, showToast]);

  const updateMatter = useCallback((data) => {
    const updated = matters.map((m) => m.id === data.id ? data : m);
    persist(updated);
    if (!data._silent) {
      audit('DIARY_UPDATE', data.title);
      showToast('success', 'Matter updated.');
    }
  }, [matters, persist, audit, showToast]);

  const deleteMatter = useCallback((id) => {
    const m = matters.find((x) => x.id === id);
    persist(matters.filter((x) => x.id !== id));
    audit('DIARY_DELETE', m?.title || id);
    showToast('success', 'Matter removed from diary.');
  }, [matters, persist, audit, showToast]);

  const recordAdjournment = useCallback((matterId, form) => {
    const updated = matters.map((m) => {
      if (m.id !== matterId) return m;
      return {
        ...m,
        nextHearingDate: form.toDate,
        nextHearingTime: m.nextHearingTime,
        hearingType: form.hearingType,
        status: 'adjourned',
        adjournments: [...(m.adjournments || []), {
          id: generateId(),
          fromDate: form.fromDate,
          toDate: form.toDate,
          reason: form.reason,
          notes: form.notes,
        }],
        updatedAt: new Date().toISOString(),
      };
    });
    persist(updated);
    audit('DIARY_ADJOURN', `${matters.find((m) => m.id === matterId)?.title} → ${fmtDate(form.toDate)}`);
    showToast('success', `Adjourned to ${fmtDate(form.toDate)}.`);
  }, [matters, persist, audit, showToast]);

  const handleEdit = useCallback((data) => {
    if (data.id && matters.find((m) => m.id === data.id)) {
      updateMatter(data);
    }
    if (!data._silent) setEditMatter(null);
  }, [matters, updateMatter]);

  // Stats
  const today = new Date().toISOString().split('T')[0];
  const weekEnd = addDays(today, 7);

  const stats = useMemo(() => {
    const hearingsThisWeek = matters.filter((m) =>
      m.nextHearingDate && m.nextHearingDate >= today && m.nextHearingDate <= weekEnd
    ).length;
    const todayHearings = matters.filter((m) => m.nextHearingDate === today).length;
    const limitationAlerts = matters.filter((m) => {
      const period = LIMITATION_PERIODS.find((p) => p.id === m.causeOfActionId);
      if (!period?.days || !m.actionAroseDate) return false;
      const dl = addDays(m.actionAroseDate, period.days);
      const d = daysFrom(dl);
      return d !== null && d >= 0 && d <= 30;
    }).length;
    const overdueItems = matters.reduce((acc, m) =>
      acc + (m.deadlines || []).filter((d) => !d.done && d.dueDate && daysFrom(d.dueDate) < 0).length
    , 0);
    return { hearingsThisWeek, todayHearings, limitationAlerts, overdueItems };
  }, [matters, today, weekEnd]);

  // Filtered for All Matters tab
  const filteredMatters = useMemo(() =>
    matters.filter((m) => {
      const matchQ = !searchQ || [m.title, m.caseNo, m.courtLocation, m.notes]
        .some((s) => (s || '').toLowerCase().includes(searchQ.toLowerCase()));
      const matchStatus = !statusFilter || m.status === statusFilter;
      return matchQ && matchStatus;
    }), [matters, searchQ, statusFilter]
  );

  // Upcoming: sort by hearing date
  const upcoming = useMemo(() =>
    matters
      .filter((m) => m.nextHearingDate && m.status !== 'judgment' && m.status !== 'settled' && m.status !== 'withdrawn' && m.status !== 'struck_out')
      .sort((a, b) => a.nextHearingDate.localeCompare(b.nextHearingDate)),
    [matters]
  );

  // Limitations: matters with limitation tracking
  const limitations = useMemo(() =>
    matters
      .filter((m) => m.causeOfActionId && m.actionAroseDate)
      .map((m) => {
        const period = LIMITATION_PERIODS.find((p) => p.id === m.causeOfActionId);
        const deadline = period?.days ? addDays(m.actionAroseDate, period.days) : null;
        return { ...m, limitationDeadline: deadline, daysToLimit: deadline ? daysFrom(deadline) : null };
      })
      .sort((a, b) => {
        if (a.daysToLimit === null) return 1;
        if (b.daysToLimit === null) return -1;
        return a.daysToLimit - b.daysToLimit;
      }),
    [matters]
  );

  // Export to CSV
  const exportCsv = useCallback(() => {
    const rows = [
      ['Title','Suit No','Court','Location','Status','Next Hearing','Hearing Type','Limitation Deadline','Adjournments','Notes'],
      ...matters.map((m) => {
        const period = LIMITATION_PERIODS.find((p) => p.id === m.causeOfActionId);
        const ld = period?.days && m.actionAroseDate ? addDays(m.actionAroseDate, period.days) : '';
        return [
          m.title, m.caseNo, courtLabel(m.court), m.courtLocation,
          MATTER_STATUSES.find((s) => s.id === m.status)?.label || m.status,
          m.nextHearingDate, m.hearingType, ld,
          (m.adjournments || []).length, m.notes,
        ].map((v) => `"${(v || '').toString().replace(/"/g, '""')}"`);
      }),
    ];
    downloadBlob(rows.map((r) => r.join(',')).join('\n'), 'court_diary.csv', 'text/csv');
    showToast('success', 'Court diary exported.');
  }, [matters, showToast]);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Gavel}
        title="Court Diary"
        subtitle="Hearings · Limitation periods · Procedural deadlines · Adjournment log"
        gradient="from-slate-700 to-slate-900"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv} leftIcon={<Download className="w-4 h-4" />}>
              Export
            </Button>
            <Button size="sm" onClick={() => setShowAdd(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Add Matter
            </Button>
          </div>
        }
      />

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Today's hearings",   value: stats.todayHearings,    color: stats.todayHearings > 0 ? 'text-red-500' : 'text-slate-500',   icon: CalendarDays },
          { label: 'Hearings this week', value: stats.hearingsThisWeek, color: 'text-blue-500',   icon: Bell           },
          { label: 'Limitation alerts',  value: stats.limitationAlerts, color: stats.limitationAlerts > 0 ? 'text-amber-500' : 'text-slate-500', icon: Clock },
          { label: 'Overdue deadlines',  value: stats.overdueItems,     color: stats.overdueItems > 0 ? 'text-red-500' : 'text-slate-500',    icon: AlertTriangle },
        ].map((s) => (
          <Card key={s.label} variant="glass" className="flex items-center gap-3 py-3">
            <s.icon className={cn('w-5 h-5 flex-shrink-0', s.color)} />
            <div>
              <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl overflow-x-auto">
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            )}>
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── UPCOMING HEARINGS ── */}
      {activeTab === 'upcoming' && (
        <div className="space-y-3">
          {upcoming.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No upcoming hearings"
              description="Add a court matter to start tracking your hearing schedule." />
          ) : (
            upcoming.map((m) => (
              <MatterCard key={m.id} matter={m}
                onEdit={(data) => { if (data._silent) { updateMatter(data); } else { setEditMatter(data); } }}
                onAdjourn={setAdjournMatter}
                onDelete={deleteMatter}
                expanded={expandedId === m.id}
                onToggle={() => setExpandedId(expandedId === m.id ? null : m.id)}
              />
            ))
          )}
        </div>
      )}

      {/* ── LIMITATIONS ── */}
      {activeTab === 'limitations' && (
        <div className="space-y-3">
          {limitations.length === 0 ? (
            <Card variant="glass">
              <p className="text-sm text-slate-500 text-center py-4">
                No matters with limitation tracking. Add a matter and select a cause of action.
              </p>
            </Card>
          ) : (
            limitations.map((m) => {
              const badge = urgencyBadge(m.daysToLimit);
              const period = LIMITATION_PERIODS.find((p) => p.id === m.causeOfActionId);
              return (
                <Card key={m.id} variant="glass" className={cn(
                  'border-l-4',
                  m.daysToLimit !== null && m.daysToLimit < 0   ? 'border-l-red-600' :
                  m.daysToLimit !== null && m.daysToLimit <= 30 ? 'border-l-amber-500' :
                  m.daysToLimit !== null && m.daysToLimit <= 90 ? 'border-l-yellow-400' :
                  'border-l-emerald-500'
                )}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{m.title}</p>
                      <p className="text-sm text-slate-500">{courtLabel(m.court)}{m.caseNo && ` · ${m.caseNo}`}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Cause: {period?.label} · Arose: {fmtDate(m.actionAroseDate)}
                      </p>
                      <p className="text-xs text-slate-400">{period?.law}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={cn('text-lg font-bold', urgencyClass(m.daysToLimit))}>
                        {fmtDate(m.limitationDeadline)}
                      </p>
                      {badge && <Badge variant={badge.variant} className="text-xs">{badge.label}</Badge>}
                    </div>
                  </div>
                  {period?.note && (
                    <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1">
                      <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{period.note}
                    </p>
                  )}
                </Card>
              );
            })
          )}

          {/* Standalone calculator at bottom of limitations tab */}
          <LimitationCalculator />
        </div>
      )}

      {/* ── DEADLINES ── */}
      {activeTab === 'deadlines' && (
        <div className="space-y-4">
          {matters.filter((m) => (m.deadlines || []).length > 0).length === 0 ? (
            <EmptyState icon={CheckCircle2} title="No procedural deadlines"
              description="When you add a matter, procedural deadline templates for that court are pre-loaded." />
          ) : (
            matters
              .filter((m) => (m.deadlines || []).length > 0)
              .map((m) => {
                const overdue = (m.deadlines || []).filter((d) => !d.done && d.dueDate && daysFrom(d.dueDate) < 0).length;
                return (
                  <Card key={m.id} variant="glass" className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{m.title}</p>
                        <p className="text-xs text-slate-400">{courtLabel(m.court)}</p>
                      </div>
                      {overdue > 0 && <Badge variant="danger">{overdue} overdue</Badge>}
                    </div>
                    {(m.deadlines || []).map((dl) => (
                      <DeadlineRow key={dl.id} dl={dl} onChange={(updated) => {
                        const newDeadlines = m.deadlines.map((d) => d.id === updated.id ? updated : d);
                        updateMatter({ ...m, deadlines: newDeadlines, _silent: true });
                      }} />
                    ))}
                  </Card>
                );
              })
          )}
        </div>
      )}

      {/* ── ALL MATTERS ── */}
      {activeTab === 'all' && (
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <div className="flex-1 min-w-48 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search matters…"
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              {searchQ && (
                <button onClick={() => setSearchQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-300 focus:outline-none">
              <option value="">All statuses</option>
              {MATTER_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <p className="text-xs text-slate-400">{filteredMatters.length} of {matters.length} matters</p>
          {filteredMatters.length === 0 ? (
            <EmptyState icon={BookOpen} title="No matters yet"
              description='Tap "Add Matter" to register your first court case in the diary.' />
          ) : (
            filteredMatters.map((m) => (
              <MatterCard key={m.id} matter={m}
                onEdit={(data) => { if (data._silent) { updateMatter(data); } else { setEditMatter(data); } }}
                onAdjourn={setAdjournMatter}
                onDelete={deleteMatter}
                expanded={expandedId === m.id}
                onToggle={() => setExpandedId(expandedId === m.id ? null : m.id)}
              />
            ))
          )}
        </div>
      )}

      {/* ── CALCULATOR ── */}
      {activeTab === 'calculator' && <LimitationCalculator />}

      {/* Modals */}
      {showAdd && (
        <MatterModal
          onClose={() => setShowAdd(false)}
          onSave={addMatter}
        />
      )}
      {editMatter && !editMatter._silent && (
        <MatterModal
          matter={editMatter}
          onClose={() => setEditMatter(null)}
          onSave={updateMatter}
        />
      )}
      {adjournMatter && (
        <AdjournModal
          matter={adjournMatter}
          onClose={() => setAdjournMatter(null)}
          onSave={recordAdjournment}
        />
      )}
    </div>
  );
}
