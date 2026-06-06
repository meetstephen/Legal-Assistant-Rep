// ============================================================
// lexi/pages/Profile.jsx
// Profile/Firm · AI Settings · Security · AI Usage · Notifications · Data
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  User, KeyRound, Cpu, Bell, Database, Save, Download, Upload, Trash2,
  Eye, EyeOff, BarChart3, Mail, Sun, Moon, LogOut, Cloud, CloudOff,
  Lock, ShieldCheck,
} from 'lucide-react';
import { useApp } from '../AppContext.jsx';
import { MODELS } from '../ai.js';
import { summariseUsage, toCsv } from '../helpers.js';
import { __version__ } from '../runtime.js';
import {
  Card, Button, Input, Textarea, Select, Badge, Toggle,
  PageHeader, PasswordInput,
} from '../components/ui.jsx';
import { formatDateTime, formatDate, downloadBlob, cn } from '../utils.js';

const TABS = [
  { id: 'firm',     label: 'Profile & Firm',  icon: User      },
  { id: 'settings', label: 'AI Settings',      icon: KeyRound  },
  { id: 'security', label: 'Security',          icon: Lock      },
  { id: 'usage',    label: 'AI Usage',          icon: BarChart3 },
  { id: 'notify',   label: 'Notifications',     icon: Bell      },
  { id: 'data',     label: 'Data',              icon: Database  },
];

const CLOUD_LABEL = {
  idle:    { text: 'Local only',      cls: 'text-slate-400'   },
  syncing: { text: 'Syncing…',        cls: 'text-amber-500'   },
  synced:  { text: 'Synced to cloud', cls: 'text-emerald-500' },
  error:   { text: 'Sync error',      cls: 'text-red-500'     },
};

// ---------------------------------------------------------------------------
function AccountCard() {
  const { supabaseEnabled, user, cloudStatus, signOut, lockEnabled, lockNow, profile, showToast } = useApp();

  if (supabaseEnabled) {
    const c = CLOUD_LABEL[cloudStatus] || CLOUD_LABEL.idle;
    return (
      <Card variant="glass" className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <User className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-white">{user?.email || 'Signed in'}</p>
            <p className={cn('text-xs flex items-center gap-1', c.cls)}>
              {cloudStatus === 'error'
                ? <CloudOff className="w-3.5 h-3.5" />
                : <Cloud className="w-3.5 h-3.5" />}
              {c.text}
            </p>
          </div>
        </div>
        <Button
          variant="secondary" size="sm"
          leftIcon={<LogOut className="w-4 h-4" />}
          onClick={async () => { await signOut(); showToast('info', 'Signed out.'); }}
        >
          Sign out
        </Button>
      </Card>
    );
  }

  if (lockEnabled) {
    return (
      <Card variant="glass" className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <User className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-white">
              {profile.lawyerName || 'Local workspace'}
            </p>
            <p className="text-xs text-slate-400">Tap Lock to sign out</p>
          </div>
        </div>
        <Button
          variant="secondary" size="sm"
          leftIcon={<Lock className="w-4 h-4" />}
          onClick={() => { lockNow(); showToast('info', 'Workspace locked.'); }}
        >
          Lock workspace
        </Button>
      </Card>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
export function Profile() {
  // Default to 'firm' so users land on their profile details, not the Security
  // tab (which previously showed an alarming "change passcode" banner even for
  // Supabase users who had already set their password).
  const [tab, setTab] = useState('firm');

  return (
    <div className="space-y-6">
      <PageHeader
        icon={User}
        title="Profile"
        subtitle="Firm details, AI settings, usage, notifications and data"
        gradient="from-slate-500 to-slate-700"
      />
      <AccountCard />
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap',
              tab === t.id
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            )}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>
      {tab === 'firm'     && <FirmTab />}
      {tab === 'settings' && <SettingsTab />}
      {tab === 'security' && <SecurityTab />}
      {tab === 'usage'    && <UsageTab />}
      {tab === 'notify'   && <NotifyTab />}
      {tab === 'data'     && <DataTab />}
    </div>
  );
}

// ---------------------------------------------------------------------------
function FirmTab() {
  const { profile, setProfile, showToast, audit } = useApp();
  const [f, setF] = useState(profile);
  const save = () => {
    setProfile(f);
    audit('SETTINGS_UPDATE', 'profile');
    showToast('success', 'Profile saved.');
  };
  return (
    <Card variant="glass" className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Firm name" value={f.firmName || ''}
          onChange={(e) => setF({ ...f, firmName: e.target.value })}
          placeholder="Chambers name" />
        <Input label="Lawyer name" value={f.lawyerName || ''}
          onChange={(e) => setF({ ...f, lawyerName: e.target.value })}
          placeholder="Counsel name, SAN/Esq." />
        <Input label="Email" value={f.email || ''}
          onChange={(e) => setF({ ...f, email: e.target.value })} />
        <Input label="Phone" value={f.phone || ''}
          onChange={(e) => setF({ ...f, phone: e.target.value })} />
      </div>
      <Input label="Address" value={f.address || ''}
        onChange={(e) => setF({ ...f, address: e.target.value })} />
      <Input
        label="Beta feedback email (optional)"
        value={f.feedbackEmail || ''}
        onChange={(e) => setF({ ...f, feedbackEmail: e.target.value })}
        placeholder="feedback@firm.com — where Help → Send feedback is addressed"
      />
      <Textarea
        label="Letterhead footer (appears on exports)"
        rows={2}
        value={f.letterheadFooter || ''}
        onChange={(e) => setF({ ...f, letterheadFooter: e.target.value })}
      />
      <Textarea
        label="Bank details (for invoices/exports)"
        rows={2}
        value={f.bankDetails || ''}
        onChange={(e) => setF({ ...f, bankDetails: e.target.value })}
      />
      <Button onClick={save} leftIcon={<Save className="w-4 h-4" />}>Save profile</Button>
    </Card>
  );
}

// ---------------------------------------------------------------------------
function SettingsTab() {
  const {
    apiKey, setApiKey, model, setModel, webGrounding, setWebGrounding,
    isDark, toggleTheme, showToast, audit, useProxy, isAdmin,
  } = useApp();
  const [key, setKey] = useState(apiKey);
  const [show, setShow] = useState(false);

  const saveKey = () => {
    setApiKey(key.trim());
    audit('SETTINGS_UPDATE', 'api-key');
    showToast('success', 'API key saved locally.');
  };

  return (
    <div className="space-y-4">
      {/* Server-key mode notice (admin) */}
      {useProxy && isAdmin && (
        <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20">
          <p className="text-sm text-emerald-800 dark:text-emerald-200">
            🔒 <strong>Server key mode is ON.</strong> You are the admin — all AI calls route
            through the secure server proxy using the key in Vercel environment variables.
            You do not need to enter a key here.
          </p>
        </Card>
      )}

      {/* Non-admin notice when proxy is active */}
      {useProxy && !isAdmin && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            ℹ️ Enter your own <strong>Google Gemini API key</strong> below to enable AI features.
            Your key is stored only in this browser and used directly with the Gemini API.
          </p>
        </Card>
      )}

      <Card variant="glass" className="space-y-3">
        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-emerald-500" /> Gemini API key
        </h3>
        <p className="text-sm text-slate-500">
          Stored only in this browser. Get a key from{' '}
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
            className="text-emerald-600 hover:underline">Google AI Studio</a>.
          For live grounding, enable Google Search grounding on the key.
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type={show ? 'text' : 'password'}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="AIza…"
              className="pr-10"
            />
            <button
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Button onClick={saveKey} leftIcon={<Save className="w-4 h-4" />}>Save</Button>
        </div>
        {apiKey && <Badge variant="success">Personal key configured</Badge>}
      </Card>

      <Card variant="glass" className="space-y-4">
        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-violet-500" /> Model &amp; defaults
        </h3>
        <Select
          label="Model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          options={MODELS.map((m) => ({ value: m.id, label: m.label }))}
        />
        <Toggle
          checked={webGrounding}
          onChange={setWebGrounding}
          label="Live web grounding by default (all AI features)"
          hint="Practice Updates, Research & citation verify go online regardless"
        />
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600 dark:text-slate-300">Theme</span>
          <Button variant="secondary" size="sm" onClick={toggleTheme}
            leftIcon={isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}>
            {isDark ? 'Light' : 'Dark'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
function SecurityTab() {
  const {
    supabaseEnabled, lockEnabled, setPasscode, clearPasscode,
    lockNow, changePassword, showToast,
  } = useApp();

  const [pin, setPin]   = useState('');
  const [pin2, setPin2] = useState('');
  const [pw, setPw]     = useState('');
  const [pw2, setPw2]   = useState('');
  const [busy, setBusy] = useState(false);

  // Detect bootstrap default passcode — only relevant in local (non-Supabase) mode.
  const isDefaultPasscode = !supabaseEnabled && (() => {
    try {
      const rec = JSON.parse(localStorage.getItem('lexi2:app-lock') || 'null');
      return rec?.isDefault === true;
    } catch { return false; }
  })();

  const savePin = async () => {
    if (pin.length < 4) { showToast('warning', 'Use at least 4 characters.'); return; }
    if (pin !== pin2)   { showToast('warning', 'Passcodes do not match.');    return; }
    setBusy(true);
    try {
      await setPasscode(pin);
      showToast('success', 'Passcode set. The workspace will lock on next load.');
      setPin(''); setPin2('');
    } finally { setBusy(false); }
  };

  const savePw = async () => {
    if (pw.length < 8) { showToast('warning', 'Use at least 8 characters.'); return; }
    if (pw !== pw2)    { showToast('warning', 'Passwords do not match.');     return; }
    setBusy(true);
    try {
      await changePassword(pw);
      showToast('success', 'Password changed successfully.');
      setPw(''); setPw2('');
    } catch (e) {
      showToast('error', e.message);
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      {/* ── Alarming default-passcode banner: LOCAL mode only ───────────────
          In Supabase mode the device passcode is not the auth mechanism, so
          we never show this warning to cloud users regardless of what is
          stored in localStorage (migration 4 should have removed it). */}
      {isDefaultPasscode && (
        <div className="rounded-xl border-2 border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-900/30 p-4 flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-200">
              Change your passcode now
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              You are still using the default bootstrap passcode (<strong>admin</strong>).
              Set a personal passcode below immediately.
            </p>
          </div>
        </div>
      )}

      {/* ── Supabase password change ─────────────────────────────────────── */}
      {supabaseEnabled && (
        <Card variant="glass" className="space-y-3">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-emerald-500" /> Change account password
          </h3>
          <p className="text-sm text-slate-500">
            Update the password you use to sign in to this app.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <PasswordInput
              label="New password"
              autoComplete="new-password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              hint="At least 8 characters."
            />
            <PasswordInput
              label="Confirm new password"
              autoComplete="new-password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
            />
          </div>
          <Button onClick={savePw} isLoading={busy} leftIcon={<Save className="w-4 h-4" />}>
            Update password
          </Button>
        </Card>
      )}

      {/* ── Device passcode lock (local mode / optional extra layer) ─────── */}
      <Card variant="glass" className="space-y-3">
        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Lock className="w-5 h-5 text-violet-500" />
          {supabaseEnabled ? 'Optional device passcode lock' : 'Device passcode lock'}
        </h3>
        <p className="text-sm text-slate-500">
          {supabaseEnabled
            ? 'Adds an extra login wall on this specific device in addition to your account password. Optional — most users do not need this.'
            : 'Adds a login wall on this device. The passcode is hashed with PBKDF2-HMAC-SHA256 (260,000 iterations) with a 5-attempt / 5-minute lockout.'}
        </p>

        {lockEnabled && (
          <div className="flex flex-wrap gap-2 mb-1">
            <Badge variant="success">Passcode lock is ON</Badge>
            <Button size="sm" variant="secondary" onClick={lockNow}
              leftIcon={<Lock className="w-4 h-4" />}>
              Lock now
            </Button>
            <Button
              size="sm" variant="ghost" className="text-red-500"
              onClick={() => {
                if (window.confirm('Remove the device passcode?')) {
                  clearPasscode();
                  showToast('success', 'Passcode removed.');
                }
              }}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Remove passcode
            </Button>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-3">
          <PasswordInput
            label={lockEnabled ? 'New passcode (to change)' : 'New passcode'}
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            hint="At least 4 characters."
          />
          <PasswordInput
            label="Confirm passcode"
            inputMode="numeric"
            value={pin2}
            onChange={(e) => setPin2(e.target.value)}
          />
        </div>
        <Button onClick={savePin} isLoading={busy} leftIcon={<ShieldCheck className="w-4 h-4" />}>
          {lockEnabled ? 'Change passcode' : 'Enable passcode lock'}
        </Button>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
function UsageTab() {
  const { aiUsage, setAiUsage, profile, showToast } = useApp();
  const sum = useMemo(() => summariseUsage(aiUsage), [aiUsage]);

  const byFeature = useMemo(() => {
    const map = {};
    aiUsage.forEach((r) => { map[r.feature] = (map[r.feature] || 0) + r.totalTokens; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [aiUsage]);

  const maxF   = byFeature.length ? byFeature[0][1] : 1;
  const budget = profile.monthlyAiBudget || 0;

  const exportCsv = () => {
    const csv = toCsv(aiUsage, [
      { label: 'Timestamp',       key: 'ts'           },
      { label: 'Model',           key: 'model'        },
      { label: 'Feature',         key: 'feature'      },
      { label: 'Grounded',        get: (r) => (r.grounded ? 'yes' : 'no') },
      { label: 'Prompt tokens',   key: 'promptTokens' },
      { label: 'Output tokens',   key: 'outputTokens' },
      { label: 'Thinking tokens', key: 'thoughtTokens'},
      { label: 'Total tokens',    key: 'totalTokens'  },
      { label: 'Est. cost (USD)', get: (r) => r.cost.toFixed(6) },
    ]);
    downloadBlob(csv, 'lexiassist_ai_usage.csv', 'text/csv;charset=utf-8');
    showToast('success', 'Usage CSV exported.');
  };

  const fmt = (n) => n.toLocaleString();
  const usd = (n) => `$${n.toFixed(4)}`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Today',      tokens: sum.today, cost: sum.todayCost  },
          { label: 'This month', tokens: sum.month, cost: sum.monthCost  },
          { label: 'All time',   tokens: sum.all,   cost: sum.allCost    },
        ].map((s) => (
          <Card key={s.label} variant="glass">
            <p className="text-sm text-slate-400">{s.label}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {fmt(s.tokens)}
              <span className="text-sm font-normal text-slate-400"> tokens</span>
            </p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400">~{usd(s.cost)} est.</p>
          </Card>
        ))}
      </div>

      {budget > 0 && (
        <Card variant="flat">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-500">Monthly AI budget</span>
            <span className="font-medium">{usd(sum.monthCost)} / ${budget}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className={cn('h-full rounded-full', sum.monthCost > budget ? 'bg-red-500' : 'bg-emerald-500')}
              style={{ width: `${Math.min(100, (sum.monthCost / budget) * 100)}%` }}
            />
          </div>
        </Card>
      )}

      <Card variant="glass">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-900 dark:text-white">By feature</h3>
          <Button size="sm" variant="secondary" onClick={exportCsv}
            leftIcon={<Download className="w-4 h-4" />}>CSV</Button>
        </div>
        {byFeature.length === 0 ? (
          <p className="text-sm text-slate-400">No AI usage recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {byFeature.map(([feat, tok]) => (
              <div key={feat}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-slate-500">{feat}</span>
                  <span className="text-slate-400">{fmt(tok)}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full rounded-full bg-violet-500"
                    style={{ width: `${(tok / maxF) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card variant="glass">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
          Recent calls ({aiUsage.length})
        </h3>
        {aiUsage.length === 0 ? (
          <p className="text-sm text-slate-400">No calls yet.</p>
        ) : (
          <div className="overflow-x-auto max-h-80 overflow-y-auto thin-scrollbar">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-400 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-900">
                <tr>
                  <th className="py-2 pr-3">Time</th>
                  <th className="pr-3">Feature</th>
                  <th className="pr-3">Model</th>
                  <th className="text-right pr-3">Tokens</th>
                  <th className="text-right">Cost</th>
                </tr>
              </thead>
              <tbody>
                {[...aiUsage].reverse().slice(0, 100).map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-1.5 pr-3 text-slate-500">{formatDateTime(r.ts)}</td>
                    <td className="pr-3">
                      {r.feature}
                      {r.grounded && <Badge variant="success" className="ml-1">web</Badge>}
                    </td>
                    <td className="pr-3 text-slate-400">{r.model}</td>
                    <td className="text-right pr-3">{fmt(r.totalTokens)}</td>
                    <td className="text-right text-emerald-600 dark:text-emerald-400">{usd(r.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {aiUsage.length > 0 && (
          <Button variant="ghost" size="sm" className="mt-3 text-red-500"
            onClick={() => { if (window.confirm('Clear usage log?')) setAiUsage([]); }}
            leftIcon={<Trash2 className="w-4 h-4" />}>
            Clear log
          </Button>
        )}
      </Card>
      <p className="text-xs text-slate-400">
        Costs are estimates from public token rates and exclude Google Search grounding
        request fees. Confirm actual spend in Google AI Studio / Cloud billing.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
function NotifyTab() {
  const { profile, setProfile, cases, showToast, audit } = useApp();
  const [email, setEmail] = useState(profile.notifyEmail || '');
  const [win, setWin]     = useState(profile.reminderWindow || 7);

  const save = () => {
    setProfile({ notifyEmail: email, reminderWindow: Number(win) });
    audit('SETTINGS_UPDATE', 'notifications');
    showToast('success', 'Notification settings saved.');
  };

  const upcoming = cases.flatMap((c) => {
    const hs = [c.nextHearing && { date: c.nextHearing }, ...(c.hearings || [])].filter(Boolean);
    return hs.map((h) => ({
      title: c.title, suitNo: c.suitNo, court: c.court, date: h.date,
    }));
  }).filter((h) => {
    const d = (new Date(h.date) - new Date()) / 86400000;
    return d >= 0 && d <= (Number(win) || 7);
  });

  const buildReminderMailto = () => {
    const subject = encodeURIComponent('Upcoming hearing reminders');
    const body = encodeURIComponent(
      `Hearings in the next ${win} day(s):\n\n` +
      upcoming.map((h) =>
        `• ${h.title} (${h.suitNo}) — ${formatDate(h.date)}${h.court ? ` at ${h.court}` : ''}`
      ).join('\n') +
      '\n\n— Sent from LexiAssist'
    );
    return `mailto:${email}?subject=${subject}&body=${body}`;
  };

  return (
    <Card variant="glass" className="space-y-4">
      <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
        <Bell className="w-5 h-5 text-amber-500" /> Hearing reminders
      </h3>
      <p className="text-sm text-slate-500">
        Prepares ready-to-send reminder emails via your mail app (no server required).
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Reminder email address" value={email}
          onChange={(e) => setEmail(e.target.value)} placeholder="you@firm.com" />
        <Select label="Remind within" value={String(win)}
          onChange={(e) => setWin(e.target.value)}
          options={[
            { value: '1', label: '1 day'  },
            { value: '3', label: '3 days' },
            { value: '7', label: '7 days' },
          ]} />
      </div>
      <div className="flex gap-2">
        <Button onClick={save} leftIcon={<Save className="w-4 h-4" />}>Save</Button>
        <a
          href={upcoming.length ? buildReminderMailto() : undefined}
          className={!email || !upcoming.length ? 'pointer-events-none opacity-50' : ''}
        >
          <Button variant="outline" leftIcon={<Mail className="w-4 h-4" />}>
            Prepare reminder email ({upcoming.length})
          </Button>
        </a>
      </div>
      {upcoming.length > 0 && (
        <ul className="text-sm text-slate-500 list-disc list-inside">
          {upcoming.map((h, i) => (
            <li key={i}>{h.title} — {formatDate(h.date)}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
function DataTab() {
  const { exportBackup, importBackup, showToast } = useApp();

  const doExport = () => {
    const data = exportBackup();
    downloadBlob(
      JSON.stringify(data, null, 2),
      `lexiassist_backup_${new Date().toISOString().slice(0, 10)}.json`,
      'application/json'
    );
    showToast('success', 'Backup downloaded.');
  };

  const doImport = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importBackup(JSON.parse(reader.result));
        showToast('success', 'Backup restored.');
      } catch {
        showToast('error', 'Invalid backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <Card variant="glass" className="space-y-4">
      <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
        <Database className="w-5 h-5 text-blue-500" /> Backup &amp; restore
      </h3>
      <p className="text-sm text-slate-500">
        Export your whole workspace (cases, clients, tasks, analyses, templates, settings)
        to a JSON file, or restore from one. All data lives in this browser.
      </p>
      <div className="flex gap-2 flex-wrap">
        <Button onClick={doExport} leftIcon={<Download className="w-4 h-4" />}>
          Export backup (JSON)
        </Button>
        <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">
          <Upload className="w-4 h-4" /> Restore backup
          <input type="file" accept="application/json" className="hidden"
            onChange={(e) => doImport(e.target.files?.[0])} />
        </label>
      </div>
      <p className="text-xs text-slate-400">Build {__version__}</p>
    </Card>
  );
}
