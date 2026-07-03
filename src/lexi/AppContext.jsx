// ============================================================
// lexi/AppContext.jsx — global state, persistence, and actions
// ============================================================

import React, {
  createContext, useContext, useState, useEffect,
  useRef, useCallback, useMemo,
} from 'react';
import { storage, STORAGE_KEYS } from './database.js';
import { applyTheme } from './themes.js';
import { generateId } from './utils.js';
import { appendAudit, buildUsageRecord } from './helpers.js';
import { DEFAULT_TEMPLATES, FEE_DEFAULTS } from './legalData.js';
import { DEFAULT_MODEL } from './ai.js';
import { USE_PROXY, SUPABASE_ENABLED, AUTH_MISCONFIGURED } from './runtime.js';
import { obfuscate, deobfuscate } from './crypto.js';
import {
  getSessionUser, onAuthChange, signInWithPassword, signUpWithPassword,
  signInWithMagicLink, signOut as sbSignOut, loadWorkspace, saveWorkspace,
  sendPasswordReset, updatePassword as sbUpdatePassword, touchOwnProfile,
  getOwnStatus,
} from './supabase.js';
import { evaluateRateLimit, prune, RATE_DEFAULTS } from './rateLimit.js';
import { hashPasscode, verifyPasscode, evaluateLockout, registerFailure, resetLockout } from './auth.js';

const AppContext = createContext(null);

// ── Admin email list ─────────────────────────────────────────────────────────
// Primary source: VITE_ADMIN_EMAIL build-time env var (set in Vercel → Settings
// → Environment Variables). Supports multiple emails comma-separated:
//   VITE_ADMIN_EMAIL=you@example.com,colleague@example.com
// Falls back to the hardcoded address if the env var is absent.
// In LOCAL mode (no Supabase) the single device user is always admin.
const _rawAdminEmails =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ADMIN_EMAIL) ||
  'meetstephenoyim@gmail.com';

const ADMIN_EMAILS = new Set(
  _rawAdminEmails
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
);

// Workspace slices that sync to the cloud.
const CLOUD_KEYS = [
  STORAGE_KEYS.CASES, STORAGE_KEYS.CLIENTS, STORAGE_KEYS.TASKS, STORAGE_KEYS.TIME_ENTRIES,
  STORAGE_KEYS.ANALYSES, STORAGE_KEYS.AI_HISTORY, STORAGE_KEYS.AI_USAGE, STORAGE_KEYS.TEMPLATES,
  STORAGE_KEYS.AUDIT_LOG, STORAGE_KEYS.PROFILE, STORAGE_KEYS.ADMIN_CASES, STORAGE_KEYS.CHAT,
  STORAGE_KEYS.COURT_DIARY,
];

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

// isAdmin is NOT in DEFAULT_PROFILE — it is computed from authenticated email.
const DEFAULT_PROFILE = {
  firmName: '', lawyerName: '', email: '', phone: '',
  address: '', bankDetails: '', letterheadFooter: '',
  hourlyRate: FEE_DEFAULTS.hourlyRate, currency: FEE_DEFAULTS.currency,
  vatRate: FEE_DEFAULTS.vatRate, whtRate: FEE_DEFAULTS.whtRate,
  defaultCourt: 'High Court of a State', defaultJurisdiction: 'Nigeria (Federal)',
  monthlyAiBudget: 20, notifyEmail: '', reminderWindow: 7, feedbackEmail: '',
  aiPerMinute: RATE_DEFAULTS.perMinute, aiPerDay: RATE_DEFAULTS.perDay,
};

function sanitiseProfile(raw = {}) {
  const { isAdmin: _removed, ...safe } = raw;
  return safe;
}

export function AppProvider({ children }) {
  // ── settings ──────────────────────────────────────────────────────────────
  const [isDark, setIsDark] = useState(() => storage.get(STORAGE_KEYS.THEME, true));
  const [apiKey, setApiKeyState] = useState(() => deobfuscate(storage.get(STORAGE_KEYS.API_KEY, '')));
  const [model, setModelState] = useState(() => storage.get(STORAGE_KEYS.MODEL, DEFAULT_MODEL));
  const [webGrounding, setWebGroundingState] = useState(() => storage.get(STORAGE_KEYS.WEB_GROUNDING, false));
  const [profile, setProfileState] = useState(() => ({
    ...DEFAULT_PROFILE,
    ...sanitiseProfile(storage.get(STORAGE_KEYS.PROFILE, {})),
  }));

  // ── navigation ────────────────────────────────────────────────────────────
  const [activePage, setActivePage] = useState('home');
  const [pageParams, setPageParams] = useState({});

  // ── data ──────────────────────────────────────────────────────────────────
  const [cases, setCases]             = useState(() => storage.get(STORAGE_KEYS.CASES, []));
  const [clients, setClients]         = useState(() => storage.get(STORAGE_KEYS.CLIENTS, []));
  const [tasks, setTasks]             = useState(() => storage.get(STORAGE_KEYS.TASKS, []));
  const [timeEntries, setTimeEntries] = useState(() => storage.get(STORAGE_KEYS.TIME_ENTRIES, []));
  const [analyses, setAnalyses]       = useState(() => storage.get(STORAGE_KEYS.ANALYSES, []));
  const [aiHistory, setAiHistory]     = useState(() => storage.get(STORAGE_KEYS.AI_HISTORY, []));
  const [aiUsage, setAiUsage]         = useState(() => storage.get(STORAGE_KEYS.AI_USAGE, []));
  const [templates, setTemplates]     = useState(() => storage.get(STORAGE_KEYS.TEMPLATES, DEFAULT_TEMPLATES));
  const [auditLog, setAuditLog]       = useState(() => storage.get(STORAGE_KEYS.AUDIT_LOG, []));

  // ── toasts ────────────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState([]);

  // ── auth / cloud sync ─────────────────────────────────────────────────────
  const [user, setUser]               = useState(null);
  const [authLoading, setAuthLoading] = useState(SUPABASE_ENABLED);
  const [cloudStatus, setCloudStatus] = useState('idle');
  const [recovery, setRecovery]       = useState(false);
  const syncReadyRef = useRef(false);
  const saveTimerRef = useRef(null);

  // ── device passcode ───────────────────────────────────────────────────────
  const [lockEnabled, setLockEnabled] = useState(() => !!storage.get(STORAGE_KEYS.APP_LOCK, null));
  const [unlocked, setUnlocked]       = useState(() => {
    if (!storage.get(STORAGE_KEYS.APP_LOCK, null)) return true;
    try { return sessionStorage.getItem('lexi2:session-unlocked') === '1'; } catch { return false; }
  });

  // ── computed admin status ─────────────────────────────────────────────────
  // Derived from authenticated user email — never from stored profile.
  // FAILS CLOSED: if Supabase is unconfigured on a deployed (production)
  // build, this is a misconfiguration, not "local mode" — isAdmin must be
  // false, never true, for every visitor. The "always admin" shortcut only
  // applies to the genuine local Vite dev server (npm run dev).
  const isAdmin = useMemo(() => {
    if (SUPABASE_ENABLED) {
      return !!user && ADMIN_EMAILS.has((user.email || '').toLowerCase());
    }
    if (AUTH_MISCONFIGURED) return false;
    return true; // genuine local dev only
  }, [user]);

  // ── persistence effects ───────────────────────────────────────────────────
  useEffect(() => { applyTheme(isDark); storage.set(STORAGE_KEYS.THEME, isDark); }, [isDark]);
  useEffect(() => storage.set(STORAGE_KEYS.CASES,        cases),                  [cases]);
  useEffect(() => storage.set(STORAGE_KEYS.CLIENTS,      clients),                [clients]);
  useEffect(() => storage.set(STORAGE_KEYS.TASKS,        tasks),                  [tasks]);
  useEffect(() => storage.set(STORAGE_KEYS.TIME_ENTRIES, timeEntries),            [timeEntries]);
  useEffect(() => storage.set(STORAGE_KEYS.ANALYSES,     analyses),               [analyses]);
  useEffect(() => storage.set(STORAGE_KEYS.AI_HISTORY,   aiHistory.slice(-100)),  [aiHistory]);
  useEffect(() => storage.set(STORAGE_KEYS.AI_USAGE,     aiUsage.slice(-1000)),   [aiUsage]);
  useEffect(() => storage.set(STORAGE_KEYS.TEMPLATES,    templates),              [templates]);
  useEffect(() => storage.set(STORAGE_KEYS.AUDIT_LOG,    auditLog),               [auditLog]);

  // ── toast helpers ─────────────────────────────────────────────────────────
  const showToast = useCallback((type, message) => {
    const id = generateId();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);
  const removeToast = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  // ── audit ─────────────────────────────────────────────────────────────────
  const audit = useCallback((type, detail = '') => {
    setAuditLog((prev) => appendAudit(prev, type, detail));
  }, []);

  // ── settings setters ──────────────────────────────────────────────────────
  const setApiKey = useCallback((key) => {
    setApiKeyState(key);
    storage.set(STORAGE_KEYS.API_KEY, obfuscate(key));
  }, []);
  const setModel = useCallback((m) => {
    setModelState(m);
    storage.set(STORAGE_KEYS.MODEL, m);
  }, []);
  const setWebGrounding = useCallback((v) => {
    setWebGroundingState(v);
    storage.set(STORAGE_KEYS.WEB_GROUNDING, v);
  }, []);

  // setProfile strips isAdmin — admin status is computed from auth, not stored.
  const setProfile = useCallback((patch) => {
    setProfileState((prev) => {
      const next = { ...prev, ...sanitiseProfile(patch) };
      storage.set(STORAGE_KEYS.PROFILE, next);
      return next;
    });
  }, []);

  const toggleTheme = useCallback(() => setIsDark((p) => !p), []);

  const navigate = useCallback((page, params = {}) => {
    setActivePage(page);
    setPageParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // ── AI usage recording ────────────────────────────────────────────────────
  const recordUsage = useCallback((feature, { model: m, usage, grounded }) => {
    if (!usage) return;
    setAiUsage((prev) => [...prev, buildUsageRecord({ model: m, usage, feature, grounded })]);
  }, []);

  // ── cases ─────────────────────────────────────────────────────────────────
  const addCase = useCallback((data) => {
    const item = { ...data, id: generateId(), createdAt: new Date().toISOString(), hearings: data.hearings || [] };
    setCases((prev) => [...prev, item]);
    audit('CASE_CREATE', data.title || '');
    return item;
  }, [audit]);
  const updateCase = useCallback((id, patch) => {
    setCases((prev) => prev.map((c) => c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c));
    audit('CASE_UPDATE', id);
  }, [audit]);
  const deleteCase = useCallback((id) => {
    setCases((prev) => prev.filter((c) => c.id !== id));
    audit('CASE_DELETE', id);
  }, [audit]);

  // ── clients ───────────────────────────────────────────────────────────────
  const addClient = useCallback((data) => {
    const item = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    setClients((prev) => [...prev, item]);
    audit('CLIENT_CREATE', data.name || '');
    return item;
  }, [audit]);
  const updateClient = useCallback((id, patch) => {
    setClients((prev) => prev.map((c) => c.id === id ? { ...c, ...patch } : c));
  }, []);
  const deleteClient = useCallback((id) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
    audit('CLIENT_DELETE', id);
  }, [audit]);
  const getClientName = useCallback((id) => clients.find((c) => c.id === id)?.name || 'Unassigned', [clients]);

  // ── tasks ─────────────────────────────────────────────────────────────────
  const addTask = useCallback((data) => {
    const item = { ...data, id: generateId(), createdAt: new Date().toISOString(), status: data.status || 'todo' };
    setTasks((prev) => [...prev, item]);
    audit('TASK_CREATE', data.title || '');
    return item;
  }, [audit]);
  const updateTask = useCallback((id, patch) => {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, ...patch } : t));
    audit('TASK_UPDATE', id);
  }, [audit]);
  const deleteTask = useCallback((id) => setTasks((prev) => prev.filter((t) => t.id !== id)), []);

  // ── time entries ──────────────────────────────────────────────────────────
  const addTimeEntry = useCallback((data) => {
    const amount = (Number(data.hours) || 0) * (Number(data.rate) || 0);
    const item   = { ...data, amount, id: generateId(), createdAt: new Date().toISOString() };
    setTimeEntries((prev) => [...prev, item]);
    return item;
  }, []);
  const deleteTimeEntry = useCallback((id) => setTimeEntries((prev) => prev.filter((e) => e.id !== id)), []);

  // ── analyses ──────────────────────────────────────────────────────────────
  const saveAnalysis = useCallback((data) => {
    const item = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    setAnalyses((prev) => [...prev, item]);
    audit('ANALYSIS_SAVE', data.title || data.taskType || '');
    return item;
  }, [audit]);
  const deleteAnalysis = useCallback((id) => setAnalyses((prev) => prev.filter((a) => a.id !== id)), []);

  // ── ai history ────────────────────────────────────────────────────────────
  const pushHistory = useCallback((entry) => {
    setAiHistory((prev) => [...prev, { ...entry, id: generateId(), ts: new Date().toISOString() }]);
  }, []);

  // ── templates ─────────────────────────────────────────────────────────────
  const addTemplate    = useCallback((data) => { setTemplates((prev) => [...prev, { ...data, id: generateId() }]); }, []);
  const deleteTemplate = useCallback((id)  => { setTemplates((prev) => prev.filter((t) => t.id !== id));          }, []);

  // ── backup / restore ──────────────────────────────────────────────────────
  const exportBackup = useCallback(() => { audit('BACKUP', 'export'); return storage.exportAll(); }, [audit]);
  const importBackup = useCallback((obj) => {
    storage.importAll(obj);
    setCases(storage.get(STORAGE_KEYS.CASES, []));
    setClients(storage.get(STORAGE_KEYS.CLIENTS, []));
    setTasks(storage.get(STORAGE_KEYS.TASKS, []));
    setTimeEntries(storage.get(STORAGE_KEYS.TIME_ENTRIES, []));
    setAnalyses(storage.get(STORAGE_KEYS.ANALYSES, []));
    setTemplates(storage.get(STORAGE_KEYS.TEMPLATES, DEFAULT_TEMPLATES));
    setProfileState({ ...DEFAULT_PROFILE, ...sanitiseProfile(storage.get(STORAGE_KEYS.PROFILE, {})) });
    audit('BACKUP', 'restore');
  }, [audit]);

  // ── cloud sync helpers ────────────────────────────────────────────────────
  const rehydrateFromStorage = useCallback(() => {
    setCases(storage.get(STORAGE_KEYS.CASES, []));
    setClients(storage.get(STORAGE_KEYS.CLIENTS, []));
    setTasks(storage.get(STORAGE_KEYS.TASKS, []));
    setTimeEntries(storage.get(STORAGE_KEYS.TIME_ENTRIES, []));
    setAnalyses(storage.get(STORAGE_KEYS.ANALYSES, []));
    setAiHistory(storage.get(STORAGE_KEYS.AI_HISTORY, []));
    setAiUsage(storage.get(STORAGE_KEYS.AI_USAGE, []));
    setTemplates(storage.get(STORAGE_KEYS.TEMPLATES, DEFAULT_TEMPLATES));
    setAuditLog(storage.get(STORAGE_KEYS.AUDIT_LOG, []));
    setProfileState({ ...DEFAULT_PROFILE, ...sanitiseProfile(storage.get(STORAGE_KEYS.PROFILE, {})) });
  }, []);

  const resetLocalData = useCallback(() => {
    [
      STORAGE_KEYS.CASES, STORAGE_KEYS.CLIENTS, STORAGE_KEYS.TASKS, STORAGE_KEYS.TIME_ENTRIES,
      STORAGE_KEYS.ANALYSES, STORAGE_KEYS.AI_HISTORY, STORAGE_KEYS.AI_USAGE, STORAGE_KEYS.AUDIT_LOG,
      STORAGE_KEYS.CHAT, STORAGE_KEYS.ADMIN_CASES,
    ].forEach((k) => storage.remove(k));
    setCases([]); setClients([]); setTasks([]); setTimeEntries([]); setAnalyses([]);
    setAiHistory([]); setAiUsage([]); setAuditLog([]); setTemplates(DEFAULT_TEMPLATES);
    setProfileState(DEFAULT_PROFILE);
  }, []);

  // ── initialise Supabase auth ──────────────────────────────────────────────
  useEffect(() => {
    if (!SUPABASE_ENABLED) return undefined;
    let active = true;
    (async () => {
      try {
        const u = await getSessionUser();
        if (active) setUser(u);
      } catch { /* ignore */ } finally {
        if (active) setAuthLoading(false);
      }
    })();
    const unsub = onAuthChange((u, event) => {
      setUser(u);
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
    });
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        getSessionUser().then((u) => { if (active) setUser(u); }).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => { active = false; unsub(); document.removeEventListener('visibilitychange', onVisible); };
  }, []);

  // ── on sign-in: pull workspace; on sign-out: clear ────────────────────────
  useEffect(() => {
    if (!SUPABASE_ENABLED) return undefined;
    let cancelled = false;
    if (user) {
      syncReadyRef.current = false;
      setCloudStatus('syncing');
      (async () => {
        try {
          // Fire-and-forget: update last_login and ensure profile row exists.
          touchOwnProfile(user.id, user.email).catch(() => {});
          const data = await loadWorkspace(user.id);
          if (cancelled) return;
          if (data && typeof data === 'object') {
            Object.entries(data).forEach(([k, v]) => storage.set(k, v));
            rehydrateFromStorage();
          }
          setCloudStatus('synced');
        } catch {
          if (!cancelled) setCloudStatus('error');
        } finally {
          if (!cancelled) syncReadyRef.current = true;
        }
      })();
    } else {
      syncReadyRef.current = false;
      resetLocalData();
      setCloudStatus('idle');
    }
    return () => { cancelled = true; };
  }, [user, rehydrateFromStorage, resetLocalData]);

  // ── debounced cloud save ──────────────────────────────────────────────────
  useEffect(() => {
    if (!SUPABASE_ENABLED || !user || !syncReadyRef.current) return undefined;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        setCloudStatus('syncing');
        const payload = {};
        CLOUD_KEYS.forEach((k) => { const v = storage.get(k, null); if (v !== null) payload[k] = v; });
        await saveWorkspace(user.id, payload);
        setCloudStatus('synced');
      } catch { setCloudStatus('error'); }
    }, 1500);
    return () => clearTimeout(saveTimerRef.current);
  }, [user, cases, clients, tasks, timeEntries, analyses, aiHistory, aiUsage, templates, auditLog, profile]);

  // ── periodic safety-net sync ────────────────────────────────────────────
  // Some workspace slices (e.g. Court Diary) manage their own local state
  // directly against localStorage rather than through AppContext's React
  // state, so writes to them never trigger the debounced effect above (its
  // dependency array only tracks state this context owns). Without this,
  // those slices would silently never reach Supabase unless the user
  // happened to also touch a tracked field (cases, clients, etc.) in the
  // same session. This interval re-reads the full CLOUD_KEYS payload from
  // localStorage every 60s and pushes it if anything has changed, so every
  // synced slice — present and future — gets a reliable upper bound on sync
  // latency regardless of which component wrote it.
  useEffect(() => {
    if (!SUPABASE_ENABLED || !user) return undefined;
    let lastSnapshot = null;
    const tick = async () => {
      if (!syncReadyRef.current) return;
      const payload = {};
      CLOUD_KEYS.forEach((k) => { const v = storage.get(k, null); if (v !== null) payload[k] = v; });
      const snapshot = JSON.stringify(payload);
      if (snapshot === lastSnapshot) return; // nothing changed — skip the write
      lastSnapshot = snapshot;
      try {
        setCloudStatus('syncing');
        await saveWorkspace(user.id, payload);
        setCloudStatus('synced');
      } catch { setCloudStatus('error'); }
    };
    const intervalId = setInterval(tick, 60_000);
    return () => clearInterval(intervalId);
  }, [user]);

  // ── auth actions ──────────────────────────────────────────────────────────
  const signIn  = useCallback(async (email, password) => { const u = await signInWithPassword(email, password); setUser(u); return u; }, []);
  const signUp  = useCallback((email, password) => signUpWithPassword(email, password), []);
  const magicLink = useCallback((email) => signInWithMagicLink(email), []);
  const doSignOut = useCallback(async () => { await sbSignOut(); setUser(null); audit('LOGOUT', ''); }, [audit]);

  // ── mid-session suspension enforcement ──────────────────────────────────
  // Banning a Supabase user blocks future logins/refreshes but does NOT
  // invalidate a JWT already sitting in the browser (documented Supabase
  // behaviour — access tokens are stateless and checked only for expiry, not
  // against the database, on every request). Without this poll, a user who
  // is suspended while actively using the app would stay logged into the UI
  // until their token naturally expires. This closes that gap client-side;
  // the workspaces RLS status check (schema.sql) is the real data-access
  // boundary that holds even during the brief gap between suspension and
  // the next poll tick.
  useEffect(() => {
    if (!SUPABASE_ENABLED || !user) return;
    let cancelled = false;

    const checkStatus = async () => {
      const status = await getOwnStatus(user.id);
      if (cancelled || !status) return;
      if (status === 'suspended') {
        try { sessionStorage.setItem('lexi:suspended', '1'); } catch { /* private mode or storage unavailable — non-fatal */ }
        doSignOut();
      }
    };

    const intervalId = setInterval(checkStatus, 45_000);
    const onVisible = () => { if (document.visibilityState === 'visible') checkStatus(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', checkStatus);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', checkStatus);
    };
  }, [user, doSignOut]);
  const requestPasswordReset = useCallback((email) => sendPasswordReset(email), []);
  const changePassword = useCallback(async (newPassword) => {
    await sbUpdatePassword(newPassword);
    setRecovery(false);
    if (typeof window !== 'undefined' && window.history) {
      window.history.replaceState({}, '', window.location.pathname + window.location.search);
    }
  }, []);

  // ── passcode lock ─────────────────────────────────────────────────────────
  const unlockWithPasscode = useCallback(async (pin) => {
    const lockState = storage.get(STORAGE_KEYS.APP_LOCK_ATTEMPTS, { attempts: 0, lockedUntil: 0 });
    const status    = evaluateLockout(lockState);
    if (status.locked) return { ok: false, locked: true, remainingMs: status.remainingMs };
    const record = storage.get(STORAGE_KEYS.APP_LOCK, null);
    const ok     = record?.isDefault ? pin === 'admin' : await verifyPasscode(pin, record);
    if (ok) {
      storage.set(STORAGE_KEYS.APP_LOCK_ATTEMPTS, resetLockout());
      setUnlocked(true);
      try { sessionStorage.setItem('lexi2:session-unlocked', '1'); } catch { /* ignore */ }
      audit('LOGIN', 'passcode');
      return { ok: true, isDefault: !!record?.isDefault };
    }
    const next = registerFailure(lockState);
    storage.set(STORAGE_KEYS.APP_LOCK_ATTEMPTS, next);
    audit('LOGIN_FAILED', `attempt ${next.attempts}`);
    return { ok: false, locked: !!next.lockedUntil, warning: next.warning };
  }, [audit]);

  const setPasscode = useCallback(async (pin) => {
    const record = await hashPasscode(pin);
    storage.set(STORAGE_KEYS.APP_LOCK, record);
    storage.set(STORAGE_KEYS.APP_LOCK_ATTEMPTS, resetLockout());
    setLockEnabled(true); setUnlocked(true);
    try { sessionStorage.setItem('lexi2:session-unlocked', '1'); } catch { /* ignore */ }
    audit('SETTINGS_UPDATE', 'passcode-set');
  }, [audit]);

  const clearPasscode = useCallback(() => {
    storage.remove(STORAGE_KEYS.APP_LOCK);
    storage.remove(STORAGE_KEYS.APP_LOCK_ATTEMPTS);
    setLockEnabled(false); setUnlocked(true);
    audit('SETTINGS_UPDATE', 'passcode-cleared');
  }, [audit]);

  const lockNow = useCallback(() => {
    if (lockEnabled) {
      setUnlocked(false);
      try { sessionStorage.removeItem('lexi2:session-unlocked'); } catch { /* ignore */ }
    }
  }, [lockEnabled]);

  // ── AI rate-limit guard ───────────────────────────────────────────────────
  const guardAi = useCallback(() => {
    const now   = Date.now();
    const times = prune(storage.get('ai-call-times', []), now);
    const res   = evaluateRateLimit(times, {
      perMinute: Number(profile.aiPerMinute) || RATE_DEFAULTS.perMinute,
      perDay:    Number(profile.aiPerDay)    || RATE_DEFAULTS.perDay,
      now,
    });
    if (!res.allowed) { showToast('warning', res.reason); return false; }
    storage.set('ai-call-times', [...times, now]);
    return true;
  }, [profile, showToast]);

  // ── context value ─────────────────────────────────────────────────────────
  const value = useMemo(() => ({
    isDark, toggleTheme, apiKey, setApiKey, model, setModel,
    webGrounding, setWebGrounding, profile, setProfile,
    // Admin status — computed from authenticated email, never stored.
    // Also exposed so pages can read authLoading before acting on isAdmin.
    isAdmin, authLoading,
    // AI ready: admin can use proxy (server key); non-admin needs own key.
    // If the server proxy is configured (VITE_USE_PROXY=true in Vercel), everyone
    // is AI-ready and the admin needs no personal key whatsoever.
    // Non-admin users with a personal key bypass the proxy automatically.
    aiReady: USE_PROXY || !!apiKey,
    useProxy: USE_PROXY,
    supabaseEnabled: SUPABASE_ENABLED,
    authMisconfigured: AUTH_MISCONFIGURED,
    // FAILS CLOSED: a misconfigured production build (Supabase unset on a
    // deployed URL) must never be treated as an authenticated session.
    user, cloudStatus,
    isAuthed: AUTH_MISCONFIGURED ? false : (!SUPABASE_ENABLED || !!user),
    recovery, signIn, signUp, magicLink, signOut: doSignOut,
    requestPasswordReset, changePassword,
    lockEnabled, unlocked, isLocked: lockEnabled && !unlocked,
    unlockWithPasscode, setPasscode, clearPasscode, lockNow,
    guardAi,
    activePage, pageParams, navigate,
    cases, addCase, updateCase, deleteCase,
    clients, addClient, updateClient, deleteClient, getClientName,
    tasks, addTask, updateTask, deleteTask,
    timeEntries, addTimeEntry, deleteTimeEntry,
    analyses, saveAnalysis, deleteAnalysis,
    aiHistory, pushHistory,
    aiUsage, recordUsage, setAiUsage,
    templates, addTemplate, deleteTemplate,
    auditLog, audit,
    toasts, showToast, removeToast,
    exportBackup, importBackup,
  }), [
    isDark, toggleTheme, apiKey, setApiKey, model, setModel,
    webGrounding, setWebGrounding, profile, setProfile,
    isAdmin, authLoading,
    user, cloudStatus, recovery, signIn, signUp, magicLink, doSignOut,
    requestPasswordReset, changePassword,
    lockEnabled, unlocked, unlockWithPasscode, setPasscode, clearPasscode, lockNow,
    guardAi, activePage, pageParams, navigate,
    cases, addCase, updateCase, deleteCase,
    clients, addClient, updateClient, deleteClient, getClientName,
    tasks, addTask, updateTask, deleteTask,
    timeEntries, addTimeEntry, deleteTimeEntry,
    analyses, saveAnalysis, deleteAnalysis,
    aiHistory, pushHistory, aiUsage, recordUsage,
    templates, addTemplate, deleteTemplate,
    auditLog, audit, toasts, showToast, removeToast,
    exportBackup, importBackup,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
