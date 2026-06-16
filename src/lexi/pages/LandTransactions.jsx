// ============================================================
// lexi/pages/LandTransactions.jsx — Land Transactions Module
//
// Tabs: Stamp Duty Calculator · Governor's Consent Tracker ·
//       Title Search Tracker · C of O Tracker · Deed of Assignment
// ============================================================

import React, { useState, useMemo, useCallback } from 'react';
import {
  Building2, Calculator, FileText, Search, Key, ClipboardCheck,
  Plus, Trash2, Edit3, Download, AlertTriangle, Info, Save,
  CheckCircle2, Circle, ChevronDown, ChevronUp, ExternalLink,
  Sparkles, Square, MapPin, RefreshCw, CheckCheck,
} from 'lucide-react';
import { useApp } from '../AppContext.jsx';
import { useAiRun } from '../useAiRun.js';
import {
  Card, Button, Input, Select, Textarea, Badge,
  PageHeader, Modal, EmptyState,
} from '../components/ui.jsx';
import { AiResult } from '../components/AiResult.jsx';
import { generateId, cn, formatDate, downloadBlob } from '../utils.js';

// ── Storage ───────────────────────────────────────────────────────────────────
const LAND_KEY = 'lexi2:land-transactions';

const DEFAULT_DATA = {
  govConsent: [],
  titleSearch: [],
  cOfO: [],
  deedAssignment: [],
};

function loadData() {
  try {
    const raw = localStorage.getItem(LAND_KEY);
    if (!raw) return DEFAULT_DATA;
    const p = JSON.parse(raw);
    return {
      govConsent:     Array.isArray(p.govConsent)    ? p.govConsent    : [],
      titleSearch:    Array.isArray(p.titleSearch)   ? p.titleSearch   : [],
      cOfO:           Array.isArray(p.cOfO)          ? p.cOfO          : [],
      deedAssignment: Array.isArray(p.deedAssignment)? p.deedAssignment: [],
    };
  } catch { return DEFAULT_DATA; }
}

function saveData(d) { localStorage.setItem(LAND_KEY, JSON.stringify(d)); }

// ── Stamp Duty Rates (Stamp Duties Act CAP S8 LFN 2004 as amended) ───────────
const STAMP_TRANSACTIONS = [
  {
    id: 'sale', label: 'Sale / Conveyance of Land',
    description: 'Transfer of ownership of land/property by sale',
    valueLabel: 'Purchase Price / Consideration (₦)',
    rate: 0.015, rateLabel: '1.5%',
    basis: 'Stamp Duties Act, Schedule — Item 22',
    notes: 'Payable by purchaser. Also verify Capital Gains Tax (CGT) at 10% of gains on disposal (CGTA, as amended by Finance Acts 2019–2023).',
  },
  {
    id: 'mortgage', label: 'Legal Mortgage / Charge',
    description: 'Security for a loan registered on land',
    valueLabel: 'Loan / Secured Amount (₦)',
    rate: 0.00375, rateLabel: '0.375%',
    basis: 'Stamp Duties Act, Schedule — Item 18',
    notes: 'Applies to the principal sum secured. Equitable mortgages attract a lower rate — verify at the relevant State Lands Registry.',
  },
  {
    id: 'lease-short', label: 'Lease / Tenancy — Under 7 Years',
    description: 'Short-term lease or tenancy agreement',
    valueLabel: 'Annual Rent (₦)',
    rate: 0.0078, rateLabel: '0.78%',
    basis: 'Stamp Duties Act, Schedule — Item 15(a)',
    notes: 'Based on annual rent. If total rent is used, divide by number of years to get annual rent.',
  },
  {
    id: 'lease-medium', label: 'Lease — 7 to 100 Years',
    description: 'Medium-term commercial or residential lease',
    valueLabel: 'Annual Rent (₦)',
    rate: 0.03, rateLabel: '3%',
    basis: 'Stamp Duties Act, Schedule — Item 15(b)',
    notes: 'Based on annual rent. Term must be clearly stated in the lease document.',
  },
  {
    id: 'lease-long', label: 'Lease — Over 100 Years',
    description: 'Long-term lease exceeding one hundred years',
    valueLabel: 'Annual Rent (₦)',
    rate: 0.06, rateLabel: '6%',
    basis: 'Stamp Duties Act, Schedule — Item 15(c)',
    notes: 'Very high duty reflects the quasi-ownership nature of such leases.',
  },
  {
    id: 'gift', label: 'Deed of Gift (Land)',
    description: 'Gratuitous transfer of land without monetary consideration',
    valueLabel: 'Market Value of Property (₦)',
    rate: 0.015, rateLabel: '1.5%',
    basis: 'Stamp Duties Act, Schedule — Item 8',
    notes: 'Market value must be assessed and agreed with FIRS. Obtain a valuation report.',
  },
  {
    id: 'partition', label: 'Deed of Partition / Exchange',
    description: 'Partitioning jointly owned land among co-owners',
    valueLabel: 'Value of Shares Exchanged (₦)',
    rate: 0.00375, rateLabel: '0.375%',
    basis: 'Stamp Duties Act, Schedule — Item 21',
    notes: 'Applies to the share changing hands. Both parties are liable in proportion to their interests.',
  },
  {
    id: 'agreement-sale', label: 'Agreement for Sale of Land',
    description: 'Preliminary contract / agreement before completion',
    valueLabel: 'Agreed Purchase Price (₦)',
    rate: 0.0075, rateLabel: '0.75%',
    basis: 'Stamp Duties Act, Schedule — Item 2',
    notes: 'Additional stamp duty is payable on the Deed of Conveyance on completion (total effective rate 1.5%).',
  },
];

// ── Governor's Consent Stages ─────────────────────────────────────────────────
const CONSENT_STAGES = [
  { id: 'docs-prep',      label: 'Documents Preparation',         desc: 'Gathering title documents, survey plan, deed' },
  { id: 'application',    label: 'Application Submitted',          desc: 'Lodged at the State Lands Bureau / Ministry' },
  { id: 'assessment',     label: 'Assessment / Valuation',         desc: 'Land is valued; fees assessed by the registry' },
  { id: 'fee-payment',    label: 'Consent Fee Payment',            desc: 'Consent fees, endorsement fees paid' },
  { id: 'processing',     label: 'Processing at Governor\'s Office', desc: 'File with Governor\'s Office for approval' },
  { id: 'approved',       label: 'Consent Granted',                desc: 'Governor\'s consent endorsed on the deed' },
  { id: 'stamping',       label: 'Stamping & Registration',        desc: 'Deed stamped and registered at Land Registry' },
  { id: 'completed',      label: 'Completed',                      desc: 'All processes concluded, documents returned' },
];

// ── C of O Stages ─────────────────────────────────────────────────────────────
const COO_STAGES = [
  { id: 'application',   label: 'Application Submitted',      desc: 'Application lodged with all required documents' },
  { id: 'docs-review',   label: 'Document Verification',      desc: 'Registry verifies documents and checks for conflicts' },
  { id: 'survey',        label: 'Survey Plan Approval',       desc: 'Licensed surveyor submits to State Surveyor-General' },
  { id: 'technical',     label: 'Technical Committee Review', desc: 'File reviewed by Ministry\'s technical committee' },
  { id: 'fee-payment',   label: 'Application Fees Paid',      desc: 'Statutory fees, processing fees paid' },
  { id: 'governors-sig', label: 'Governor\'s Approval',       desc: 'File presented for Governor\'s signature / approval' },
  { id: 'issued',        label: 'C of O Issued',              desc: 'Certificate prepared and ready for collection' },
  { id: 'collected',     label: 'Collected',                  desc: 'C of O collected from the Registry' },
];

// ── Title Search Statuses ─────────────────────────────────────────────────────
const SEARCH_STATUSES = [
  { value: 'pending',    label: 'Request Pending' },
  { value: 'submitted',  label: 'Submitted to Registry' },
  { value: 'in-progress',label: 'Search in Progress' },
  { value: 'completed',  label: 'Search Completed' },
  { value: 'clear',      label: 'Title Clear' },
  { value: 'issues',     label: 'Title Issues Found' },
];

// ── Deed of Assignment Checklist ──────────────────────────────────────────────
const DEED_PRE_CHECKLIST = [
  'Vendor\'s identity verified (government-issued ID, CAC search for companies)',
  'Evidence of title obtained and examined (C of O, Deed, Registered Survey Plan)',
  'No government acquisition order on the property confirmed',
  'Previous title documents form a good root of title (at least 30 years)',
  'No adverse entries in the Land Registry (title search conducted)',
  'Property physically inspected and description matches documents',
  'Vendor\'s capacity and authority to sell confirmed',
  'Purchase price agreed and deposit terms settled',
  'Survey plan is current, authenticated and properly endorsed',
  'Existence of statutory right of occupancy or C of O confirmed',
];

const DEED_DRAFTING_CHECKLIST = [
  'Full legal names, addresses and status of all parties stated',
  'Recitals disclose the history of title accurately',
  'Property description is precise (dimensions, abutting neighbours, beacons)',
  'Plan number and reference to survey plan included',
  'Consideration / purchase price stated in words and figures',
  'Receipt of payment acknowledged where full payment made',
  'All covenants and conditions clearly stated',
  'Statutory covenants implied by the Conveyancing Act applied where relevant',
  'Assignment clause conveys the proper estate and interest',
  'Possession / vacant possession clause included',
  'Indemnity clause included where appropriate',
  'Date and place of execution stated',
  'Execution block for each party (signature, date, witness)',
  'Attestation clause for illiterate parties where applicable',
];

const DEED_POST_CHECKLIST = [
  'Deed duly executed by all parties',
  'All signatures witnessed appropriately (with witness names and addresses)',
  'Dated on the day of execution (or earlier agreement)',
  'Stamp duty assessed and paid at FIRS / State Revenue Board',
  'Stamped instrument presented to the Land Registry',
  'Governor\'s consent application filed (where land is under the Land Use Act)',
  'All previous title documents delivered to the purchaser',
  'Deed registered at the Land Registry and registration number obtained',
  'Certified copies of registered deed and title documents obtained',
  'Client advised to take possession and take steps to fence/develop',
];

// ── Date helpers ──────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' });
}

function stagePercent(stages, currentId) {
  const idx = stages.findIndex(s => s.id === currentId);
  if (idx < 0) return 0;
  return Math.round(((idx + 1) / stages.length) * 100);
}

function statusVariant(st) {
  const map = { 'completed': 'success', 'collected': 'success', 'clear': 'success', 'issued': 'success', 'approved': 'success', 'in-progress': 'info', 'submitted': 'info', 'processing': 'info', 'issues': 'danger', 'rejected': 'danger', 'pending': 'warning' };
  return map[st] || 'default';
}

// ── Stamp Duty Calculator Tab ─────────────────────────────────────────────────
function StampDutyTab() {
  const [txId, setTxId] = useState('sale');
  const [value, setValue] = useState('');

  const tx = STAMP_TRANSACTIONS.find(t => t.id === txId) || STAMP_TRANSACTIONS[0];
  const numVal = Number(value.replace(/,/g, '')) || 0;
  const duty = numVal * tx.rate;
  const fmtNum = n => n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-4">
      <Card variant="glass" className="space-y-4">
        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Calculator className="w-5 h-5 text-emerald-500" /> Stamp Duty Calculator
        </h3>
        <p className="text-sm text-slate-500">Based on the Stamp Duties Act (Cap S8 LFN 2004) as amended by successive Finance Acts. Always confirm current rates with FIRS.</p>

        <Select label="Transaction Type" value={txId} onChange={e => setTxId(e.target.value)}
          options={STAMP_TRANSACTIONS.map(t => ({ value: t.id, label: t.label }))} />

        {tx && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-sm space-y-1">
            <p className="text-slate-500">{tx.description}</p>
            <p className="text-xs text-slate-400">Legal basis: {tx.basis}</p>
          </div>
        )}

        <Input label={tx.valueLabel} type="text"
          value={value}
          onChange={e => setValue(e.target.value.replace(/[^\d.]/g, ''))}
          placeholder="e.g. 25000000" />

        {numVal > 0 && (
          <div className="rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4 space-y-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Stamp Duty Calculation</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction value</span>
                <span className="font-medium">₦{fmtNum(numVal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Rate applicable</span>
                <span className="font-medium">{tx.rateLabel}</span>
              </div>
              <div className="flex justify-between border-t border-emerald-200 dark:border-emerald-800 pt-2">
                <span className="font-bold text-slate-900 dark:text-white">Stamp Duty Payable</span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">₦{fmtNum(duty)}</span>
              </div>
            </div>
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{tx.notes}</span>
            </div>
          </div>
        )}
      </Card>

      {/* All rates table */}
      <Card variant="glass">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">All Stamp Duty Rates Reference</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2 pr-4">Transaction</th>
                <th className="pr-4">Rate</th>
                <th className="pr-4">Basis</th>
              </tr>
            </thead>
            <tbody>
              {STAMP_TRANSACTIONS.map(t => (
                <tr key={t.id} className={cn('border-b border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50', txId === t.id && 'bg-emerald-50/60 dark:bg-emerald-900/10')}
                  onClick={() => setTxId(t.id)}>
                  <td className="py-2 pr-4 font-medium text-slate-700 dark:text-slate-200">{t.label}</td>
                  <td className="pr-4"><Badge variant="info">{t.rateLabel}</Badge></td>
                  <td className="text-xs text-slate-400">{t.basis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1.5 mt-3">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          Rates are for reference only. Always confirm current rates with FIRS or the relevant State Revenue Board before completing a transaction. State-specific levies may apply in addition to federal stamp duty.
        </p>
      </Card>
    </div>
  );
}

// ── Generic Tracker Component (reused for Gov't Consent & C of O) ─────────────
function StageTracker({ title, subtitle, icon: Icon, gradient, records, stages, onAdd, onUpdate, onDelete, showModal, setShowModal, form, setForm, saveRecord, modalTitle, formFields, showToast }) {
  const [expandedId, setExpandedId] = useState(null);

  const sorted = useMemo(() => [...records].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [records]);

  return (
    <div className="space-y-4">
      <Card variant="glass">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center', gradient)}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
              <p className="text-sm text-slate-500">{subtitle}</p>
            </div>
          </div>
          <Button size="sm" onClick={onAdd} leftIcon={<Plus className="w-4 h-4" />}>Add</Button>
        </div>

        {sorted.length === 0 ? (
          <EmptyState icon={Icon} title={`No ${title} records`} description={`Track your ${title.toLowerCase()} applications here.`} action={{ label: 'Add Application', onClick: onAdd }} />
        ) : (
          <div className="space-y-3">
            {sorted.map(rec => {
              const stageIdx = stages.findIndex(s => s.id === rec.currentStage);
              const pct = stagePercent(stages, rec.currentStage);
              const isExpanded = expandedId === rec.id;
              const currentStageInfo = stages.find(s => s.id === rec.currentStage);

              return (
                <Card key={rec.id} variant="flat" className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">{rec.title}</p>
                      <p className="text-sm text-slate-500">{rec.refNo && `Ref: ${rec.refNo} · `}{rec.propertyAddr}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Badge variant={pct >= 100 ? 'success' : pct >= 50 ? 'info' : 'warning'}>{pct}%</Badge>
                      <button onClick={() => onUpdate({ ...rec, _editMode: true })} className="p-1 text-slate-400 hover:text-blue-500"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => onDelete(rec.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      <button onClick={() => setExpandedId(isExpanded ? null : rec.id)} className="p-1 text-slate-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>{currentStageInfo?.label || 'Not started'}</span>
                      <span>{stageIdx + 1} of {stages.length}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all', pct >= 100 ? 'bg-emerald-500' : 'bg-blue-500')} style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  {/* Expanded: stage selector + notes */}
                  {isExpanded && (
                    <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Progress Stages</p>
                      <div className="space-y-1.5">
                        {stages.map((st, i) => {
                          const done = i <= stageIdx;
                          return (
                            <button key={st.id} onClick={() => onUpdate({ ...rec, currentStage: st.id })}
                              className={cn('w-full flex items-start gap-2.5 text-left text-sm p-2 rounded-lg transition-colors',
                                done ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                              )}>
                              {done ? <CheckCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" /> : <Circle className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-300" />}
                              <div>
                                <p className="font-medium">{st.label}</p>
                                <p className="text-xs opacity-70">{st.desc}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {rec.notes && (
                        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2 text-sm text-slate-500">{rec.notes}</div>
                      )}
                      {rec.submittedDate && <p className="text-xs text-slate-400">Submitted: {fmtDate(rec.submittedDate)}</p>}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={modalTitle} size="lg">
        <div className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            {formFields.map(f => (
              f.type === 'select' ? (
                <Select key={f.key} label={f.label} value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} options={f.options} className={f.wide ? 'sm:col-span-2' : ''} />
              ) : f.type === 'textarea' ? (
                <Textarea key={f.key} label={f.label} rows={2} value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder || ''} className="sm:col-span-2" />
              ) : (
                <Input key={f.key} label={f.label} type={f.type || 'text'} value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder || ''} className={f.wide ? 'sm:col-span-2' : ''} />
              )
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={saveRecord}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── Governor's Consent Tab ────────────────────────────────────────────────────
function GovConsentTab({ data, onUpdate, showToast }) {
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});

  const blankForm = () => ({ title: '', refNo: '', propertyAddr: '', parties: '', submittedDate: '', currentStage: 'docs-prep', notes: '' });

  const openAdd = () => { setForm(blankForm()); setEditId(null); setShowModal(true); };
  const openEdit = (rec) => { setForm({ ...rec }); setEditId(rec.id); setShowModal(true); };

  const save = () => {
    if (!form.title?.trim()) { showToast('warning', 'Application title required.'); return; }
    let list;
    if (editId) {
      list = data.govConsent.map(r => r.id === editId ? { ...form, id: editId } : r);
    } else {
      list = [...data.govConsent, { ...form, id: generateId(), createdAt: new Date().toISOString() }];
    }
    onUpdate({ govConsent: list });
    showToast('success', editId ? 'Application updated.' : 'Application added.');
    setShowModal(false);
  };

  const updateStage = (rec) => {
    const list = data.govConsent.map(r => r.id === rec.id ? { ...rec } : r);
    onUpdate({ govConsent: list });
  };

  const del = (id) => { onUpdate({ govConsent: data.govConsent.filter(r => r.id !== id) }); showToast('success', 'Record deleted.'); };

  const formFields = [
    { key: 'title', label: 'Matter / Application Title *', placeholder: 'e.g. Sale of Property at 5 Adeola St, Ikoyi', wide: true },
    { key: 'refNo', label: 'Application Reference Number', placeholder: 'e.g. LASG/GC/2024/001' },
    { key: 'submittedDate', label: 'Date Submitted', type: 'date' },
    { key: 'propertyAddr', label: 'Property Address', placeholder: 'Full property address', wide: true },
    { key: 'parties', label: 'Parties (Vendor → Purchaser)', placeholder: 'e.g. Ade Johnson → Chioma Obi', wide: true },
    { key: 'currentStage', label: 'Current Stage', type: 'select', options: CONSENT_STAGES.map(s => ({ value: s.id, label: s.label })) },
    { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Registry contact, outstanding items, fees paid, etc.' },
  ];

  // Patch the onUpdate for edit mode from expand
  const handleUpdate = useCallback((rec) => {
    if (rec._editMode) { openEdit(rec); return; }
    updateStage(rec);
  }, [data.govConsent]);

  return (
    <StageTracker
      title="Governor's Consent Tracker" subtitle="Track Land Use Act consent applications"
      icon={Key} gradient="from-blue-400 to-indigo-500"
      records={data.govConsent} stages={CONSENT_STAGES}
      onAdd={openAdd} onUpdate={handleUpdate} onDelete={del}
      showModal={showModal} setShowModal={setShowModal}
      form={form} setForm={setForm} saveRecord={save}
      modalTitle={editId ? 'Edit Application' : 'New Governor\'s Consent Application'}
      formFields={formFields} showToast={showToast}
    />
  );
}

// ── Title Search Tab ──────────────────────────────────────────────────────────
function TitleSearchTab({ data, onUpdate, showToast }) {
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});

  const blankForm = () => ({ propertyDesc: '', registry: '', applicant: '', submittedDate: '', status: 'pending', feePaid: '', result: '', notes: '' });

  const openAdd = () => { setForm(blankForm()); setEditId(null); setShowModal(true); };

  const save = () => {
    if (!form.propertyDesc?.trim()) { showToast('warning', 'Property description required.'); return; }
    let list;
    if (editId) {
      list = data.titleSearch.map(r => r.id === editId ? { ...form, id: editId } : r);
    } else {
      list = [...data.titleSearch, { ...form, id: generateId(), createdAt: new Date().toISOString() }];
    }
    onUpdate({ titleSearch: list });
    showToast('success', editId ? 'Search record updated.' : 'Search request added.');
    setShowModal(false);
  };

  const del = (id) => { onUpdate({ titleSearch: data.titleSearch.filter(r => r.id !== id) }); showToast('success', 'Record deleted.'); };

  const sorted = useMemo(() => [...data.titleSearch].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [data.titleSearch]);

  return (
    <div className="space-y-4">
      <Card variant="glass">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Title Search Tracker</h3>
              <p className="text-sm text-slate-500">Monitor property title search requests and results</p>
            </div>
          </div>
          <Button size="sm" onClick={openAdd} leftIcon={<Plus className="w-4 h-4" />}>Add Search</Button>
        </div>

        {sorted.length === 0 ? (
          <EmptyState icon={Search} title="No title search records" description="Track your title search requests and outcomes here." action={{ label: 'Add Search Request', onClick: openAdd }} />
        ) : (
          <div className="space-y-3">
            {sorted.map(rec => (
              <div key={rec.id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{rec.propertyDesc}</p>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {rec.registry && <span className="text-xs text-slate-500">Registry: {rec.registry}</span>}
                      {rec.submittedDate && <span className="text-xs text-slate-500">Submitted: {fmtDate(rec.submittedDate)}</span>}
                      {rec.applicant && <span className="text-xs text-slate-500">For: {rec.applicant}</span>}
                    </div>
                    {rec.result && (
                      <div className={cn('mt-2 rounded-lg px-3 py-2 text-sm', rec.status === 'clear' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : rec.status === 'issues' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300')}>
                        <p className="text-xs font-semibold mb-0.5">Search Result:</p>
                        {rec.result}
                      </div>
                    )}
                    {rec.notes && <p className="text-xs text-slate-400 mt-1">{rec.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Badge variant={statusVariant(rec.status)}>
                      {SEARCH_STATUSES.find(s => s.value === rec.status)?.label || rec.status}
                    </Badge>
                    <button onClick={() => { setForm({ ...rec }); setEditId(rec.id); setShowModal(true); }} className="p-1 text-slate-400 hover:text-blue-500"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => del(rec.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card variant="flat" className="text-xs text-slate-400 space-y-1">
        <p className="font-medium text-sm text-slate-600 dark:text-slate-300">About Title Searches</p>
        <p>A title search is conducted at the relevant State Land Registry to confirm ownership, detect encumbrances (mortgages, caveats, court orders), and verify that the property is not subject to government acquisition or revocation. Always conduct a title search before completing any land transaction.</p>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editId ? 'Edit Search Record' : 'New Title Search Request'} size="lg">
        <div className="space-y-3">
          <Textarea label="Property Description *" rows={2} value={form.propertyDesc || ''} onChange={e => setForm(f => ({ ...f, propertyDesc: e.target.value }))} placeholder="e.g. Plot 5, Block B, Lekki Phase 1, Lagos State" />
          <div className="grid sm:grid-cols-2 gap-3">
            <Input label="Land Registry" value={form.registry || ''} onChange={e => setForm(f => ({ ...f, registry: e.target.value }))} placeholder="e.g. Lagos State Land Registry, Alausa" />
            <Input label="Applicant / Client" value={form.applicant || ''} onChange={e => setForm(f => ({ ...f, applicant: e.target.value }))} />
            <Input label="Date Submitted" type="date" value={form.submittedDate || ''} onChange={e => setForm(f => ({ ...f, submittedDate: e.target.value }))} />
            <Input label="Search Fee Paid (₦)" type="number" value={form.feePaid || ''} onChange={e => setForm(f => ({ ...f, feePaid: e.target.value }))} />
            <Select label="Status" value={form.status || 'pending'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} options={SEARCH_STATUSES} className="sm:col-span-2" />
          </div>
          <Textarea label="Search Result / Findings" rows={3} value={form.result || ''} onChange={e => setForm(f => ({ ...f, result: e.target.value }))} placeholder="Summarise findings from the search — ownership details, encumbrances, cautions, etc." />
          <Textarea label="Notes" rows={2} value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Registry contact, outstanding items, next steps." />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── C of O Tracker Tab ────────────────────────────────────────────────────────
function CofOTab({ data, onUpdate, showToast }) {
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});

  const blankForm = () => ({ title: '', refNo: '', propertyAddr: '', applicant: '', submittedDate: '', currentStage: 'application', notes: '' });

  const openAdd = () => { setForm(blankForm()); setEditId(null); setShowModal(true); };

  const save = () => {
    if (!form.title?.trim()) { showToast('warning', 'Application title required.'); return; }
    let list;
    if (editId) {
      list = data.cOfO.map(r => r.id === editId ? { ...form, id: editId } : r);
    } else {
      list = [...data.cOfO, { ...form, id: generateId(), createdAt: new Date().toISOString() }];
    }
    onUpdate({ cOfO: list });
    showToast('success', editId ? 'Application updated.' : 'C of O application added.');
    setShowModal(false);
  };

  const updateStage = (rec) => {
    const list = data.cOfO.map(r => r.id === rec.id ? { ...rec } : r);
    onUpdate({ cOfO: list });
  };

  const del = (id) => { onUpdate({ cOfO: data.cOfO.filter(r => r.id !== id) }); showToast('success', 'Record deleted.'); };

  const formFields = [
    { key: 'title', label: 'Application Title *', placeholder: 'e.g. C of O for 10 Eko Crescent, Victoria Island', wide: true },
    { key: 'refNo', label: 'Application Reference', placeholder: 'e.g. LASG/COO/2024/00123' },
    { key: 'submittedDate', label: 'Date Submitted', type: 'date' },
    { key: 'propertyAddr', label: 'Property Address', placeholder: 'Full property address', wide: true },
    { key: 'applicant', label: 'Applicant Name', placeholder: 'Full legal name of C of O applicant' },
    { key: 'currentStage', label: 'Current Stage', type: 'select', options: COO_STAGES.map(s => ({ value: s.id, label: s.label })) },
    { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Survey plan number, outstanding fees, registry contact, etc.' },
  ];

  const handleUpdate = useCallback((rec) => {
    if (rec._editMode) { setForm({ ...rec }); setEditId(rec.id); setShowModal(true); return; }
    updateStage(rec);
  }, [data.cOfO]);

  return (
    <StageTracker
      title="C of O Tracker" subtitle="Monitor Certificate of Occupancy applications"
      icon={FileText} gradient="from-violet-400 to-fuchsia-500"
      records={data.cOfO} stages={COO_STAGES}
      onAdd={openAdd} onUpdate={handleUpdate} onDelete={del}
      showModal={showModal} setShowModal={setShowModal}
      form={form} setForm={setForm} saveRecord={save}
      modalTitle={editId ? 'Edit C of O Application' : 'New C of O Application'}
      formFields={formFields} showToast={showToast}
    />
  );
}

// ── Deed of Assignment Tab ────────────────────────────────────────────────────
function DeedAssignmentTab({ data, onUpdate, showToast, profile }) {
  const ai = useAiRun('deed-assignment');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [draftInput, setDraftInput] = useState('');

  const blankForm = () => ({
    title: '', propertyAddr: '', vendor: '', purchaser: '',
    consideration: '', transactionDate: '', surveyNo: '',
    notes: '',
    preChecklist: DEED_PRE_CHECKLIST.map(() => false),
    draftingChecklist: DEED_DRAFTING_CHECKLIST.map(() => false),
    postChecklist: DEED_POST_CHECKLIST.map(() => false),
  });

  const openAdd = () => { setForm(blankForm()); setEditId(null); setShowModal(true); };

  const save = () => {
    if (!form.title?.trim() || !form.vendor?.trim() || !form.purchaser?.trim()) {
      showToast('warning', 'Title, vendor and purchaser are required.'); return;
    }
    let list;
    if (editId) {
      list = data.deedAssignment.map(r => r.id === editId ? { ...form, id: editId } : r);
    } else {
      list = [...data.deedAssignment, { ...form, id: generateId(), createdAt: new Date().toISOString() }];
    }
    onUpdate({ deedAssignment: list });
    showToast('success', editId ? 'Deed record updated.' : 'Deed record added.');
    setShowModal(false);
  };

  const toggleCheck = (recId, section, idx) => {
    const list = data.deedAssignment.map(r => {
      if (r.id !== recId) return r;
      const updated = [...(r[section] || [])];
      updated[idx] = !updated[idx];
      return { ...r, [section]: updated };
    });
    onUpdate({ deedAssignment: list });
  };

  const del = (id) => { onUpdate({ deedAssignment: data.deedAssignment.filter(r => r.id !== id) }); showToast('success', 'Record deleted.'); };

  const runDraft = () => {
    if (!draftInput.trim()) { showToast('warning', 'Describe the transaction before generating a draft.'); return; }
    ai.run({
      systemInstruction:
        'You are a senior Nigerian conveyancing lawyer. Draft a complete, court-ready Deed of Assignment in correct Nigerian form. Include: proper heading, parties, recitals, consideration, description of property, operative words of assignment, covenants, indemnity clause, conditions, testimonium, attestation and execution blocks. Use [PLACEHOLDER] for any information not supplied. The deed must be suitable for submission to the Land Registry.',
      userText: `Draft a Deed of Assignment for the following transaction:\n\n${draftInput}\n\nApply all relevant provisions of the Land Use Act 1978, the Conveyancing Act (as applicable), and current Nigerian land law practice.`,
      mode: 'comprehensive',
      webGrounding: false,
    });
  };

  const sorted = useMemo(() => [...data.deedAssignment].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [data.deedAssignment]);

  const checklistProgress = (rec, section, items) => {
    const checks = rec[section] || [];
    const done = checks.filter(Boolean).length;
    return { done, total: items.length, pct: Math.round((done / items.length) * 100) };
  };

  return (
    <div className="space-y-4">
      {/* AI Drafter */}
      <Card variant="glass" className="space-y-3">
        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-500" /> AI Deed Drafter
        </h3>
        <p className="text-sm text-slate-500">Describe the land transaction and generate a court-ready Deed of Assignment draft.</p>
        <Textarea rows={4} value={draftInput} onChange={e => setDraftInput(e.target.value)}
          placeholder="e.g. Sale of 1,000 sq metres of land at Plot 12, Block D, Lekki Phase 1, Lagos. Vendor: Chief Emeka Obi (individual). Purchaser: Adaeze Investments Ltd (company). Consideration: ₦85,000,000. Property has a C of O No. LC/LA/5678/2003. Survey Plan No. LSG/1234/2021. Parties have agreed to all conditions as in the SPA dated 10 January 2024." />
        <div className="flex gap-2">
          {ai.running ? (
            <Button variant="danger" onClick={ai.stop} leftIcon={<Square className="w-4 h-4" />}>Stop</Button>
          ) : (
            <Button onClick={runDraft} leftIcon={<Sparkles className="w-4 h-4" />}>Generate Draft</Button>
          )}
        </div>
        <AiResult ai={ai} title="Draft Deed of Assignment" exportTitle="Deed of Assignment Draft" />
      </Card>

      {/* Records list */}
      <Card variant="glass">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-emerald-500" /> Deed Checklists
          </h3>
          <Button size="sm" onClick={openAdd} leftIcon={<Plus className="w-4 h-4" />}>New Deed</Button>
        </div>

        {sorted.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="No deed records" description="Create a deed record to track the checklist for each transaction." action={{ label: 'New Deed Record', onClick: openAdd }} />
        ) : (
          <div className="space-y-3">
            {sorted.map(rec => {
              const pre = checklistProgress(rec, 'preChecklist', DEED_PRE_CHECKLIST);
              const draft = checklistProgress(rec, 'draftingChecklist', DEED_DRAFTING_CHECKLIST);
              const post = checklistProgress(rec, 'postChecklist', DEED_POST_CHECKLIST);
              const totalDone = pre.done + draft.done + post.done;
              const totalItems = pre.total + draft.total + post.total;
              const overallPct = Math.round((totalDone / totalItems) * 100);
              const isExpanded = expandedId === rec.id;

              return (
                <Card key={rec.id} variant="flat" className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">{rec.title}</p>
                      <div className="flex flex-wrap gap-2 mt-1 text-xs text-slate-500">
                        {rec.vendor && <span>Vendor: {rec.vendor}</span>}
                        {rec.purchaser && <span>Purchaser: {rec.purchaser}</span>}
                        {rec.consideration && <span>₦{Number(rec.consideration).toLocaleString()}</span>}
                      </div>
                      {rec.propertyAddr && <p className="text-xs text-slate-400 mt-0.5">{rec.propertyAddr}</p>}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Badge variant={overallPct >= 100 ? 'success' : overallPct >= 60 ? 'warning' : 'danger'}>{overallPct}%</Badge>
                      <button onClick={() => { setForm({ ...rec }); setEditId(rec.id); setShowModal(true); }} className="p-1 text-slate-400 hover:text-blue-500"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => del(rec.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      <button onClick={() => setExpandedId(isExpanded ? null : rec.id)} className="p-1 text-slate-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Mini progress */}
                  <div className="grid grid-cols-3 gap-2 text-xs text-center">
                    {[{ label: 'Pre-Drafting', p: pre }, { label: 'Drafting', p: draft }, { label: 'Post-Execution', p: post }].map(s => (
                      <div key={s.label}>
                        <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mb-1">
                          <div className={cn('h-full rounded-full', s.p.pct >= 100 ? 'bg-emerald-500' : 'bg-blue-500')} style={{ width: `${s.p.pct}%` }} />
                        </div>
                        <span className="text-slate-400">{s.label}: {s.p.done}/{s.p.total}</span>
                      </div>
                    ))}
                  </div>

                  {/* Expanded checklists */}
                  {isExpanded && (
                    <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                      {[
                        { key: 'preChecklist', label: 'Pre-Drafting Checklist', items: DEED_PRE_CHECKLIST },
                        { key: 'draftingChecklist', label: 'Drafting Checklist', items: DEED_DRAFTING_CHECKLIST },
                        { key: 'postChecklist', label: 'Post-Execution Checklist', items: DEED_POST_CHECKLIST },
                      ].map(section => (
                        <div key={section.key}>
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">{section.label}</p>
                          <div className="space-y-1.5">
                            {section.items.map((item, idx) => {
                              const checked = (rec[section.key] || [])[idx] || false;
                              return (
                                <button key={idx} onClick={() => toggleCheck(rec.id, section.key, idx)}
                                  className={cn('w-full flex items-start gap-2.5 text-left text-sm p-2 rounded-lg transition-colors',
                                    checked ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                  )}>
                                  {checked ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" /> : <Circle className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-300 dark:text-slate-600" />}
                                  <span className={checked ? 'line-through opacity-70' : ''}>{item}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editId ? 'Edit Deed Record' : 'New Deed of Assignment Record'} size="lg">
        <div className="space-y-3">
          <Input label="Matter / Transaction Title *" value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Assignment: Obi → Adaeze, Plot 12 Lekki" />
          <Textarea label="Property Description" rows={2} value={form.propertyAddr || ''} onChange={e => setForm(f => ({ ...f, propertyAddr: e.target.value }))} placeholder="Full address and description of the land" />
          <div className="grid sm:grid-cols-2 gap-3">
            <Input label="Vendor (Assignor) *" value={form.vendor || ''} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} />
            <Input label="Purchaser (Assignee) *" value={form.purchaser || ''} onChange={e => setForm(f => ({ ...f, purchaser: e.target.value }))} />
            <Input label="Consideration (₦)" type="number" value={form.consideration || ''} onChange={e => setForm(f => ({ ...f, consideration: e.target.value }))} />
            <Input label="Transaction Date" type="date" value={form.transactionDate || ''} onChange={e => setForm(f => ({ ...f, transactionDate: e.target.value }))} />
            <Input label="Survey Plan Number" value={form.surveyNo || ''} onChange={e => setForm(f => ({ ...f, surveyNo: e.target.value }))} />
          </div>
          <Textarea label="Notes" rows={2} value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="C of O details, encumbrances, special conditions, etc." />
          <div className="flex justify-end gap-2 pt-2">
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
  { id: 'stamp',    label: 'Stamp Duty',         icon: Calculator    },
  { id: 'consent',  label: "Gov't Consent",       icon: Key           },
  { id: 'search',   label: 'Title Search',         icon: Search        },
  { id: 'coo',      label: 'C of O',               icon: FileText      },
  { id: 'deed',     label: 'Deed of Assignment',   icon: ClipboardCheck},
];

export function LandTransactions() {
  const { showToast, audit, profile } = useApp();
  const [data, setData] = useState(loadData);
  const [tab, setTab] = useState('stamp');

  const onUpdate = useCallback((patch) => {
    const next = { ...data, ...patch };
    setData(next);
    saveData(next);
    audit('SETTINGS_UPDATE', 'land-transactions');
  }, [data, audit]);

  return (
    <div className="space-y-6">
      <PageHeader icon={Building2} title="Land Transactions" subtitle="Stamp duty · Governor's consent · Title search · C of O · Deed of Assignment" gradient="from-amber-400 to-orange-500" />

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

      {tab === 'stamp'   && <StampDutyTab />}
      {tab === 'consent' && <GovConsentTab   data={data} onUpdate={onUpdate} showToast={showToast} />}
      {tab === 'search'  && <TitleSearchTab  data={data} onUpdate={onUpdate} showToast={showToast} />}
      {tab === 'coo'     && <CofOTab         data={data} onUpdate={onUpdate} showToast={showToast} />}
      {tab === 'deed'    && <DeedAssignmentTab data={data} onUpdate={onUpdate} showToast={showToast} profile={profile} />}
    </div>
  );
}
