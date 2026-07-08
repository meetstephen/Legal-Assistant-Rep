// ============================================================
// lexi/pages/NcmsCompliance.jsx — NCMS E-Filing Compliance Tracker
//
// Tracks appeals against the Supreme Court (Mandatory Upload of Electronic
// Copies of Processes, Record of Appeal, and Other Matters) Practice
// Directions, 2026 — effective 1 July 2026.
//
// Storage key: 'lexi2:ncms-compliance' (localStorage / Supabase-synced if
//   added to CLOUD_KEYS in AppContext.jsx — see integration notes)
// ============================================================
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  UploadCloud, Plus, Trash2, Edit3, AlertTriangle, Clock,
  Download, Filter, X, Save, Info,
} from 'lucide-react';
import { useApp } from '../AppContext.jsx';
import {
  NCMS_PRACTICE_DIRECTION, PHASE_1_WINDOW, FEES_AND_PENALTIES,
  DOCUMENT_REQUIREMENTS, STATUS_BADGE_CLASSNAME,
} from '../ncmsData.js';
import {
  calculateECopyDeadline, calculateHardCopyDeadline, estimateAccruedPenalty,
  getComplianceStatus, daysBetween, formatNGN,
} from '../ncmsUtils.js';
import {
  Card, Button, Input, Select, Textarea, Badge, PageHeader, Modal, EmptyState,
} from '../components/ui.jsx';
import { generateId, formatDate, downloadBlob } from '../utils.js';

// ── Storage ───────────────────────────────────────────────────────────────
const NCMS_KEY = 'lexi2:ncms-compliance';

function loadAppeals() {
  try {
    return JSON.parse(localStorage.getItem(NCMS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveAppeals(list) {
  localStorage.setItem(NCMS_KEY, JSON.stringify(list));
}

const EMPTY_FORM = {
  caseName: '',
  appealNumber: '',
  hearingDate: '',
  eCopyUploaded: false,
  eCopyUploadDate: '',
  ocrCompliant: false,
  tocCompliant: false,
  hardCopyDelivered: false,
  notes: '',
};

const STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'AT_RISK', label: 'At Risk' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'PENDING_HARD_COPY', label: 'Hard Copy Pending' },
  { value: 'FORMAT_NON_COMPLIANT', label: 'Non-Compliant Format' },
  { value: 'COMPLIANT', label: 'Fully Compliant' },
  { value: 'ON_TRACK', label: 'On Track' },
  { value: 'NOT_YET_MANDATORY', label: 'Not Yet Mandatory' },
];

export function NcmsCompliance() {
  const { showToast, audit } = useApp();
  const [appeals, setAppeals] = useState(loadAppeals);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => { saveAppeals(appeals); }, [appeals]);

  const enriched = useMemo(() => {
    const now = new Date();
    return appeals.map((a) => {
      const status = getComplianceStatus(a, now);
      const eCopyDeadline = calculateECopyDeadline(a.hearingDate);
      const hardCopyDeadline = calculateHardCopyDeadline(a.hearingDate);
      const penalty = estimateAccruedPenalty(a.hearingDate, {
        uploaded: a.eCopyUploaded, uploadDate: a.eCopyUploadDate, asOf: now,
      });
      return { ...a, status, eCopyDeadline, hardCopyDeadline, penalty };
    }).sort((x, y) => new Date(x.hearingDate) - new Date(y.hearingDate));
  }, [appeals]);

  const filtered = useMemo(
    () => (statusFilter === 'ALL' ? enriched : enriched.filter((a) => a.status.key === statusFilter)),
    [enriched, statusFilter],
  );

  const summary = useMemo(() => {
    const counts = {};
    enriched.forEach((a) => { counts[a.status.key] = (counts[a.status.key] || 0) + 1; });
    return counts;
  }, [enriched]);

  const openAddModal = useCallback(() => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setModalOpen(true);
  }, []);

  const openEditModal = useCallback((appeal) => {
    setEditingId(appeal.id);
    setForm({
      caseName: appeal.caseName,
      appealNumber: appeal.appealNumber || '',
      hearingDate: appeal.hearingDate,
      eCopyUploaded: appeal.eCopyUploaded,
      eCopyUploadDate: appeal.eCopyUploadDate || '',
      ocrCompliant: appeal.ocrCompliant,
      tocCompliant: appeal.tocCompliant,
      hardCopyDelivered: appeal.hardCopyDelivered,
      notes: appeal.notes || '',
    });
    setModalOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!form.caseName.trim() || !form.hearingDate) {
      showToast('warning', 'Case name and hearing date are required.');
      return;
    }
    if (editingId) {
      setAppeals((prev) => prev.map((a) => (a.id === editingId ? { ...a, ...form } : a)));
      audit('NCMS_APPEAL_UPDATE', form.caseName);
      showToast('success', 'Appeal updated.');
    } else {
      const item = { ...form, id: generateId(), createdAt: new Date().toISOString() };
      setAppeals((prev) => [...prev, item]);
      audit('NCMS_APPEAL_CREATE', form.caseName);
      showToast('success', 'Appeal added.');
    }
    setModalOpen(false);
  }, [form, editingId, audit, showToast]);

  const handleDelete = useCallback((appeal) => {
    if (!window.confirm(`Delete "${appeal.caseName}"? This cannot be undone.`)) return;
    setAppeals((prev) => prev.filter((a) => a.id !== appeal.id));
    audit('NCMS_APPEAL_DELETE', appeal.caseName);
    showToast('success', 'Appeal deleted.');
  }, [audit, showToast]);

  const handleExportCsv = useCallback(() => {
    const header = [
      'Case Name', 'Appeal Number', 'Hearing Date', 'E-Copy Deadline',
      'Hard Copy Deadline', 'Status', 'Est. Penalty (NGN)', 'Notes',
    ];
    const rows = enriched.map((a) => [
      a.caseName, a.appealNumber || '', a.hearingDate,
      a.eCopyDeadline.toISOString().slice(0, 10),
      a.hardCopyDeadline.toISOString().slice(0, 10),
      a.status.label, a.penalty.amountNGN, (a.notes || '').replace(/\n/g, ' '),
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    downloadBlob(csv, 'ncms-compliance.csv', 'text/csv');
    audit('NCMS_EXPORT', 'csv');
  }, [enriched, audit]);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={UploadCloud}
        title="NCMS E-Filing Compliance Tracker"
        subtitle={`Practice Directions 2026 — effective ${formatDate(NCMS_PRACTICE_DIRECTION.effectiveDate)}. Phase 1 covers hearings between ${formatDate(PHASE_1_WINDOW.start)} and ${formatDate(PHASE_1_WINDOW.end)}.`}
        gradient="from-blue-500 to-indigo-600"
      >
        <Button onClick={openAddModal}><Plus size={16} className="mr-1" /> Add Appeal</Button>
      </PageHeader>

      {!FEES_AND_PENALTIES.verified && (
        <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>
            Fee (₦{FEES_AND_PENALTIES.recordOfAppealTransmissionFeeNGN.toLocaleString()}) and
            penalty (₦{FEES_AND_PENALTIES.dailyDefaultPenaltyNGN.toLocaleString()}/day) figures
            are from a single news summary and not yet independently verified against the
            official Practice Directions text. Confirm before using for client billing.
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="At Risk" value={summary.AT_RISK || 0} color="amber" />
        <SummaryCard label="Overdue" value={summary.OVERDUE || 0} color="rose" />
        <SummaryCard label="Hard Copy Pending" value={summary.PENDING_HARD_COPY || 0} color="sky" />
        <SummaryCard label="Fully Compliant" value={summary.COMPLIANT || 0} color="green" />
      </div>

      <div className="flex items-center gap-2 text-sm">
        <Filter size={14} className="text-slate-500" />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-auto"
        >
          {STATUS_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
        {enriched.length > 0 && (
          <Button variant="ghost" onClick={handleExportCsv} className="ml-auto">
            <Download size={14} className="mr-1" /> Export CSV
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={UploadCloud}
          title="No appeals tracked yet"
          description="Add an appeal to start tracking its NCMS e-filing deadlines and penalty exposure."
          action={{ label: 'Add Appeal', icon: <Plus className="w-4 h-4" />, onClick: openAddModal }}
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-2">Case</th>
                <th className="text-left px-4 py-2">Hearing</th>
                <th className="text-left px-4 py-2">E-Copy Deadline</th>
                <th className="text-left px-4 py-2">Hard Copy Deadline</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Est. Penalty</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">
                    <div className="font-medium text-slate-900">{a.caseName}</div>
                    {a.appealNumber && <div className="text-xs text-slate-500">{a.appealNumber}</div>}
                  </td>
                  <td className="px-4 py-2">{formatDate(a.hearingDate)}</td>
                  <td className="px-4 py-2">
                    {formatDate(a.eCopyDeadline)}
                    {!a.eCopyUploaded && (
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock size={11} />
                        {daysBetween(new Date(), a.eCopyDeadline) >= 0
                          ? `${daysBetween(new Date(), a.eCopyDeadline)}d left`
                          : `${Math.abs(daysBetween(new Date(), a.eCopyDeadline))}d overdue`}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2">{formatDate(a.hardCopyDeadline)}</td>
                  <td className="px-4 py-2">
                    <Badge className={STATUS_BADGE_CLASSNAME[a.status.color]}>{a.status.label}</Badge>
                  </td>
                  <td className="px-4 py-2">
                    {a.penalty.amountNGN > 0 ? `${formatNGN(a.penalty.amountNGN)} (${a.penalty.daysLate}d)` : '—'}
                  </td>
                  <td className="px-4 py-2 text-right whitespace-nowrap space-x-3">
                    <button onClick={() => openEditModal(a)} className="text-slate-500 hover:text-slate-900" title="Edit">
                      <Edit3 size={15} />
                    </button>
                    <button onClick={() => handleDelete(a)} className="text-rose-500 hover:text-rose-700" title="Delete">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Appeal' : 'Add Appeal'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Case Name *"
              value={form.caseName}
              onChange={(e) => setForm({ ...form, caseName: e.target.value })}
              placeholder="e.g. Oyim v. Federal Republic"
            />
            <Input
              label="Appeal Number"
              value={form.appealNumber}
              onChange={(e) => setForm({ ...form, appealNumber: e.target.value })}
              placeholder="SC/CV/000/2026"
            />
            <Input
              type="date"
              label="Hearing Date *"
              value={form.hearingDate}
              onChange={(e) => setForm({ ...form, hearingDate: e.target.value })}
            />
            <Input
              type="date"
              label="E-Copy Upload Date"
              value={form.eCopyUploadDate}
              onChange={(e) => setForm({ ...form, eCopyUploadDate: e.target.value })}
              disabled={!form.eCopyUploaded}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              ['eCopyUploaded', 'E-Copy Uploaded'],
              ['ocrCompliant', DOCUMENT_REQUIREMENTS.ocrEnabledPdf.label],
              ['tocCompliant', DOCUMENT_REQUIREMENTS.hyperlinkedTableOfContents.label],
              ['hardCopyDelivered', 'Hard Copy Delivered'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                  className="rounded border-slate-300"
                />
                {label}
              </label>
            ))}
          </div>

          <Textarea
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              <X size={14} className="mr-1" /> Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save size={14} className="mr-1" /> {editingId ? 'Save Changes' : 'Add Appeal'}
            </Button>
          </div>
        </div>
      </Modal>

      <div className="flex items-start gap-2 text-xs text-slate-500">
        <Info size={13} className="mt-0.5 shrink-0" />
        <span>
          Hard-copy deadline is whichever of "7 days before hearing" or "48 hours before
          hearing" falls earlier — per the Practice Directions. Penalty estimates are a
          planning signal only; the Directions don't specify a cap.
        </span>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  return (
    <div className={`rounded-lg p-4 ${STATUS_BADGE_CLASSNAME[color]}`}>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs font-medium">{label}</div>
    </div>
  );
}
