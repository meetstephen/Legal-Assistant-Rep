// ============================================================
// lexi/pages/Admin.jsx — Firm Admin Settings (admin only)
// ============================================================

import React, { useState } from 'react';
import { Shield, Save, Plus, BadgeCheck } from 'lucide-react';
import { useApp } from '../AppContext.jsx';
import { storage, STORAGE_KEYS } from '../database.js';
import { registerVerifiedCases, VERIFIED_CASES } from '../citations.js';
import { MODELS } from '../ai.js';
import { Card, Button, Input, Select, Toggle, PageHeader } from '../components/ui.jsx';
import { formatCurrency, cn } from '../utils.js';
import { computeProfessionalFee } from '../helpers.js';
import { JURISDICTIONS } from '../legalData.js';

export function Admin() {
  const { profile, setProfile, showToast, audit } = useApp();
  const [f, setF] = useState(profile);
  const [allowed, setAllowed] = useState(profile.allowedModels || MODELS.map((m) => m.id));
  const preview = computeProfessionalFee({ base: 500000, vatRate: Number(f.vatRate) || 0, whtRate: Number(f.whtRate) || 0 });

  const save = () => {
    setProfile({ ...f, allowedModels: allowed, hourlyRate: Number(f.hourlyRate), vatRate: Number(f.vatRate), whtRate: Number(f.whtRate), monthlyAiBudget: Number(f.monthlyAiBudget), aiPerMinute: Number(f.aiPerMinute), aiPerDay: Number(f.aiPerDay) });
    audit('SETTINGS_UPDATE', 'firm-admin');
    showToast('success', 'Firm settings saved.');
  };

  const toggleModel = (id) => setAllowed((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));

  // verified case add
  const [vc, setVc] = useState({ name: '', citation: '', court: 'Supreme Court', category: '', holding: '' });
  const addCase = () => {
    if (!vc.name.trim() || !vc.citation.trim()) { showToast('warning', 'Case name and citation are required.'); return; }
    const stored = storage.get(STORAGE_KEYS.ADMIN_CASES, []);
    const next = [...stored, vc];
    storage.set(STORAGE_KEYS.ADMIN_CASES, next);
    registerVerifiedCases([vc]);
    audit('SETTINGS_UPDATE', 'verified-case-add');
    showToast('success', 'Verified case added — it now loads into every session.');
    setVc({ name: '', citation: '', court: 'Supreme Court', category: '', holding: '' });
  };

  return (
    <div className="space-y-6">
      <PageHeader icon={Shield} title="Firm Admin Settings" subtitle="Billing defaults, jurisdiction, AI budget, permissions, verified cases" gradient="from-slate-600 to-slate-800" />

      <Card variant="glass" className="space-y-4">
        <h3 className="font-semibold text-slate-900 dark:text-white">Billing defaults</h3>
        <div className="grid sm:grid-cols-4 gap-4">
          <Input label="Hourly rate" type="number" value={f.hourlyRate} onChange={(e) => setF({ ...f, hourlyRate: e.target.value })} />
          <Input label="Currency" value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })} />
          <Input label="VAT %" type="number" value={f.vatRate} onChange={(e) => setF({ ...f, vatRate: e.target.value })} />
          <Input label="WHT %" type="number" value={f.whtRate} onChange={(e) => setF({ ...f, whtRate: e.target.value })} />
        </div>
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 text-sm text-slate-500">
          Live preview on {formatCurrency(500000, f.currency)}: invoice {formatCurrency(preview.totalPayableInclVat, f.currency)} (incl. VAT), net after WHT {formatCurrency(preview.netAfterWht, f.currency)}.
        </div>
      </Card>

      <Card variant="glass" className="space-y-4">
        <h3 className="font-semibold text-slate-900 dark:text-white">Defaults & AI budget</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <Input label="Default court" value={f.defaultCourt} onChange={(e) => setF({ ...f, defaultCourt: e.target.value })} />
          <Select label="Default jurisdiction" value={f.defaultJurisdiction} onChange={(e) => setF({ ...f, defaultJurisdiction: e.target.value })} options={JURISDICTIONS.map((j) => ({ value: j, label: j }))} />
          <Input label="Monthly AI budget (USD)" type="number" value={f.monthlyAiBudget} onChange={(e) => setF({ ...f, monthlyAiBudget: e.target.value })} />
          <Input label="AI calls / minute" type="number" value={f.aiPerMinute} onChange={(e) => setF({ ...f, aiPerMinute: e.target.value })} />
          <Input label="AI calls / day" type="number" value={f.aiPerDay} onChange={(e) => setF({ ...f, aiPerDay: e.target.value })} />
        </div>
        <p className="text-xs text-slate-400">Rate limits cap AI calls to protect your Gemini quota/spend. They apply per device (and per user when cloud login is enabled).</p>
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Allowed models</p>
          <div className="flex flex-wrap gap-2">
            {MODELS.map((m) => (
              <button key={m.id} onClick={() => toggleModel(m.id)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border', allowed.includes(m.id) ? 'bg-emerald-500 text-white border-emerald-500' : 'border-slate-300 dark:border-slate-600 text-slate-500')}>
                {m.id}
              </button>
            ))}
          </div>
        </div>
        <Toggle checked={!!f.isAdmin} onChange={(v) => setF({ ...f, isAdmin: v })} label="This account has admin rights" hint="Controls visibility of Admin & Audit Log" />
        <Button onClick={save} leftIcon={<Save className="w-4 h-4" />}>Save firm settings</Button>
      </Card>

      <Card variant="glass" className="space-y-4">
        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-emerald-500" /> Verified case database</h3>
        <p className="text-sm text-slate-500">{VERIFIED_CASES.length} cases currently loaded. Add a verified case to extend the citation-audit database (persists locally and reloads each session).</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Case name" value={vc.name} onChange={(e) => setVc({ ...vc, name: e.target.value })} placeholder="X v Y" />
          <Input label="Citation" value={vc.citation} onChange={(e) => setVc({ ...vc, citation: e.target.value })} placeholder="(2020) 1 NWLR (Pt 1234) 1" />
          <Select label="Court" value={vc.court} onChange={(e) => setVc({ ...vc, court: e.target.value })} options={['Supreme Court', 'Court of Appeal', 'Federal High Court', 'High Court', 'National Industrial Court'].map((c) => ({ value: c, label: c }))} />
          <Input label="Category" value={vc.category} onChange={(e) => setVc({ ...vc, category: e.target.value })} placeholder="Contract / Land …" />
        </div>
        <Input label="Holding (short)" value={vc.holding} onChange={(e) => setVc({ ...vc, holding: e.target.value })} />
        <Button variant="outline" onClick={addCase} leftIcon={<Plus className="w-4 h-4" />}>Add verified case</Button>
      </Card>
    </div>
  );
}
