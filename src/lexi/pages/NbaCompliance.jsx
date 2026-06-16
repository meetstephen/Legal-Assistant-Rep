// ============================================================
// lexi/pages/NbaCompliance.jsx — NBA Compliance Tracker
//
// Tracks: APC renewal · Stamp & Seal · CPD points · Branch Dues
// Data stored directly in localStorage (same pattern as CourtDiary).
// ============================================================

import React, { useState, useMemo, useCallback } from 'react';
import {
  Award, Shield, BookOpen, CreditCard, Calendar, CheckCircle2,
  AlertCircle, Clock, Plus, Trash2, Edit3, Download, Info,
  AlertTriangle, BarChart2, Target, Save, User, RefreshCw,
  ChevronDown, ChevronUp, Star,
} from 'lucide-react';
import { useApp } from '../AppContext.jsx';
import {
  Card, Button, Input, Select, Textarea, Badge,
  PageHeader, Modal, EmptyState, Toggle,
} from '../components/ui.jsx';
import { generateId, cn, formatDate, downloadBlob } from '../utils.js';

// ── Storage ──────────────────────────────────────────────────────────────────
const NBA_KEY = 'lexi2:nba-compliance';
const YEAR = new Date().getFullYear();
const CPD_REQUIRED = 15;

const CPD_CATEGORIES = [
  { value: 'legal-skills',     label: 'Legal Skills' },
  { value: 'ethics',           label: 'Ethics & Professionalism' },
  { value: 'business-skills',  label: 'Business Skills' },
  { value: 'practice-updates', label: 'Practice Area Updates' },
  { value: 'technology',       label: 'Legal Technology' },
  { value: 'wellbeing',        label: 'Wellbeing & Resilience' },
  { value: 'other',            label: 'Other' },
];

const NBA_BRANCHES = [
  'Lagos', 'Abuja (FCT)', 'Port Harcourt', 'Kano', 'Ibadan', 'Enugu',
  'Onitsha', 'Benin', 'Kaduna', 'Ilorin', 'Warri', 'Calabar', 'Owerri',
  'Umuahia', 'Abakaliki', 'Akure', 'Asaba', 'Jos', 'Maiduguri', 'Other',
];

const DEFAULT_DATA = {
  profile: { memberNo: '', callYear: '', barNumber: '', branchName: 'Lagos', isSan: false },
  apc: {
    current: {
      year: YEAR, status: 'pending',
      renewalDate: '', expiryDate: `${YEAR}-12-31`,
      receiptNo: '', amount: '', notes: '',
    },
    history: [],
  },
  stampSeal: {
    stampNo: '', sealNo: '',
    issuedDate: '', expiryDate: '',
    status: 'pending', receiptNo: '', notes: '',
  },
  cpd: { records: [] },
  branchDues: [],
};

function loadData() {
  try {
    const raw = localStorage.getItem(NBA_KEY);
    if (!raw) return DEFAULT_DATA;
    const parsed = JSON.parse(raw);
    // merge to ensure all keys present
    return {
      ...DEFAULT_DATA,
      ...parsed,
      profile: { ...DEFAULT_DATA.profile, ...(parsed.profile || {}) },
      apc: { ...DEFAULT_DATA.apc, ...(parsed.apc || {}), current: { ...DEFAULT_DATA.apc.current, ...(parsed.apc?.current || {}) } },
      stampSeal: { ...DEFAULT_DATA.stampSeal, ...(parsed.stampSeal || {}) },
      cpd: { records: parsed.cpd?.records || [] },
      branchDues: parsed.branchDues || [],
    };
  } catch { return DEFAULT_DATA; }
}

function saveData(data) {
  localStorage.setItem(NBA_KEY, JSON.stringify(data));
}

// ── Date helpers ──────────────────────────────────────────────────────────────
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00'); target.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / 86400000);
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' });
}

function urgencyVariant(days) {
  if (days === null) return 'default';
  if (days < 0) return 'danger';
  if (days <= 30) return 'danger';
  if (days <= 90) return 'warning';
  return 'success';
}

function urgencyLabel(days) {
  if (days === null) return 'Date not set';
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return 'Expires today!';
  if (days === 1) return 'Expires tomorrow';
  if (days <= 30) return `${days}d left`;
  if (days <= 90) return `${days}d left`;
  return `${days}d left`;
}

function statusVariant(status) {
  return { active: 'success', paid: 'success', current: 'success', expired: 'danger', pending: 'warning', suspended: 'danger' }[status] || 'default';
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ data, setTab }) {
  const apcDays = daysUntil(data.apc.current.expiryDate);
  const sealDays = daysUntil(data.stampSeal.expiryDate);
  const cpdEarned = useMemo(() =>
    data.cpd.records.filter(r => String(r.year) === String(YEAR)).reduce((s, r) => s + Number(r.points || 0), 0),
    [data.cpd.records]
  );
  const cpdPct = Math.min(100, Math.round((cpdEarned / CPD_REQUIRED) * 100));
  const currentDues = data.branchDues.find(d => d.year === YEAR);

  const cards = [
    {
      id: 'apc', label: 'APC', tab: 'apc',
      icon: Award, color: 'from-emerald-400 to-teal-500',
      status: data.apc.current.status,
      detail: data.apc.current.expiryDate ? `Expires ${fmtDate(data.apc.current.expiryDate)}` : 'Expiry date not set',
      badge: apcDays !== null ? urgencyLabel(apcDays) : null,
      variant: apcDays !== null ? urgencyVariant(apcDays) : 'warning',
    },
    {
      id: 'seal', label: 'Stamp & Seal', tab: 'stamp',
      icon: Shield, color: 'from-blue-400 to-indigo-500',
      status: data.stampSeal.status,
      detail: data.stampSeal.expiryDate ? `Expires ${fmtDate(data.stampSeal.expiryDate)}` : 'Expiry date not set',
      badge: sealDays !== null ? urgencyLabel(sealDays) : null,
      variant: sealDays !== null ? urgencyVariant(sealDays) : 'warning',
    },
    {
      id: 'cpd', label: 'CPD Points', tab: 'cpd',
      icon: BookOpen, color: 'from-violet-400 to-fuchsia-500',
      status: cpdEarned >= CPD_REQUIRED ? 'active' : 'pending',
      detail: `${cpdEarned} / ${CPD_REQUIRED} points earned (${YEAR})`,
      badge: `${cpdPct}% complete`,
      variant: cpdPct >= 100 ? 'success' : cpdPct >= 60 ? 'warning' : 'danger',
    },
    {
      id: 'dues', label: 'Branch Dues', tab: 'dues',
      icon: CreditCard, color: 'from-amber-400 to-orange-500',
      status: currentDues ? currentDues.status : 'pending',
      detail: currentDues ? `Paid ${fmtDate(currentDues.paymentDate)}` : `${YEAR} payment not recorded`,
      badge: currentDues?.status === 'paid' ? 'Paid' : 'Unpaid',
      variant: currentDues?.status === 'paid' ? 'success' : 'warning',
    },
  ];

  const alerts = [];
  if (apcDays !== null && apcDays <= 60) alerts.push({ msg: `APC expires in ${apcDays} day(s).`, variant: 'danger' });
  if (sealDays !== null && sealDays <= 60) alerts.push({ msg: `Stamp & Seal expires in ${sealDays} day(s).`, variant: 'danger' });
  if (cpdEarned < CPD_REQUIRED) alerts.push({ msg: `CPD: ${CPD_REQUIRED - cpdEarned} more points needed for ${YEAR}.`, variant: 'warning' });
  if (!currentDues || currentDues.status !== 'paid') alerts.push({ msg: `Branch dues for ${YEAR} not marked as paid.`, variant: 'warning' });

  return (
    <div className="space-y-5">
      {alerts.length > 0 && (
        <Card variant="flat" className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Action Required</p>
          {alerts.map((a, i) => (
            <div key={i} className={cn('flex items-center gap-2 text-sm rounded-lg px-3 py-2',
              a.variant === 'danger' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800' :
                'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
            )}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {a.msg}
            </div>
          ))}
        </Card>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {cards.map(c => (
          <button key={c.id} onClick={() => setTab(c.tab)} className="text-left">
            <Card variant="glass" hover className="space-y-3">
              <div className="flex items-center justify-between">
                <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center', c.color)}>
                  <c.icon className="w-5 h-5 text-white" />
                </div>
                <Badge variant={statusVariant(c.status)} className="capitalize">{c.status}</Badge>
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{c.label}</p>
                <p className="text-sm text-slate-500 mt-0.5">{c.detail}</p>
              </div>
              {c.badge && <Badge variant={c.variant}>{c.badge}</Badge>}
            </Card>
          </button>
        ))}
      </div>

      {/* CPD Progress Bar */}
      <Card variant="glass">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">CPD Progress {YEAR}</p>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{cpdEarned} / {CPD_REQUIRED} pts</span>
        </div>
        <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <div className={cn('h-full rounded-full transition-all', cpdEarned >= CPD_REQUIRED ? 'bg-emerald-500' : cpdEarned >= 10 ? 'bg-amber-500' : 'bg-red-500')}
            style={{ width: `${Math.min(100, (cpdEarned / CPD_REQUIRED) * 100)}%` }} />
        </div>
        <p className="text-xs text-slate-400 mt-1">{cpdEarned >= CPD_REQUIRED ? '✓ CPD requirement met for this year.' : `${CPD_REQUIRED - cpdEarned} more point(s) needed to meet the NBA CPD requirement.`}</p>
      </Card>

      {/* Profile Summary */}
      {(data.profile.memberNo || data.profile.barNumber) && (
        <Card variant="flat">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Lawyer Profile</p>
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            {data.profile.memberNo && <div><span className="text-slate-400">Member No.:</span> <span className="font-medium text-slate-700 dark:text-slate-200">{data.profile.memberNo}</span></div>}
            {data.profile.callYear && <div><span className="text-slate-400">Called:</span> <span className="font-medium text-slate-700 dark:text-slate-200">{data.profile.callYear}</span></div>}
            {data.profile.branchName && <div><span className="text-slate-400">Branch:</span> <span className="font-medium text-slate-700 dark:text-slate-200">{data.profile.branchName}</span></div>}
            {data.profile.isSan && <Badge variant="violet" className="w-fit">SAN</Badge>}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── APC Tab ───────────────────────────────────────────────────────────────────
function ApcTab({ data, onUpdate, showToast }) {
  const [form, setForm] = useState(data.apc.current);
  const [profileForm, setProfileForm] = useState(data.profile);
  const [showHistory, setShowHistory] = useState(false);
  const days = daysUntil(form.expiryDate);

  const save = () => {
    const updatedApc = { ...data.apc, current: { ...form, year: YEAR } };
    onUpdate({ apc: updatedApc, profile: profileForm });
    showToast('success', 'APC details saved.');
  };

  const archiveCurrent = () => {
    if (!data.apc.current.year) return;
    const history = [data.apc.current, ...data.apc.history].slice(0, 10);
    const fresh = { year: YEAR + 1, status: 'pending', renewalDate: '', expiryDate: `${YEAR + 1}-12-31`, receiptNo: '', amount: '', notes: '' };
    onUpdate({ apc: { current: fresh, history } });
    setForm(fresh);
    showToast('success', 'Current APC archived. New year record started.');
  };

  return (
    <div className="space-y-4">
      {/* Profile */}
      <Card variant="glass" className="space-y-3">
        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-500" /> Lawyer Profile
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="NBA Member Number" value={profileForm.memberNo} onChange={e => setProfileForm(p => ({ ...p, memberNo: e.target.value }))} placeholder="e.g. NBA/LAG/0001234" />
          <Input label="Year Called to Bar" value={profileForm.callYear} onChange={e => setProfileForm(p => ({ ...p, callYear: e.target.value }))} placeholder="e.g. 2015" />
          <Input label="Bar Number / Enrolment Number" value={profileForm.barNumber} onChange={e => setProfileForm(p => ({ ...p, barNumber: e.target.value }))} placeholder="e.g. 012345" />
          <Select label="NBA Branch" value={profileForm.branchName} onChange={e => setProfileForm(p => ({ ...p, branchName: e.target.value }))}
            options={NBA_BRANCHES.map(b => ({ value: b, label: `${b} Branch` }))} />
        </div>
        <Toggle checked={profileForm.isSan} onChange={v => setProfileForm(p => ({ ...p, isSan: v }))} label="Senior Advocate of Nigeria (SAN)" hint="Affects fee calculations and compliance requirements." />
      </Card>

      {/* Current APC */}
      <Card variant="glass" className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-500" /> APC {YEAR} — Annual Practising Certificate
          </h3>
          {days !== null && <Badge variant={urgencyVariant(days)}>{urgencyLabel(days)}</Badge>}
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            options={[{ value: 'pending', label: 'Pending Renewal' }, { value: 'active', label: 'Active / Current' }, { value: 'expired', label: 'Expired' }, { value: 'suspended', label: 'Suspended' }]} />
          <Input label="Renewal / Payment Date" type="date" value={form.renewalDate} onChange={e => setForm(f => ({ ...f, renewalDate: e.target.value }))} />
          <Input label="Expiry Date" type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} />
          <Input label="Receipt / Payment Reference" value={form.receiptNo} onChange={e => setForm(f => ({ ...f, receiptNo: e.target.value }))} placeholder="Receipt number" />
          <Input label="Amount Paid (₦)" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="e.g. 30000" />
        </div>
        <Textarea label="Notes" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Branch, payment method, collection date, etc." />
        <div className="flex gap-2 flex-wrap">
          <Button onClick={save} leftIcon={<Save className="w-4 h-4" />}>Save APC Details</Button>
          <Button variant="secondary" onClick={archiveCurrent} leftIcon={<RefreshCw className="w-4 h-4" />}>Archive & Start Next Year</Button>
        </div>
        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          APC renewal deadlines and fees change annually. Confirm current requirements on the NBA website or at your branch secretariat.
        </p>
      </Card>

      {/* History */}
      {data.apc.history.length > 0 && (
        <Card variant="flat">
          <button className="w-full flex items-center justify-between text-sm font-medium text-slate-600 dark:text-slate-300" onClick={() => setShowHistory(h => !h)}>
            <span>APC History ({data.apc.history.length} records)</span>
            {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showHistory && (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <tr><th className="py-2 pr-3">Year</th><th className="pr-3">Status</th><th className="pr-3">Renewed</th><th className="pr-3">Expires</th><th>Amount</th></tr>
                </thead>
                <tbody>
                  {data.apc.history.map((h, i) => (
                    <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-1.5 pr-3 font-medium">{h.year}</td>
                      <td className="pr-3"><Badge variant={statusVariant(h.status)} className="capitalize">{h.status}</Badge></td>
                      <td className="pr-3 text-slate-500">{fmtDate(h.renewalDate)}</td>
                      <td className="pr-3 text-slate-500">{fmtDate(h.expiryDate)}</td>
                      <td className="text-slate-500">{h.amount ? `₦${Number(h.amount).toLocaleString()}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ── Stamp & Seal Tab ──────────────────────────────────────────────────────────
function StampSealTab({ data, onUpdate, showToast }) {
  const [form, setForm] = useState(data.stampSeal);
  const days = daysUntil(form.expiryDate);

  const save = () => {
    onUpdate({ stampSeal: form });
    showToast('success', 'Stamp & Seal details saved.');
  };

  return (
    <div className="space-y-4">
      <Card variant="glass" className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-500" /> NBA Stamp & Seal
          </h3>
          {days !== null && <Badge variant={urgencyVariant(days)}>{urgencyLabel(days)}</Badge>}
        </div>
        <p className="text-sm text-slate-500">The NBA Stamp and Seal authenticates legal documents and is issued per lawyer. It must be renewed annually alongside the APC.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Stamp Number" value={form.stampNo} onChange={e => setForm(f => ({ ...f, stampNo: e.target.value }))} placeholder="e.g. NBA/STAMP/2024/001" />
          <Input label="Seal Number" value={form.sealNo} onChange={e => setForm(f => ({ ...f, sealNo: e.target.value }))} placeholder="e.g. NBA/SEAL/2024/001" />
          <Select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            options={[{ value: 'active', label: 'Active' }, { value: 'pending', label: 'Pending Renewal' }, { value: 'expired', label: 'Expired' }]} />
          <Input label="Receipt / Reference" value={form.receiptNo} onChange={e => setForm(f => ({ ...f, receiptNo: e.target.value }))} placeholder="Receipt number" />
          <Input label="Date Issued / Renewed" type="date" value={form.issuedDate} onChange={e => setForm(f => ({ ...f, issuedDate: e.target.value }))} />
          <Input label="Expiry Date" type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} />
        </div>
        <Textarea label="Notes" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Collection date, branch office, any issues, etc." />
        <Button onClick={save} leftIcon={<Save className="w-4 h-4" />}>Save Stamp & Seal Details</Button>
      </Card>
      <Card variant="flat" className="text-sm space-y-1.5 text-slate-500">
        <p className="font-semibold text-slate-700 dark:text-slate-300">About NBA Stamp & Seal</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Must be renewed every year alongside your APC.</li>
          <li>Required on all court processes, letters, agreements, and legal documents you sign.</li>
          <li>Using an expired stamp/seal on court processes is a violation of the RPC and may lead to rejection of processes.</li>
          <li>Collect from your NBA Branch Secretariat after APC renewal.</li>
        </ul>
      </Card>
    </div>
  );
}

// ── CPD Tab ───────────────────────────────────────────────────────────────────
function CpdTab({ data, onUpdate, showToast }) {
  const [showModal, setShowModal] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [yearFilter, setYearFilter] = useState(String(YEAR));
  const [form, setForm] = useState({ year: YEAR, title: '', provider: '', date: '', points: '', category: 'legal-skills', certNo: '', notes: '' });

  const filtered = useMemo(() =>
    data.cpd.records.filter(r => !yearFilter || String(r.year) === yearFilter)
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [data.cpd.records, yearFilter]
  );

  const totalFiltered = filtered.reduce((s, r) => s + Number(r.points || 0), 0);
  const yearEarned = data.cpd.records.filter(r => String(r.year) === String(YEAR)).reduce((s, r) => s + Number(r.points || 0), 0);

  const openAdd = () => {
    setForm({ year: YEAR, title: '', provider: '', date: '', points: '', category: 'legal-skills', certNo: '', notes: '' });
    setEditRecord(null);
    setShowModal(true);
  };

  const openEdit = (rec) => {
    setForm({ ...rec });
    setEditRecord(rec.id);
    setShowModal(true);
  };

  const saveRecord = () => {
    if (!form.title.trim() || !form.points) { showToast('warning', 'Title and points are required.'); return; }
    let records;
    if (editRecord) {
      records = data.cpd.records.map(r => r.id === editRecord ? { ...form, id: editRecord, points: Number(form.points) } : r);
    } else {
      records = [...data.cpd.records, { ...form, id: generateId(), points: Number(form.points) }];
    }
    onUpdate({ cpd: { records } });
    showToast('success', editRecord ? 'CPD record updated.' : 'CPD record added.');
    setShowModal(false);
  };

  const del = (id) => {
    onUpdate({ cpd: { records: data.cpd.records.filter(r => r.id !== id) } });
    showToast('success', 'Record removed.');
  };

  const exportCsv = () => {
    const rows = [['Year', 'Date', 'Title', 'Provider', 'Category', 'Points', 'Cert No', 'Notes'],
      ...data.cpd.records.map(r => [r.year, r.date, r.title, r.provider, r.category, r.points, r.certNo, r.notes].map(v => `"${(v || '').toString().replace(/"/g, '""')}"`))]
      .map(r => r.join(',')).join('\n');
    downloadBlob(rows, 'cpd_records.csv', 'text/csv');
    showToast('success', 'CPD records exported.');
  };

  const catLabel = v => CPD_CATEGORIES.find(c => c.value === v)?.label || v;
  const years = [...new Set(data.cpd.records.map(r => String(r.year)))].sort((a, b) => b - a);
  if (!years.includes(String(YEAR))) years.unshift(String(YEAR));

  return (
    <div className="space-y-4">
      {/* Progress */}
      <Card variant="glass" className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-violet-500" /> CPD Points {YEAR}
          </h3>
          <Badge variant={yearEarned >= CPD_REQUIRED ? 'success' : yearEarned >= 10 ? 'warning' : 'danger'}>
            {yearEarned} / {CPD_REQUIRED} pts
          </Badge>
        </div>
        <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <div className={cn('h-full rounded-full transition-all', yearEarned >= CPD_REQUIRED ? 'bg-emerald-500' : yearEarned >= 10 ? 'bg-amber-500' : 'bg-red-500')}
            style={{ width: `${Math.min(100, (yearEarned / CPD_REQUIRED) * 100)}%` }} />
        </div>
        <p className="text-xs text-slate-400">
          {yearEarned >= CPD_REQUIRED
            ? `✓ You have met the NBA CPD requirement of ${CPD_REQUIRED} points for ${YEAR}.`
            : `${CPD_REQUIRED - yearEarned} more point(s) required. NBA mandates ${CPD_REQUIRED} CPD points per calendar year.`}
        </p>

        {/* Category breakdown for current year */}
        {yearEarned > 0 && (() => {
          const byCategory = {};
          data.cpd.records.filter(r => String(r.year) === String(YEAR)).forEach(r => {
            byCategory[r.category] = (byCategory[r.category] || 0) + Number(r.points || 0);
          });
          return (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
              {Object.entries(byCategory).map(([cat, pts]) => (
                <div key={cat} className="rounded-lg bg-slate-50 dark:bg-slate-800/50 px-2 py-1.5 text-xs">
                  <p className="text-slate-400 truncate">{catLabel(cat)}</p>
                  <p className="font-semibold text-slate-700 dark:text-slate-200">{pts} pts</p>
                </div>
              ))}
            </div>
          );
        })()}
      </Card>

      {/* Records list */}
      <Card variant="glass">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="font-semibold text-slate-900 dark:text-white">CPD Records</h3>
          <div className="flex gap-2">
            <Select value={yearFilter} onChange={e => setYearFilter(e.target.value)} className="w-28"
              options={[{ value: '', label: 'All years' }, ...years.map(y => ({ value: y, label: y }))]} />
            <Button variant="secondary" size="sm" onClick={exportCsv} leftIcon={<Download className="w-4 h-4" />}>Export</Button>
            <Button size="sm" onClick={openAdd} leftIcon={<Plus className="w-4 h-4" />}>Add Record</Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={BookOpen} title="No CPD records" description={`Add your CPD activities for ${yearFilter || 'any year'}.`} action={{ label: 'Add Record', onClick: openAdd }} />
        ) : (
          <>
            <p className="text-xs text-slate-400 mb-2">{filtered.length} record(s) · {totalFiltered} total points</p>
            <div className="space-y-2">
              {filtered.map(r => (
                <div key={r.id} className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 dark:text-slate-100 text-sm truncate">{r.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-slate-400">{r.provider}</span>
                      {r.date && <span className="text-xs text-slate-400">{fmtDate(r.date)}</span>}
                      <Badge variant="info">{catLabel(r.category)}</Badge>
                      {r.certNo && <span className="text-xs text-slate-400">Cert: {r.certNo}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{r.points} pts</span>
                    <button onClick={() => openEdit(r)} className="p-1 text-slate-400 hover:text-blue-500"><Edit3 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => del(r.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <Card variant="flat" className="text-xs text-slate-400 space-y-1">
        <p className="font-semibold text-slate-600 dark:text-slate-300 text-sm">CPD Guidelines</p>
        <p>The NBA requires a minimum of {CPD_REQUIRED} CPD points per calendar year. At least 3 points must be in Ethics & Professionalism. Verify current requirements with the NBA CPD Committee.</p>
      </Card>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editRecord ? 'Edit CPD Record' : 'Add CPD Record'}>
        <div className="space-y-3">
          <Input label="Training title / Event name *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <div className="grid sm:grid-cols-2 gap-3">
            <Input label="Provider / Organiser" value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} />
            <Input label="Date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            <Select label="Category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} options={CPD_CATEGORIES} />
            <Input label="Points Earned *" type="number" min="0.5" step="0.5" value={form.points} onChange={e => setForm(f => ({ ...f, points: e.target.value }))} placeholder="e.g. 3" />
            <Input label="Year" type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
            <Input label="Certificate No. (if any)" value={form.certNo} onChange={e => setForm(f => ({ ...f, certNo: e.target.value }))} />
          </div>
          <Textarea label="Notes" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={saveRecord}>{editRecord ? 'Update' : 'Add Record'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── Branch Dues Tab ───────────────────────────────────────────────────────────
function BranchDuesTab({ data, onUpdate, showToast }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ year: YEAR, branchName: data.profile.branchName || 'Lagos', amount: '', paymentDate: '', status: 'paid', receiptNo: '', notes: '' });

  const sorted = useMemo(() => [...data.branchDues].sort((a, b) => b.year - a.year), [data.branchDues]);
  const currentYear = sorted.find(d => d.year === YEAR);

  const save = () => {
    if (!form.amount || !form.paymentDate) { showToast('warning', 'Amount and payment date required.'); return; }
    const existing = data.branchDues.findIndex(d => d.year === Number(form.year) && d.branchName === form.branchName);
    let dues;
    if (existing >= 0) {
      dues = data.branchDues.map((d, i) => i === existing ? { ...d, ...form, year: Number(form.year), amount: Number(form.amount) } : d);
    } else {
      dues = [...data.branchDues, { ...form, id: generateId(), year: Number(form.year), amount: Number(form.amount) }];
    }
    onUpdate({ branchDues: dues });
    showToast('success', 'Branch dues record saved.');
    setShowModal(false);
  };

  const del = (id) => {
    onUpdate({ branchDues: data.branchDues.filter(d => d.id !== id) });
    showToast('success', 'Record removed.');
  };

  return (
    <div className="space-y-4">
      <Card variant="glass">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-500" /> Branch Dues
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">Annual dues paid to your NBA Branch.</p>
          </div>
          <Button size="sm" onClick={() => {
            setForm({ year: YEAR, branchName: data.profile.branchName || 'Lagos', amount: '', paymentDate: '', status: 'paid', receiptNo: '', notes: '' });
            setShowModal(true);
          }} leftIcon={<Plus className="w-4 h-4" />}>Record Payment</Button>
        </div>

        {/* Current year status */}
        <div className={cn('rounded-xl border-2 p-4 mb-4',
          currentYear?.status === 'paid' ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20' : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20'
        )}>
          <div className="flex items-center gap-3">
            {currentYear?.status === 'paid'
              ? <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              : <AlertCircle className="w-6 h-6 text-amber-500" />}
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">
                {currentYear?.status === 'paid' ? `${YEAR} Branch Dues Paid` : `${YEAR} Branch Dues Not Recorded`}
              </p>
              {currentYear && (
                <p className="text-sm text-slate-500">
                  ₦{Number(currentYear.amount).toLocaleString()} · Paid {fmtDate(currentYear.paymentDate)} · {currentYear.branchName} Branch
                  {currentYear.receiptNo && ` · Receipt: ${currentYear.receiptNo}`}
                </p>
              )}
            </div>
          </div>
        </div>

        {sorted.length === 0 ? (
          <EmptyState icon={CreditCard} title="No dues records" description="Record your NBA branch dues payments here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <tr><th className="py-2 pr-3">Year</th><th className="pr-3">Branch</th><th className="pr-3">Amount</th><th className="pr-3">Date</th><th className="pr-3">Status</th><th /></tr>
              </thead>
              <tbody>
                {sorted.map(d => (
                  <tr key={d.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-1.5 pr-3 font-semibold">{d.year}</td>
                    <td className="pr-3 text-slate-500">{d.branchName}</td>
                    <td className="pr-3 font-medium">₦{Number(d.amount).toLocaleString()}</td>
                    <td className="pr-3 text-slate-500">{fmtDate(d.paymentDate)}</td>
                    <td className="pr-3"><Badge variant={d.status === 'paid' ? 'success' : 'warning'} className="capitalize">{d.status}</Badge></td>
                    <td><button onClick={() => del(d.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Record Branch Dues Payment">
        <div className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <Input label="Year" type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
            <Select label="Branch" value={form.branchName} onChange={e => setForm(f => ({ ...f, branchName: e.target.value }))}
              options={NBA_BRANCHES.map(b => ({ value: b, label: `${b} Branch` }))} />
            <Input label="Amount Paid (₦) *" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            <Input label="Payment Date *" type="date" value={form.paymentDate} onChange={e => setForm(f => ({ ...f, paymentDate: e.target.value }))} />
            <Input label="Receipt No." value={form.receiptNo} onChange={e => setForm(f => ({ ...f, receiptNo: e.target.value }))} />
            <Select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              options={[{ value: 'paid', label: 'Paid' }, { value: 'pending', label: 'Pending' }]} />
          </div>
          <Textarea label="Notes" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={save}>Save Record</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview', label: 'Overview',     icon: BarChart2  },
  { id: 'apc',      label: 'APC',           icon: Award      },
  { id: 'stamp',    label: 'Stamp & Seal',  icon: Shield     },
  { id: 'cpd',      label: 'CPD Points',    icon: BookOpen   },
  { id: 'dues',     label: 'Branch Dues',   icon: CreditCard },
];

export function NbaCompliance() {
  const { showToast, audit } = useApp();
  const [data, setData] = useState(loadData);
  const [tab, setTab] = useState('overview');

  const onUpdate = useCallback((patch) => {
    const next = { ...data, ...patch };
    setData(next);
    saveData(next);
    audit('SETTINGS_UPDATE', 'nba-compliance');
  }, [data, audit]);

  return (
    <div className="space-y-6">
      <PageHeader icon={Star} title="NBA Compliance Tracker" subtitle="APC renewal · Stamp & Seal · CPD points · Branch Dues" gradient="from-emerald-500 to-teal-600" />

      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
              tab === t.id ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            )}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab data={data} setTab={setTab} />}
      {tab === 'apc'      && <ApcTab      data={data} onUpdate={onUpdate} showToast={showToast} />}
      {tab === 'stamp'    && <StampSealTab data={data} onUpdate={onUpdate} showToast={showToast} />}
      {tab === 'cpd'      && <CpdTab      data={data} onUpdate={onUpdate} showToast={showToast} />}
      {tab === 'dues'     && <BranchDuesTab data={data} onUpdate={onUpdate} showToast={showToast} />}
    </div>
  );
}
