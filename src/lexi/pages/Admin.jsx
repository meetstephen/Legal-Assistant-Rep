// ============================================================
// lexi/pages/Admin.jsx — Firm Admin Settings (admin only)
// ============================================================

import React, { useState, useMemo, useEffect } from 'react';
import { Shield, Save, Plus, BadgeCheck, UserX, UserCheck, RotateCcw, Trash2, Star, MessageSquarePlus, KeyRound } from 'lucide-react';
import { useApp } from '../AppContext.jsx';
import { storage, STORAGE_KEYS } from '../database.js';
import { registerVerifiedCases, VERIFIED_CASES } from '../citations.js';
import { MODELS } from '../ai.js';
import { Card, Button, Input, Select, Toggle, PageHeader, Badge, Modal, EmptyState, PasswordInput } from '../components/ui.jsx';
import { formatCurrency, formatDateTime, generateId, cn } from '../utils.js';
import { computeProfessionalFee } from '../helpers.js';
import { JURISDICTIONS } from '../legalData.js';
import { SUPABASE_ENABLED } from '../runtime.js';

// ---- Admin user seed data ----
const SEED_ADMIN = {
  id: 'admin-seed-001',
  email: 'oyimstephenesq@gmail.com',
  name: 'Oyim Stephen Esq.',
  role: 'admin',
  status: 'active',
  lastLogin: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  canRemove: false,
  passwordResetPending: false,
};

function getAdminUsers() {
  const users = storage.get(STORAGE_KEYS.ADMIN_USERS, null);
  if (!users || !Array.isArray(users) || users.length === 0) {
    storage.set(STORAGE_KEYS.ADMIN_USERS, [SEED_ADMIN]);
    return [SEED_ADMIN];
  }
  // Ensure seed admin always exists
  if (!users.find((u) => u.id === SEED_ADMIN.id)) {
    const updated = [SEED_ADMIN, ...users];
    storage.set(STORAGE_KEYS.ADMIN_USERS, updated);
    return updated;
  }
  return users;
}

function isOnline(lastLogin) {
  if (!lastLogin) return false;
  const diff = Date.now() - new Date(lastLogin).getTime();
  return diff < 5 * 60 * 1000; // within 5 minutes
}

// ---- Tabs ----
const TABS = [
  { id: 'settings', label: 'Settings' },
  { id: 'users', label: 'Users' },
  { id: 'cases', label: 'Verified Cases' },
  { id: 'feedback', label: 'Feedback' },
];

// ---- Users Tab ----
function UsersTab({ showToast, audit }) {
  const { supabaseEnabled, requestPasswordReset, setPasscode } = useApp();
  const [users, setUsers] = useState(getAdminUsers);
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', role: 'lawyer', name: '' });
  const [resetTarget, setResetTarget] = useState(null);
  const [newPin, setNewPin] = useState('');
  const [resetBusy, setResetBusy] = useState(false);

  const saveUsers = (list) => {
    setUsers(list);
    storage.set(STORAGE_KEYS.ADMIN_USERS, list);
  };

  const addUser = () => {
    if (!newUser.email.trim()) {
      showToast('warning', 'Email is required.');
      return;
    }
    if (users.find((u) => u.email.toLowerCase() === newUser.email.toLowerCase().trim())) {
      showToast('warning', 'A user with this email already exists.');
      return;
    }
    const entry = {
      id: generateId(),
      email: newUser.email.trim().toLowerCase(),
      name: newUser.name.trim() || newUser.email.split('@')[0],
      role: newUser.role,
      status: 'active',
      lastLogin: null,
      createdAt: new Date().toISOString(),
      canRemove: true,
      passwordResetPending: false,
    };
    saveUsers([...users, entry]);
    audit('USER_ADD', entry.email);
    showToast('success', `User ${entry.email} added.`);
    setNewUser({ email: '', role: 'lawyer', name: '' });
    setShowAdd(false);
  };

  const toggleStatus = (id) => {
    const updated = users.map((u) => {
      if (u.id === id) {
        const next = u.status === 'active' ? 'suspended' : 'active';
        audit('USER_STATUS', `${u.email} → ${next}`);
        showToast('success', `${u.email} is now ${next}.`);
        return { ...u, status: next };
      }
      return u;
    });
    saveUsers(updated);
  };

  const resetPassword = (id) => {
    const target = users.find((u) => u.id === id);
    if (target) { setResetTarget(target); setNewPin(''); }
  };

  // Cloud mode: send the user a real Supabase password-reset email.
  const sendResetEmail = async () => {
    if (!resetTarget) return;
    setResetBusy(true);
    try {
      await requestPasswordReset(resetTarget.email);
      saveUsers(users.map((u) => (u.id === resetTarget.id ? { ...u, passwordResetPending: true } : u)));
      audit('USER_PASSWORD_RESET', `email sent: ${resetTarget.email}`);
      showToast('success', `Password-reset email sent to ${resetTarget.email}.`);
      setResetTarget(null);
    } catch (e) {
      showToast('error', e.message || 'Could not send reset email.');
    } finally {
      setResetBusy(false);
    }
  };

  // Local mode: set the device passcode (the real local credential).
  const setLocalPasscode = async () => {
    if (newPin.length < 4) { showToast('warning', 'Use at least 4 characters.'); return; }
    setResetBusy(true);
    try {
      await setPasscode(newPin);
      saveUsers(users.map((u) => (u.id === resetTarget.id ? { ...u, passwordResetPending: false } : u)));
      audit('USER_PASSWORD_RESET', `device passcode reset (${resetTarget.email})`);
      showToast('success', 'Device passcode has been reset.');
      setResetTarget(null);
      setNewPin('');
    } finally {
      setResetBusy(false);
    }
  };

  const removeUser = (id) => {
    const target = users.find((u) => u.id === id);
    if (!target || !target.canRemove) return;
    const updated = users.filter((u) => u.id !== id);
    saveUsers(updated);
    audit('USER_REMOVE', target.email);
    showToast('success', `${target.email} removed.`);
  };

  return (
    <div className="space-y-4">
      {SUPABASE_ENABLED && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-200">
          <strong>Note:</strong> For full user management, use the Supabase Dashboard.
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 dark:text-white">
          Registered Users ({users.length})
        </h3>
        <Button variant="outline" size="sm" onClick={() => setShowAdd(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Add User
        </Button>
      </div>

      <div className="space-y-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-slate-900 dark:text-white">{user.name || user.email}</span>
                  <Badge variant={user.role === 'admin' ? 'violet' : 'info'}>{user.role}</Badge>
                  <Badge variant={user.status === 'active' ? 'success' : 'danger'}>{user.status}</Badge>
                  {isOnline(user.lastLogin) && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Online
                    </span>
                  )}
                  {user.passwordResetPending && (
                    <Badge variant="warning">Reset pending</Badge>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{user.email}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Last login: {user.lastLogin ? formatDateTime(user.lastLogin) : 'Never'}
                  {!user.canRemove && ' · Cannot be removed'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleStatus(user.id)}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    user.status === 'active'
                      ? 'hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-400 hover:text-amber-500'
                      : 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-500'
                  )}
                  title={user.status === 'active' ? 'Suspend user' : 'Activate user'}
                >
                  {user.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => resetPassword(user.id)}
                  className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-500 transition-colors"
                  title="Reset password"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                {user.canRemove && (
                  <button
                    onClick={() => removeUser(user.id)}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
                    title="Remove user"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add New User">
        <div className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            placeholder="user@example.com"
          />
          <Input
            label="Display name"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            placeholder="Full name"
          />
          <Select
            label="Role"
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            options={[
              { value: 'lawyer', label: 'Lawyer' },
              { value: 'admin', label: 'Admin' },
            ]}
          />
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={addUser} leftIcon={<Plus className="w-4 h-4" />}>Add User</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!resetTarget} onClose={() => setResetTarget(null)} title={`Reset password — ${resetTarget?.name || resetTarget?.email || ''}`}>
        {supabaseEnabled ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              This will email a secure password-reset link to <strong>{resetTarget?.email}</strong>. They set their own new password — you never see it.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setResetTarget(null)}>Cancel</Button>
              <Button onClick={sendResetEmail} isLoading={resetBusy} leftIcon={<RotateCcw className="w-4 h-4" />}>Send reset email</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-200">
              Local mode uses a single shared <strong>device passcode</strong> as the login credential. Setting it here resets access on this device for everyone. (For per-user passwords, enable Supabase cloud login.)
            </div>
            <PasswordInput label="New device passcode" inputMode="numeric" value={newPin} onChange={(e) => setNewPin(e.target.value)} placeholder="At least 4 characters" leftIcon={<KeyRound className="w-4 h-4" />} />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setResetTarget(null)}>Cancel</Button>
              <Button onClick={setLocalPasscode} isLoading={resetBusy} leftIcon={<RotateCcw className="w-4 h-4" />}>Set new passcode</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ---- Feedback Tab (Admin view — ALL feedback) ----
function FeedbackTab() {
  const feedbackList = useMemo(() => {
    const all = storage.get(STORAGE_KEYS.FEEDBACK, []);
    return [...all].reverse();
  }, []);

  const CATEGORIES = {
    'ai-quality': 'AI Quality',
    'usability': 'Usability',
    'features': 'Features',
    'bug-report': 'Bug Report',
    'other': 'Other',
  };

  const CATEGORY_VARIANTS = {
    'ai-quality': 'info',
    'usability': 'success',
    'features': 'violet',
    'bug-report': 'danger',
    'other': 'default',
  };

  if (feedbackList.length === 0) {
    return (
      <EmptyState
        icon={MessageSquarePlus}
        title="No feedback received"
        description="User feedback submissions will appear here."
      />
    );
  }

  const avgRating = feedbackList.length
    ? (feedbackList.reduce((acc, f) => acc + (f.rating || 0), 0) / feedbackList.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
            Avg: {avgRating}/5
          </span>
        </div>
        <span className="text-sm text-slate-500">{feedbackList.length} total submissions</span>
      </div>

      <div className="space-y-3">
        {feedbackList.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50"
          >
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={cn(
                      'w-4 h-4',
                      s <= (item.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'
                    )}
                  />
                ))}
              </div>
              <Badge variant={CATEGORY_VARIANTS[item.category] || 'default'}>
                {CATEGORIES[item.category] || item.category}
              </Badge>
              <span className="text-xs text-slate-400">{item.name || 'Anonymous'}</span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300">{item.message}</p>
            <p className="text-xs text-slate-400 mt-2">{formatDateTime(item.createdAt)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Settings Tab (original admin content) ----
function SettingsTab({ f, setF, allowed, toggleModel, preview, save }) {
  return (
    <div className="space-y-6">
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
    </div>
  );
}

// ---- Verified Cases Tab ----
function CasesTab({ showToast, audit }) {
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
    <Card variant="glass" className="space-y-4">
      <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-emerald-500" /> Verified case database</h3>
      <p className="text-sm text-slate-500">{VERIFIED_CASES.length} cases currently loaded. Add a verified case to extend the citation-audit database (persists locally and reloads each session).</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <Input label="Case name" value={vc.name} onChange={(e) => setVc({ ...vc, name: e.target.value })} placeholder="X v Y" />
        <Input label="Citation" value={vc.citation} onChange={(e) => setVc({ ...vc, citation: e.target.value })} placeholder="(2020) 1 NWLR (Pt 1234) 1" />
        <Select label="Court" value={vc.court} onChange={(e) => setVc({ ...vc, court: e.target.value })} options={['Supreme Court', 'Court of Appeal', 'Federal High Court', 'High Court', 'National Industrial Court'].map((c) => ({ value: c, label: c }))} />
        <Input label="Category" value={vc.category} onChange={(e) => setVc({ ...vc, category: e.target.value })} placeholder="Contract / Land ..." />
      </div>
      <Input label="Holding (short)" value={vc.holding} onChange={(e) => setVc({ ...vc, holding: e.target.value })} />
      <Button variant="outline" onClick={addCase} leftIcon={<Plus className="w-4 h-4" />}>Add verified case</Button>
    </Card>
  );
}

// ---- Main Admin Page ----
export function Admin() {
  const { profile, setProfile, showToast, audit } = useApp();
  const [activeTab, setActiveTab] = useState('settings');
  const [f, setF] = useState(profile);
  const [allowed, setAllowed] = useState(profile.allowedModels || MODELS.map((m) => m.id));
  const preview = computeProfessionalFee({ base: 500000, vatRate: Number(f.vatRate) || 0, whtRate: Number(f.whtRate) || 0 });

  const save = () => {
    setProfile({ ...f, allowedModels: allowed, hourlyRate: Number(f.hourlyRate), vatRate: Number(f.vatRate), whtRate: Number(f.whtRate), monthlyAiBudget: Number(f.monthlyAiBudget), aiPerMinute: Number(f.aiPerMinute), aiPerDay: Number(f.aiPerDay) });
    audit('SETTINGS_UPDATE', 'firm-admin');
    showToast('success', 'Firm settings saved.');
  };

  const toggleModel = (id) => setAllowed((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));

  // Update seed admin last login on mount
  useEffect(() => {
    const users = getAdminUsers();
    const updated = users.map((u) =>
      u.id === SEED_ADMIN.id ? { ...u, lastLogin: new Date().toISOString() } : u
    );
    storage.set(STORAGE_KEYS.ADMIN_USERS, updated);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader icon={Shield} title="Firm Admin Settings" subtitle="Billing, AI budget, user management, verified cases, feedback" gradient="from-slate-600 to-slate-800" />

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'settings' && (
        <SettingsTab f={f} setF={setF} allowed={allowed} toggleModel={toggleModel} preview={preview} save={save} />
      )}
      {activeTab === 'users' && (
        <Card variant="glass">
          <UsersTab showToast={showToast} audit={audit} />
        </Card>
      )}
      {activeTab === 'cases' && <CasesTab showToast={showToast} audit={audit} />}
      {activeTab === 'feedback' && (
        <Card variant="glass">
          <FeedbackTab />
        </Card>
      )}
    </div>
  );
}
