// ============================================================
// lexi/pages/Clients.jsx — Client records
// ============================================================

import React, { useState } from 'react';
import { Users, Plus, Trash2, Mail, Phone, MapPin } from 'lucide-react';
import { useApp } from '../AppContext.jsx';
import { Card, Button, Input, Textarea, Select, Badge, Modal, EmptyState, PageHeader } from '../components/ui.jsx';
import { formatCurrency } from '../utils.js';

const TYPES = ['individual', 'corporate', 'government'];

export function Clients() {
  const { clients, addClient, deleteClient, cases, timeEntries, showToast } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', type: 'individual', notes: '' });
  const [errors, setErrors] = useState({});

  const submit = () => {
    if (!form.name.trim()) { setErrors({ name: 'Required' }); return; }
    addClient(form);
    showToast('success', 'Client added.');
    setShowModal(false);
    setForm({ name: '', email: '', phone: '', address: '', type: 'individual', notes: '' });
    setErrors({});
  };

  const billable = (id) => timeEntries.filter((e) => e.clientId === id).reduce((s, e) => s + e.amount, 0);
  const caseCount = (id) => cases.filter((c) => c.clientId === id).length;

  return (
    <div className="space-y-6">
      <PageHeader icon={Users} title="Clients" subtitle={`${clients.length} client record(s)`} gradient="from-blue-400 to-indigo-500">
        <Button onClick={() => setShowModal(true)} leftIcon={<Plus className="w-4 h-4" />}>Add client</Button>
      </PageHeader>

      {clients.length === 0 ? (
        <EmptyState icon={Users} title="No clients yet" description="Add client records and link them to cases and billing." action={{ label: 'Add client', onClick: () => setShowModal(true), icon: <Plus className="w-4 h-4" /> }} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {clients.map((c) => (
            <Card key={c.id} variant="glass">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{c.name}</h3>
                  <Badge variant="info" className="capitalize mt-1">{c.type}</Badge>
                </div>
                <button onClick={() => { if (window.confirm('Delete client?')) deleteClient(c.id); }} className="text-red-500 p-1"><Trash2 className="w-5 h-5" /></button>
              </div>
              <div className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
                {c.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4" /> {c.email}</div>}
                {c.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> {c.phone}</div>}
                {c.address && <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {c.address}</div>}
              </div>
              <div className="grid grid-cols-2 gap-3 border-t border-slate-200 dark:border-slate-700 mt-3 pt-3 text-center">
                <div><div className="text-xl font-bold text-emerald-600">{caseCount(c.id)}</div><div className="text-xs text-slate-400">Cases</div></div>
                <div><div className="text-xl font-bold text-violet-600">{formatCurrency(billable(c.id))}</div><div className="text-xs text-slate-400">Billable</div></div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add client" size="lg">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Client name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
            <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} options={TYPES.map((t) => ({ value: t, label: t }))} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+234…" />
          </div>
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <Textarea label="Notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={submit}>Save client</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
