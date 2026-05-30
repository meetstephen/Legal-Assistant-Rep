// ============================================================
// lexi/pages/FeeCalculator.jsx — fee scales + time & billing
// ============================================================

import React, { useState, useMemo } from 'react';
import { Calculator, Plus, Trash2, Clock, Receipt, DollarSign } from 'lucide-react';
import { useApp } from '../AppContext.jsx';
import { Card, Button, Input, Select, Textarea, EmptyState, PageHeader } from '../components/ui.jsx';
import { computeProfessionalFee, conveyancingFee } from '../helpers.js';
import { formatCurrency, formatDate, todayISO, cn } from '../utils.js';

export function FeeCalculator() {
  const { profile, clients, cases, timeEntries, addTimeEntry, deleteTimeEntry, getClientName, showToast } = useApp();
  const [tab, setTab] = useState('calc');
  const cur = profile.currency || '₦';

  // professional fee
  const [base, setBase] = useState('');
  const fee = useMemo(() => computeProfessionalFee({ base: Number(base) || 0, vatRate: profile.vatRate, whtRate: profile.whtRate }), [base, profile]);

  // conveyancing
  const [consideration, setConsideration] = useState('');
  const conv = useMemo(() => conveyancingFee(Number(consideration) || 0), [consideration]);

  // time entry
  const [form, setForm] = useState({ clientId: '', caseId: '', description: '', hours: '', rate: String(profile.hourlyRate || 50000), date: todayISO() });
  const totalBillable = useMemo(() => timeEntries.reduce((s, e) => s + e.amount, 0), [timeEntries]);
  const totalHours = useMemo(() => timeEntries.reduce((s, e) => s + Number(e.hours), 0), [timeEntries]);

  const logTime = () => {
    if (!form.clientId || !form.description.trim() || !(Number(form.hours) > 0)) {
      showToast('warning', 'Client, description and valid hours are required.');
      return;
    }
    addTimeEntry({ ...form, hours: Number(form.hours), rate: Number(form.rate) });
    showToast('success', 'Time logged.');
    setForm({ ...form, description: '', hours: '' });
  };

  return (
    <div className="space-y-6">
      <PageHeader icon={Calculator} title="Fee Calculator" subtitle="Professional fees, conveyancing scale, and time-based billing" gradient="from-green-400 to-emerald-500" />

      <div className="flex gap-2">
        {[{ id: 'calc', label: 'Fee Calculators' }, { id: 'time', label: 'Time & Billing' }].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('px-4 py-2 rounded-lg text-sm font-medium', tab === t.id ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300')}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'calc' && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card variant="glass" className="space-y-3">
            <h3 className="font-semibold text-slate-900 dark:text-white">Professional fee (VAT / WHT)</h3>
            <Input label={`Base fee (${cur})`} type="number" value={base} onChange={(e) => setBase(e.target.value)} placeholder="500000" />
            <div className="text-sm space-y-1.5">
              <Row label={`Base`} value={formatCurrency(fee.base, cur)} />
              <Row label={`VAT (${profile.vatRate}%)`} value={formatCurrency(fee.vat, cur)} />
              <Row label="Total invoice (incl. VAT)" value={formatCurrency(fee.totalPayableInclVat, cur)} strong />
              <Row label={`WHT (${profile.whtRate}%) deducted at source`} value={`- ${formatCurrency(fee.wht, cur)}`} />
              <Row label="Net to firm (after WHT)" value={formatCurrency(fee.netAfterWht, cur)} strong />
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400">Rates from Firm Admin Settings. Confirm current VAT/WHT and whether the client is obliged to deduct WHT.</p>
          </Card>

          <Card variant="glass" className="space-y-3">
            <h3 className="font-semibold text-slate-900 dark:text-white">Conveyancing scale (illustrative)</h3>
            <Input label={`Consideration / property value (${cur})`} type="number" value={consideration} onChange={(e) => setConsideration(e.target.value)} placeholder="25000000" />
            <div className="text-sm space-y-1.5">
              <Row label="Applicable rate" value={`${conv.rate}%`} />
              <Row label="Estimated professional fee" value={formatCurrency(conv.fee, cur)} strong />
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400">Illustrative tiers — confirm against the applicable Legal Practitioners (Remuneration for Legal Documentation and Other Land Matters) scale.</p>
          </Card>
        </div>
      )}

      {tab === 'time' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white border-0">
              <div className="flex items-center justify-between"><span className="text-sm opacity-90">Total billable</span><DollarSign className="w-5 h-5 opacity-80" /></div>
              <div className="text-2xl font-bold mt-1">{formatCurrency(totalBillable, cur)}</div>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white border-0">
              <div className="flex items-center justify-between"><span className="text-sm opacity-90">Hours logged</span><Clock className="w-5 h-5 opacity-80" /></div>
              <div className="text-2xl font-bold mt-1">{totalHours.toFixed(1)}</div>
            </Card>
            <Card className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white border-0">
              <div className="flex items-center justify-between"><span className="text-sm opacity-90">Entries</span><Receipt className="w-5 h-5 opacity-80" /></div>
              <div className="text-2xl font-bold mt-1">{timeEntries.length}</div>
            </Card>
          </div>

          <Card variant="glass" className="space-y-3">
            <h3 className="font-semibold text-slate-900 dark:text-white">Log time</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <Select label="Client" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                options={[{ value: '', label: 'Select client' }, ...clients.map((c) => ({ value: c.id, label: c.name }))]} />
              <Select label="Case (optional)" value={form.caseId} onChange={(e) => setForm({ ...form, caseId: e.target.value })}
                options={[{ value: '', label: 'None' }, ...cases.map((c) => ({ value: c.id, label: c.title }))]} />
              <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              <Input label="Hours" type="number" step="0.25" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} placeholder="2.5" />
              <Input label={`Rate (${cur})`} type="number" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
              <div className="flex items-end"><div className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 font-semibold">{formatCurrency((Number(form.hours) || 0) * (Number(form.rate) || 0), cur)}</div></div>
            </div>
            <Textarea label="Description" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Button onClick={logTime} leftIcon={<Plus className="w-4 h-4" />}>Log time</Button>
          </Card>

          <Card variant="glass">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Time entries</h3>
            {timeEntries.length === 0 ? (
              <EmptyState icon={Clock} title="No time entries" description="Log billable hours to build invoices." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700">
                    <tr><th className="py-2">Date</th><th>Client</th><th>Description</th><th className="text-right">Hours</th><th className="text-right">Amount</th><th /></tr>
                  </thead>
                  <tbody>
                    {[...timeEntries].reverse().map((e) => (
                      <tr key={e.id} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="py-2">{formatDate(e.date)}</td>
                        <td>{getClientName(e.clientId)}</td>
                        <td className="text-slate-500">{e.description.length > 40 ? `${e.description.slice(0, 40)}…` : e.description}</td>
                        <td className="text-right">{e.hours}h</td>
                        <td className="text-right font-semibold">{formatCurrency(e.amount, cur)}</td>
                        <td className="text-right"><button onClick={() => deleteTimeEntry(e.id)} className="text-red-500 p-1"><Trash2 className="w-4 h-4" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={strong ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}>{value}</span>
    </div>
  );
}
