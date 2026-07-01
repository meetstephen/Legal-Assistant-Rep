// ============================================================
// lexi/pages/Admin.jsx — Firm Admin Dashboard (admin only)
// ============================================================

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Shield, Save, Plus, BadgeCheck, UserX, UserCheck, RotateCcw,
  Trash2, Star, MessageSquarePlus, KeyRound, Users, Activity,
  BarChart2, Clock, AlertTriangle, CheckCircle, Loader2,
  Eye, TrendingUp, Zap, FileText, Calendar, Database,
} from 'lucide-react';
import { useApp } from '../AppContext.jsx';
import { storage, STORAGE_KEYS } from '../database.js';
import { registerVerifiedCases, VERIFIED_CASES } from '../citations.js';
import { MODELS } from '../ai.js';
import {
  Card, Button, Input, Select, PageHeader, Badge,
  Modal, EmptyState, PasswordInput,
} from '../components/ui.jsx';
import { formatCurrency, formatDateTime, generateId, cn } from '../utils.js';
import { computeProfessionalFee, AUDIT_EVENTS } from '../helpers.js';
import { JURISDICTIONS } from '../legalData.js';
import { SUPABASE_ENABLED } from '../runtime.js';
import { loadAllProfiles, setProfileStatus } from '../supabase.js';

// ── Seed admin record ─────────────────────────────────────────────────────────
// Email must match VITE_ADMIN_EMAIL (or the fallback in AppContext.jsx).
const SEED_ADMIN_EMAIL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ADMIN_EMAIL)
    ?.split(',')[0]?.trim()?.toLowerCase() ||
  'meetstephenoyim@gmail.com';

const SEED_ADMIN = {
  id: 'admin-seed-001',
  email: SEED_ADMIN_EMAIL,
  name: 'Admin',
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
  if (!users.find((u) => u.id === SEED_ADMIN.id)) {
    const updated = [SEED_ADMIN, ...users];
    storage.set(STORAGE_KEYS.ADMIN_USERS, updated);
    return updated;
  }
  return users;
}

// Maps a public.profiles Supabase row to the camelCase shape the UI renders.
function mapProfileToUserRow(p) {
  return {
    id: p.id,
    email: p.email,
    name: p.name || (p.email || '').split('@')[0],
    role: p.role || 'lawyer',
    status: p.status || 'active',
    lastLogin: p.last_login,
    createdAt: p.created_at,
    // Deleting real Auth accounts requires a server-side service-role key.
    // Manage account removal from Supabase Dashboard → Authentication → Users.
    canRemove: false,
    passwordResetPending: false,
  };
}

// In cloud mode: fetches every real registered account from public.profiles
// via Supabase RLS — this is what makes all signups visible to the admin.
// In local mode: falls back to the original localStorage-seeded list.
function useAdminUsers() {
  const [users, setUsers]     = useState(() => (SUPABASE_ENABLED ? [] : getAdminUsers()));
  const [loading, setLoading] = useState(SUPABASE_ENABLED);
  const [error, setError]     = useState(null);

  const refresh = useCallback(async () => {
    if (!SUPABASE_ENABLED) { setUsers(getAdminUsers()); return; }
    setLoading(true);
    try {
      const profiles = await loadAllProfiles();
      setUsers(profiles.map(mapProfileToUserRow));
      setError(null);
    } catch (e) {
      setError(e.message || 'Could not load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { users, setUsers, loading, error, refresh };
}

function isOnline(lastLogin) {
  if (!lastLogin) return false;
  return Date.now() - new Date(lastLogin).getTime() < 5 * 60 * 1000;
}

function timeAgo(iso) {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return 'Just now';
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const TABS = [
  { id: 'overview',  label: 'Overview',        icon: BarChart2       },
  { id: 'users',     label: 'Users',            icon: Users           },
  { id: 'activity',  label: 'Activity Feed',    icon: Activity        },
  { id: 'cases',     label: 'Verified Cases',   icon: BadgeCheck      },
  { id: 'feedback',  label: 'Feedback',         icon: MessageSquarePlus },
  { id: 'settings',  label: 'Firm Settings',    icon: Shield          },
];

// ── Stat card helper ──────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = 'emerald' }) {
  const colors = {
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    blue:    'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    violet:  'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400',
    amber:   'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
  };
  return (
    <Card variant="glass" className="flex items-center gap-4">
      <div className={cn('p-3 rounded-xl', colors[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab() {
  const { cases, clients, tasks, aiUsage, auditLog } = useApp();
  const { users } = useAdminUsers();

  const activeUsers   = users.filter((u) => u.status === 'active').length;
  const onlineUsers   = users.filter((u) => isOnline(u.lastLogin)).length;
  const totalAiCalls  = aiUsage.length;
  const todayAiCalls  = aiUsage.filter((u) => {
    return new Date(u.ts).toDateString() === new Date().toDateString();
  }).length;

  const recentActivity = useMemo(() =>
    [...auditLog]
      .reverse()
      .slice(0, 8)
      .map((e) => ({ ...e, meta: AUDIT_EVENTS[e.type] || { label: e.type, color: 'slate' } })),
    [auditLog]
  );

  const COLOR_DOT = {
    emerald: 'bg-emerald-500',
    red:     'bg-red-500',
    blue:    'bg-blue-500',
    violet:  'bg-violet-500',
    amber:   'bg-amber-500',
    cyan:    'bg-cyan-500',
    slate:   'bg-slate-400',
  };

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}    label="Registered Users"  value={users.length}  sub={`${activeUsers} active · ${onlineUsers} online`} color="blue"    />
        <StatCard icon={FileText} label="Active Cases"      value={cases.length}  sub={`${clients.length} clients`}                       color="emerald" />
        <StatCard icon={Calendar} label="Open Tasks"        value={tasks.filter((t) => t.status !== 'done').length} sub={`${tasks.length} total`} color="violet"  />
        <StatCard icon={Zap}      label="AI Calls Today"    value={todayAiCalls}  sub={`${totalAiCalls} total all time`}                  color="amber"   />
      </div>

      {/* Online users */}
      <Card variant="glass" className="space-y-3">
        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Eye className="w-4 h-4 text-emerald-500" /> User Status
        </h3>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <span className={cn('w-2 h-2 rounded-full', isOnline(u.lastLogin) ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600')} />
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{u.name || u.email}</p>
                  <p className="text-xs text-slate-400">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={u.status === 'active' ? 'success' : 'danger'} className="text-xs">{u.status}</Badge>
                <span className="text-xs text-slate-400 whitespace-nowrap">{timeAgo(u.lastLogin)}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent activity */}
      <Card variant="glass" className="space-y-3">
        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-500" /> Recent Activity
        </h3>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-slate-400 py-2">No activity recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((e) => (
              <div key={e.id} className="flex items-start gap-3">
                <span className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', COLOR_DOT[e.meta.color] || 'bg-slate-400')} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-medium">{e.meta.label}</span>
                    {e.detail && <span className="text-slate-500"> · {e.detail}</span>}
                  </p>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">{timeAgo(e.ts)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────────
function UsersTab({ showToast, audit }) {
  const { supabaseEnabled, requestPasswordReset, setPasscode, auditLog, user: currentUser } = useApp();
  const { users, setUsers, loading, error, refresh } = useAdminUsers();
  const [showAdd, setShowAdd]   = useState(false);
  const [newUser, setNewUser]   = useState({ email: '', role: 'lawyer', name: '' });
  const [resetTarget, setResetTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [newPin, setNewPin]     = useState('');
  const [resetBusy, setResetBusy] = useState(false);
  const [searchQ, setSearchQ]   = useState('');

  // Local-mode: persist to localStorage. Cloud-mode: source of truth is Supabase.
  const saveUsers = useCallback((list) => {
    setUsers(list);
    if (!SUPABASE_ENABLED) storage.set(STORAGE_KEYS.ADMIN_USERS, list);
  }, [setUsers]);

  // Count activity per user (match email in audit detail)
  const userActivity = useMemo(() => {
    const counts = {};
    auditLog.forEach((e) => {
      users.forEach((u) => {
        if (e.detail && e.detail.includes(u.email)) {
          counts[u.id] = (counts[u.id] || 0) + 1;
        }
      });
    });
    return counts;
  }, [auditLog, users]);

  const filtered = useMemo(() =>
    users.filter((u) =>
      !searchQ ||
      u.email.toLowerCase().includes(searchQ.toLowerCase()) ||
      (u.name || '').toLowerCase().includes(searchQ.toLowerCase())
    ), [users, searchQ]
  );

  const addUser = () => {
    if (SUPABASE_ENABLED) {
      showToast('warning', 'Real accounts sign up themselves. To invite someone, use Supabase Dashboard → Authentication → Users → Invite.');
      return;
    }
    if (!newUser.email.trim()) { showToast('warning', 'Email is required.'); return; }
    if (users.find((u) => u.email.toLowerCase() === newUser.email.toLowerCase().trim())) {
      showToast('warning', 'A user with this email already exists.'); return;
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
    showToast('success', `${entry.email} added.`);
    setNewUser({ email: '', role: 'lawyer', name: '' });
    setShowAdd(false);
  };

  const toggleStatus = async (id) => {
    const target = users.find((u) => u.id === id);
    if (!target) return;

    // Self-protection: admins cannot suspend their own account.
    if (currentUser && id === currentUser.id) {
      showToast('warning', 'You cannot suspend your own account.');
      return;
    }

    const next = target.status === 'active' ? 'suspended' : 'active';
    if (SUPABASE_ENABLED) {
      try {
        await setProfileStatus(id, next);
        audit('USER_STATUS', `${target.email} → ${next}`);
        showToast('success', `${target.email} is now ${next}.`);
        await refresh();
      } catch (e) {
        showToast('error', e.message || 'Could not update status.');
      }
      return;
    }
    saveUsers(users.map((u) => {
      if (u.id === id) {
        audit('USER_STATUS', `${u.email} → ${next}`);
        showToast('success', `${u.email} is now ${next}.`);
        return { ...u, status: next };
      }
      return u;
    }));
  };

  const confirmDelete = (user) => setDeleteTarget(user);

  const doDelete = () => {
    if (!deleteTarget || !deleteTarget.canRemove) return;
    saveUsers(users.filter((u) => u.id !== deleteTarget.id));
    audit('USER_DELETE', deleteTarget.email);
    showToast('success', `${deleteTarget.email} permanently deleted.`);
    setDeleteTarget(null);
  };

  const sendResetEmail = async () => {
    if (!resetTarget) return;
    setResetBusy(true);
    try {
      await requestPasswordReset(resetTarget.email);
      saveUsers(users.map((u) =>
        u.id === resetTarget.id ? { ...u, passwordResetPending: true } : u
      ));
      audit('USER_PASSWORD_RESET', `email sent: ${resetTarget.email}`);
      showToast('success', `Reset email sent to ${resetTarget.email}.`);
      setResetTarget(null);
    } catch (e) {
      showToast('error', e.message || 'Could not send reset email.');
    } finally {
      setResetBusy(false);
    }
  };

  const setLocalPasscode = async () => {
    if (newPin.length < 4) { showToast('warning', 'Minimum 4 characters.'); return; }
    setResetBusy(true);
    try {
      await setPasscode(newPin);
      saveUsers(users.map((u) =>
        u.id === resetTarget.id ? { ...u, passwordResetPending: false } : u
      ));
      audit('USER_PASSWORD_RESET', `device passcode reset (${resetTarget.email})`);
      showToast('success', 'Device passcode reset.');
      setResetTarget(null); setNewPin('');
    } finally {
      setResetBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Cloud-mode info banner */}
      {SUPABASE_ENABLED && !error && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-200">
          <strong>Cloud mode:</strong> Showing all registered accounts from Supabase.
          To invite new users, go to{' '}
          <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer"
            className="underline">Supabase Dashboard</a> → Authentication → Users → Invite.
        </div>
      )}
      {/* Error state — most likely RLS misconfiguration or missing migration */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-300">
          <strong>Could not load users:</strong> {error}
          <Button variant="outline" size="sm" className="mt-2 ml-2" onClick={refresh}>Retry</Button>
        </div>
      )}
      {/* Loading spinner */}
      {loading && !error && (
        <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading users from Supabase…
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Search users…"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          className="flex-1 min-w-48"
        />
        <Button variant="outline" size="sm" onClick={() => setShowAdd(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Add User
        </Button>
      </div>

      <p className="text-sm text-slate-500">{users.length} registered · {users.filter((u) => u.status === 'active').length} active · {users.filter((u) => isOnline(u.lastLogin)).length} online now</p>

      <div className="space-y-3">
        {filtered.map((user) => (
          <div key={user.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {/* Row 1: name + badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0',
                      isOnline(user.lastLogin) ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'
                    )} />
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {user.name || user.email.split('@')[0]}
                    </span>
                  </div>
                  <Badge variant={user.role === 'admin' ? 'violet' : 'info'}>{user.role}</Badge>
                  <Badge variant={user.status === 'active' ? 'success' : 'danger'}>{user.status}</Badge>
                  {isOnline(user.lastLogin) && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Online</span>
                  )}
                  {user.passwordResetPending && <Badge variant="warning">Reset pending</Badge>}
                </div>
                {/* Row 2: email */}
                <p className="text-sm text-slate-500 mt-0.5 ml-4">{user.email}</p>
                {/* Row 3: meta */}
                <div className="flex items-center gap-4 mt-1 ml-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last login: {user.lastLogin ? timeAgo(user.lastLogin) : 'Never'}
                  </span>
                  {user.lastLogin && (
                    <span className="hidden sm:inline">{formatDateTime(user.lastLogin)}</span>
                  )}
                  {(userActivity[user.id] || 0) > 0 && (
                    <span className="flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      {userActivity[user.id]} audit events
                    </span>
                  )}
                  <span>Joined {timeAgo(user.createdAt)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {(() => {
                  const isSelf = currentUser && user.id === currentUser.id;
                  return (
                    <button
                      onClick={() => toggleStatus(user.id)}
                      disabled={isSelf}
                      className={cn('p-2 rounded-lg transition-colors',
                        isSelf
                          ? 'opacity-30 cursor-not-allowed text-slate-300'
                          : user.status === 'active'
                            ? 'hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-400 hover:text-amber-500'
                            : 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-500'
                      )}
                      title={isSelf ? 'You cannot suspend your own account' : user.status === 'active' ? 'Suspend user' : 'Activate user'}>
                      {user.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </button>
                  );
                })()}
                <button
                  onClick={() => { setResetTarget(user); setNewPin(''); }}
                  className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-500 transition-colors"
                  title="Reset password">
                  <RotateCcw className="w-4 h-4" />
                </button>
                {user.canRemove && (
                  <button
                    onClick={() => confirmDelete(user)}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
                    title="Delete user permanently">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-8 text-center text-slate-400 text-sm">No users match your search.</div>
        )}
      </div>

      {/* Add User Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add New User">
        <div className="space-y-4">
          <Input label="Email *" type="email" value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="lawyer@example.com" />
          <Input label="Display name" value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} placeholder="Full name (optional)" />
          <Select label="Role" value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            options={[{ value: 'lawyer', label: 'Lawyer' }, { value: 'admin', label: 'Admin' }]} />
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={addUser} leftIcon={<Plus className="w-4 h-4" />}>Add User</Button>
          </div>
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal isOpen={!!resetTarget} onClose={() => setResetTarget(null)}
        title={`Reset password — ${resetTarget?.name || resetTarget?.email || ''}`}>
        {supabaseEnabled ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Send a secure password-reset link to <strong>{resetTarget?.email}</strong>.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setResetTarget(null)}>Cancel</Button>
              <Button onClick={sendResetEmail} isLoading={resetBusy} leftIcon={<RotateCcw className="w-4 h-4" />}>
                Send reset email
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-200">
              Local mode uses a single shared <strong>device passcode</strong>.
            </div>
            <PasswordInput label="New device passcode" inputMode="numeric" value={newPin}
              onChange={(e) => setNewPin(e.target.value)} placeholder="At least 4 characters"
              leftIcon={<KeyRound className="w-4 h-4" />} />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setResetTarget(null)}>Cancel</Button>
              <Button onClick={setLocalPasscode} isLoading={resetBusy} leftIcon={<RotateCcw className="w-4 h-4" />}>
                Set passcode
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        title="Permanently delete user">
        <div className="space-y-4">
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  This action is irreversible.
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  <strong>{deleteTarget?.email}</strong> will be permanently removed from the user registry.
                  {SUPABASE_ENABLED && ' To fully revoke Supabase access, also delete the user in your Supabase dashboard.'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={doDelete} leftIcon={<Trash2 className="w-4 h-4" />}>
              Delete permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── Activity Feed Tab ─────────────────────────────────────────────────────────
function ActivityTab() {
  const { auditLog } = useApp();
  const [filter, setFilter] = useState('all');
  const [limit, setLimit]   = useState(50);

  const COLOR_MAP = {
    emerald: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
    red:     'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
    blue:    'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    violet:  'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
    amber:   'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    cyan:    'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300',
    slate:   'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
  };

  const filtered = useMemo(() => {
    const base = filter === 'all' ? auditLog : auditLog.filter((e) => e.type === filter);
    return [...base].reverse().slice(0, limit);
  }, [auditLog, filter, limit]);

  // Stats bar
  const stats = useMemo(() => {
    const counts = {};
    auditLog.forEach((e) => { counts[e.type] = (counts[e.type] || 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({
        type,
        count,
        label: AUDIT_EVENTS[type]?.label || type,
      }));
  }, [auditLog]);

  return (
    <div className="space-y-4">
      {/* Quick stats */}
      <div className="flex gap-3 flex-wrap">
        {stats.map((s) => (
          <button key={s.type}
            onClick={() => setFilter(filter === s.type ? 'all' : s.type)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              filter === s.type
                ? 'bg-emerald-500 text-white border-emerald-500'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300'
            )}>
            {s.label} <span className="ml-1 opacity-70">({s.count})</span>
          </button>
        ))}
        {filter !== 'all' && (
          <button onClick={() => setFilter('all')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors">
            × Clear filter
          </button>
        )}
      </div>

      <p className="text-xs text-slate-400">{auditLog.length} total events · showing {filtered.length}</p>

      <Card variant="glass" className="divide-y divide-slate-100 dark:divide-slate-800">
        {filtered.length === 0 ? (
          <div className="py-10 text-center">
            <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No activity recorded yet.</p>
          </div>
        ) : (
          filtered.map((e) => {
            const meta = AUDIT_EVENTS[e.type] || { label: e.type, color: 'slate' };
            return (
              <div key={e.id} className="flex items-center gap-3 py-2.5">
                <span className={cn('px-2 py-0.5 rounded text-xs font-medium flex-shrink-0',
                  COLOR_MAP[meta.color] || COLOR_MAP.slate)}>
                  {meta.label}
                </span>
                <span className="text-sm text-slate-600 dark:text-slate-300 flex-1 truncate">
                  {e.detail || '—'}
                </span>
                <span className="text-xs text-slate-400 flex-shrink-0 whitespace-nowrap">
                  {timeAgo(e.ts)}
                </span>
              </div>
            );
          })
        )}
      </Card>

      {auditLog.length > limit && (
        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={() => setLimit((p) => p + 50)}>
            Load 50 more
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Verified Cases Tab ────────────────────────────────────────────────────────
function CasesTab({ showToast, audit }) {
  const [vc, setVc] = useState({
    name: '', citation: '', court: 'Supreme Court', category: '', holding: '',
  });

  const storedCases = useMemo(() => storage.get(STORAGE_KEYS.ADMIN_CASES, []), []);

  const addCase = () => {
    if (!vc.name.trim() || !vc.citation.trim()) {
      showToast('warning', 'Case name and citation are required.'); return;
    }
    const updated = [...storedCases, { ...vc, id: generateId() }];
    storage.set(STORAGE_KEYS.ADMIN_CASES, updated);
    registerVerifiedCases([vc]);
    audit('SETTINGS_UPDATE', `verified-case: ${vc.name}`);
    showToast('success', 'Verified case added — active in all future sessions.');
    setVc({ name: '', citation: '', court: 'Supreme Court', category: '', holding: '' });
  };

  return (
    <div className="space-y-4">
      <Card variant="glass" className="space-y-4">
        <div className="flex items-center gap-2">
          <BadgeCheck className="w-5 h-5 text-emerald-500" />
          <h3 className="font-semibold text-slate-900 dark:text-white">Add Verified Case</h3>
        </div>
        <p className="text-sm text-slate-500">
          {VERIFIED_CASES.length} built-in + {storedCases.length} admin-added cases currently loaded.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Case name *" value={vc.name}
            onChange={(e) => setVc({ ...vc, name: e.target.value })} placeholder="Afolabi v. Adekunle" />
          <Input label="Citation *" value={vc.citation}
            onChange={(e) => setVc({ ...vc, citation: e.target.value })}
            placeholder="(2020) 1 NWLR (Pt 1234) 1" />
          <Select label="Court" value={vc.court}
            onChange={(e) => setVc({ ...vc, court: e.target.value })}
            options={['Supreme Court','Court of Appeal','Federal High Court','High Court','National Industrial Court']
              .map((c) => ({ value: c, label: c }))} />
          <Input label="Category" value={vc.category}
            onChange={(e) => setVc({ ...vc, category: e.target.value })} placeholder="Contract / Land / Evidence …" />
        </div>
        <Input label="Holding (short)" value={vc.holding}
          onChange={(e) => setVc({ ...vc, holding: e.target.value })}
          placeholder="Principal holding of the case" />
        <Button variant="outline" onClick={addCase} leftIcon={<Plus className="w-4 h-4" />}>
          Add verified case
        </Button>
      </Card>

      {storedCases.length > 0 && (
        <Card variant="glass" className="space-y-3">
          <h3 className="font-semibold text-slate-900 dark:text-white">Admin-Added Cases ({storedCases.length})</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {storedCases.map((c, i) => (
              <div key={c.id || i} className="py-2">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{c.name}</p>
                <p className="text-xs text-slate-500">{c.citation} · {c.court}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Feedback Tab ──────────────────────────────────────────────────────────────
function FeedbackTab() {
  const feedbackList = useMemo(() => {
    const all = storage.get(STORAGE_KEYS.FEEDBACK, []);
    return [...all].reverse();
  }, []);

  const CATEGORIES = {
    'ai-quality': 'AI Quality', 'usability': 'Usability',
    'features': 'Features',    'bug-report': 'Bug Report', 'other': 'Other',
  };
  const VARIANTS = {
    'ai-quality': 'info', 'usability': 'success',
    'features': 'violet', 'bug-report': 'danger', 'other': 'default',
  };

  if (feedbackList.length === 0) {
    return (
      <EmptyState icon={MessageSquarePlus} title="No feedback yet"
        description="User feedback submissions will appear here." />
    );
  }

  const avgRating = (
    feedbackList.reduce((a, f) => a + (f.rating || 0), 0) / feedbackList.length
  ).toFixed(1);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
            Avg {avgRating}/5
          </span>
        </div>
        <span className="text-sm text-slate-500">{feedbackList.length} submissions</span>
      </div>
      <div className="space-y-3">
        {feedbackList.map((item) => (
          <div key={item.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} className={cn('w-4 h-4',
                    s <= (item.rating||0) ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'
                  )} />
                ))}
              </div>
              <Badge variant={VARIANTS[item.category] || 'default'}>
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

// ── Firm Settings Tab ─────────────────────────────────────────────────────────
function SettingsTab({ f, setF, allowed, toggleModel, preview, save }) {
  return (
    <div className="space-y-6">
      <Card variant="glass" className="space-y-4">
        <h3 className="font-semibold text-slate-900 dark:text-white">Billing defaults</h3>
        <div className="grid sm:grid-cols-4 gap-4">
          <Input label="Hourly rate" type="number" value={f.hourlyRate}
            onChange={(e) => setF({ ...f, hourlyRate: e.target.value })} />
          <Input label="Currency" value={f.currency}
            onChange={(e) => setF({ ...f, currency: e.target.value })} />
          <Input label="VAT %" type="number" value={f.vatRate}
            onChange={(e) => setF({ ...f, vatRate: e.target.value })} />
          <Input label="WHT %" type="number" value={f.whtRate}
            onChange={(e) => setF({ ...f, whtRate: e.target.value })} />
        </div>
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 text-sm text-slate-500">
          Preview on ₦500,000: invoice {formatCurrency(preview.totalPayableInclVat, f.currency)} (incl. VAT),
          net after WHT {formatCurrency(preview.netAfterWht, f.currency)}.
        </div>
      </Card>

      <Card variant="glass" className="space-y-4">
        <h3 className="font-semibold text-slate-900 dark:text-white">Defaults &amp; AI budget</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <Input label="Default court" value={f.defaultCourt}
            onChange={(e) => setF({ ...f, defaultCourt: e.target.value })} />
          <Select label="Default jurisdiction" value={f.defaultJurisdiction}
            onChange={(e) => setF({ ...f, defaultJurisdiction: e.target.value })}
            options={JURISDICTIONS.map((j) => ({ value: j, label: j }))} />
          <Input label="Monthly AI budget (USD)" type="number" value={f.monthlyAiBudget}
            onChange={(e) => setF({ ...f, monthlyAiBudget: e.target.value })} />
          <Input label="AI calls / minute" type="number" value={f.aiPerMinute}
            onChange={(e) => setF({ ...f, aiPerMinute: e.target.value })} />
          <Input label="AI calls / day" type="number" value={f.aiPerDay}
            onChange={(e) => setF({ ...f, aiPerDay: e.target.value })} />
        </div>
        <p className="text-xs text-slate-400">Rate limits protect your Gemini quota from runaway spend.</p>

        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Allowed models</p>
          <div className="flex flex-wrap gap-2">
            {MODELS.map((m) => (
              <button key={m.id} onClick={() => toggleModel(m.id)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                  allowed.includes(m.id)
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'border-slate-300 dark:border-slate-600 text-slate-500 hover:border-emerald-300'
                )}>
                {m.id}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={save} leftIcon={<Save className="w-4 h-4" />}>Save firm settings</Button>
      </Card>

      {/* API key setup guidance */}
      <Card variant="glass" className="space-y-3 border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-blue-500" />
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Vercel Environment Variables</h3>
        </div>
        <p className="text-sm text-slate-500">
          These two variables must be set in <strong>Vercel → Settings → Environment Variables</strong>{' '}
          for admin server-key mode to work:
        </p>
        <div className="rounded-lg bg-slate-900 text-slate-100 p-3 font-mono text-xs space-y-1">
          <p><span className="text-emerald-400">GEMINI_API_KEY</span>=<span className="text-amber-300">AIza…your-key</span>   <span className="text-slate-400"># server-side (no VITE_ prefix)</span></p>
          <p><span className="text-emerald-400">VITE_USE_PROXY</span>=<span className="text-amber-300">true</span>              <span className="text-slate-400"># build-time (needs VITE_ prefix)</span></p>
          <p><span className="text-emerald-400">VITE_ADMIN_EMAIL</span>=<span className="text-amber-300">{SEED_ADMIN_EMAIL}</span> <span className="text-slate-400"># your Supabase login email</span></p>
        </div>
        <p className="text-xs text-amber-600 dark:text-amber-400">
          ⚠ After changing env vars you must <strong>redeploy</strong> in Vercel for changes to take effect.
        </p>
      </Card>
    </div>
  );
}

// ── Main Admin Page ───────────────────────────────────────────────────────────
export function Admin() {
  const {
    profile, setProfile, showToast, audit,
    isAdmin, authLoading, navigate,
  } = useApp();

  // ── ALL hooks BEFORE any early return (Rules of Hooks) ────────────────────
  const [activeTab, setActiveTab] = useState('overview');
  const [f, setF]                 = useState(profile);
  const [allowed, setAllowed]     = useState(profile.allowedModels || MODELS.map((m) => m.id));

  const preview = computeProfessionalFee({
    base: 500000,
    vatRate: Number(f.vatRate) || 0,
    whtRate: Number(f.whtRate) || 0,
  });

  // ── Auth guard ────────────────────────────────────────────────────────────
  // CRITICAL: wait for authLoading to finish before redirecting.
  // Without this check the guard fires while isAdmin is still false
  // (session not yet confirmed) and bounces the admin to the home page.
  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      showToast('warning', 'Access denied — admin only.');
      navigate('home');
    }
  }, [authLoading, isAdmin, navigate, showToast]);

  // Update seed admin last-login timestamp on mount.
  useEffect(() => {
    if (!isAdmin) return;
    const users   = getAdminUsers();
    const updated = users.map((u) =>
      u.id === SEED_ADMIN.id ? { ...u, lastLogin: new Date().toISOString() } : u
    );
    storage.set(STORAGE_KEYS.ADMIN_USERS, updated);
  }, [isAdmin]);

  // ── Early returns AFTER all hooks ────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }
  if (!isAdmin) return null;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const save = () => {
    setProfile({
      ...f,
      allowedModels:   allowed,
      hourlyRate:      Number(f.hourlyRate),
      vatRate:         Number(f.vatRate),
      whtRate:         Number(f.whtRate),
      monthlyAiBudget: Number(f.monthlyAiBudget),
      aiPerMinute:     Number(f.aiPerMinute),
      aiPerDay:        Number(f.aiPerDay),
    });
    audit('SETTINGS_UPDATE', 'firm-admin');
    showToast('success', 'Firm settings saved.');
  };

  const toggleModel = (id) =>
    setAllowed((prev) => prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Shield}
        title="Firm Admin Dashboard"
        subtitle="User management · Activity monitoring · Firm settings · Verified cases"
        gradient="from-slate-600 to-slate-800"
      />

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

      {activeTab === 'overview'  && <OverviewTab />}
      {activeTab === 'users'     && <Card variant="glass"><UsersTab showToast={showToast} audit={audit} /></Card>}
      {activeTab === 'activity'  && <ActivityTab />}
      {activeTab === 'cases'     && <CasesTab showToast={showToast} audit={audit} />}
      {activeTab === 'feedback'  && <Card variant="glass"><FeedbackTab /></Card>}
      {activeTab === 'settings'  && (
        <SettingsTab f={f} setF={setF} allowed={allowed} toggleModel={toggleModel} preview={preview} save={save} />
      )}
    </div>
  );
}
