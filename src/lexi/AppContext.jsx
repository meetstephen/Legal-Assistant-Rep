// ============================================================
// lexi/AppContext.jsx — global state, persistence, and actions
// ============================================================

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { storage, STORAGE_KEYS } from './database.js';
import { applyTheme } from './themes.js';
import { generateId } from './utils.js';
import { appendAudit, buildUsageRecord } from './helpers.js';
import { DEFAULT_TEMPLATES, FEE_DEFAULTS } from './legalData.js';
import { DEFAULT_MODEL } from './ai.js';
import { obfuscate, deobfuscate } from './crypto.js';

const AppContext = createContext(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

const DEFAULT_PROFILE = {
  firmName: '',
  lawyerName: '',
  email: '',
  phone: '',
  address: '',
  bankDetails: '',
  letterheadFooter: '',
  isAdmin: true,
  // Firm admin settings
  hourlyRate: FEE_DEFAULTS.hourlyRate,
  currency: FEE_DEFAULTS.currency,
  vatRate: FEE_DEFAULTS.vatRate,
  whtRate: FEE_DEFAULTS.whtRate,
  defaultCourt: 'High Court of a State',
  defaultJurisdiction: 'Nigeria (Federal)',
  monthlyAiBudget: 20,
  notifyEmail: '',
  reminderWindow: 7,
};

export function AppProvider({ children }) {
  // ---- settings ----
  const [isDark, setIsDark] = useState(() => storage.get(STORAGE_KEYS.THEME, false));
  const [apiKey, setApiKeyState] = useState(() => deobfuscate(storage.get(STORAGE_KEYS.API_KEY, '')));
  const [model, setModelState] = useState(() => storage.get(STORAGE_KEYS.MODEL, DEFAULT_MODEL));
  const [webGrounding, setWebGroundingState] = useState(() => storage.get(STORAGE_KEYS.WEB_GROUNDING, false));
  const [profile, setProfileState] = useState(() => ({ ...DEFAULT_PROFILE, ...storage.get(STORAGE_KEYS.PROFILE, {}) }));

  // ---- navigation ----
  const [activePage, setActivePage] = useState('home');
  const [pageParams, setPageParams] = useState({});

  // ---- data ----
  const [cases, setCases] = useState(() => storage.get(STORAGE_KEYS.CASES, []));
  const [clients, setClients] = useState(() => storage.get(STORAGE_KEYS.CLIENTS, []));
  const [tasks, setTasks] = useState(() => storage.get(STORAGE_KEYS.TASKS, []));
  const [timeEntries, setTimeEntries] = useState(() => storage.get(STORAGE_KEYS.TIME_ENTRIES, []));
  const [analyses, setAnalyses] = useState(() => storage.get(STORAGE_KEYS.ANALYSES, []));
  const [aiHistory, setAiHistory] = useState(() => storage.get(STORAGE_KEYS.AI_HISTORY, []));
  const [aiUsage, setAiUsage] = useState(() => storage.get(STORAGE_KEYS.AI_USAGE, []));
  const [templates, setTemplates] = useState(() => storage.get(STORAGE_KEYS.TEMPLATES, DEFAULT_TEMPLATES));
  const [auditLog, setAuditLog] = useState(() => storage.get(STORAGE_KEYS.AUDIT_LOG, []));

  // ---- toasts ----
  const [toasts, setToasts] = useState([]);

  // ---- effects: theme + persistence ----
  useEffect(() => {
    applyTheme(isDark);
    storage.set(STORAGE_KEYS.THEME, isDark);
  }, [isDark]);

  useEffect(() => storage.set(STORAGE_KEYS.CASES, cases), [cases]);
  useEffect(() => storage.set(STORAGE_KEYS.CLIENTS, clients), [clients]);
  useEffect(() => storage.set(STORAGE_KEYS.TASKS, tasks), [tasks]);
  useEffect(() => storage.set(STORAGE_KEYS.TIME_ENTRIES, timeEntries), [timeEntries]);
  useEffect(() => storage.set(STORAGE_KEYS.ANALYSES, analyses), [analyses]);
  useEffect(() => storage.set(STORAGE_KEYS.AI_HISTORY, aiHistory.slice(-100)), [aiHistory]);
  useEffect(() => storage.set(STORAGE_KEYS.AI_USAGE, aiUsage.slice(-1000)), [aiUsage]);
  useEffect(() => storage.set(STORAGE_KEYS.TEMPLATES, templates), [templates]);
  useEffect(() => storage.set(STORAGE_KEYS.AUDIT_LOG, auditLog), [auditLog]);

  // ---- toast helpers ----
  const showToast = useCallback((type, message) => {
    const id = generateId();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);
  const removeToast = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  // ---- audit ----
  const audit = useCallback((type, detail = '') => {
    setAuditLog((prev) => appendAudit(prev, type, detail));
  }, []);

  // ---- settings setters ----
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
  const setProfile = useCallback((patch) => {
    setProfileState((prev) => {
      const next = { ...prev, ...patch };
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

  // ---- AI usage recording ----
  const recordUsage = useCallback((feature, { model: m, usage, grounded }) => {
    if (!usage) return;
    const rec = buildUsageRecord({ model: m, usage, feature, grounded });
    setAiUsage((prev) => [...prev, rec]);
  }, []);

  // ---- cases ----
  const addCase = useCallback((data) => {
    const item = { ...data, id: generateId(), createdAt: new Date().toISOString(), hearings: data.hearings || [] };
    setCases((prev) => [...prev, item]);
    audit('CASE_CREATE', data.title || '');
    return item;
  }, [audit]);
  const updateCase = useCallback((id, patch) => {
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c)));
    audit('CASE_UPDATE', id);
  }, [audit]);
  const deleteCase = useCallback((id) => {
    setCases((prev) => prev.filter((c) => c.id !== id));
    audit('CASE_DELETE', id);
  }, [audit]);

  // ---- clients ----
  const addClient = useCallback((data) => {
    const item = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    setClients((prev) => [...prev, item]);
    audit('CLIENT_CREATE', data.name || '');
    return item;
  }, [audit]);
  const updateClient = useCallback((id, patch) => {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);
  const deleteClient = useCallback((id) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
    audit('CLIENT_DELETE', id);
  }, [audit]);
  const getClientName = useCallback((id) => clients.find((c) => c.id === id)?.name || 'Unassigned', [clients]);

  // ---- tasks ----
  const addTask = useCallback((data) => {
    const item = { ...data, id: generateId(), createdAt: new Date().toISOString(), status: data.status || 'todo' };
    setTasks((prev) => [...prev, item]);
    audit('TASK_CREATE', data.title || '');
    return item;
  }, [audit]);
  const updateTask = useCallback((id, patch) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    audit('TASK_UPDATE', id);
  }, [audit]);
  const deleteTask = useCallback((id) => setTasks((prev) => prev.filter((t) => t.id !== id)), []);

  // ---- time entries ----
  const addTimeEntry = useCallback((data) => {
    const amount = (Number(data.hours) || 0) * (Number(data.rate) || 0);
    const item = { ...data, amount, id: generateId(), createdAt: new Date().toISOString() };
    setTimeEntries((prev) => [...prev, item]);
    return item;
  }, []);
  const deleteTimeEntry = useCallback((id) => setTimeEntries((prev) => prev.filter((e) => e.id !== id)), []);

  // ---- analyses (saved AI outputs) ----
  const saveAnalysis = useCallback((data) => {
    const item = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    setAnalyses((prev) => [...prev, item]);
    audit('ANALYSIS_SAVE', data.title || data.taskType || '');
    return item;
  }, [audit]);
  const deleteAnalysis = useCallback((id) => setAnalyses((prev) => prev.filter((a) => a.id !== id)), []);

  // ---- ai history ----
  const pushHistory = useCallback((entry) => {
    setAiHistory((prev) => [...prev, { ...entry, id: generateId(), ts: new Date().toISOString() }]);
  }, []);

  // ---- templates ----
  const addTemplate = useCallback((data) => {
    setTemplates((prev) => [...prev, { ...data, id: generateId() }]);
  }, []);
  const deleteTemplate = useCallback((id) => setTemplates((prev) => prev.filter((t) => t.id !== id)), []);

  // ---- backup / restore ----
  const exportBackup = useCallback(() => {
    audit('BACKUP', 'export');
    return storage.exportAll();
  }, [audit]);
  const importBackup = useCallback((obj) => {
    storage.importAll(obj);
    setCases(storage.get(STORAGE_KEYS.CASES, []));
    setClients(storage.get(STORAGE_KEYS.CLIENTS, []));
    setTasks(storage.get(STORAGE_KEYS.TASKS, []));
    setTimeEntries(storage.get(STORAGE_KEYS.TIME_ENTRIES, []));
    setAnalyses(storage.get(STORAGE_KEYS.ANALYSES, []));
    setTemplates(storage.get(STORAGE_KEYS.TEMPLATES, DEFAULT_TEMPLATES));
    setProfileState({ ...DEFAULT_PROFILE, ...storage.get(STORAGE_KEYS.PROFILE, {}) });
    audit('BACKUP', 'restore');
  }, [audit]);

  const value = useMemo(
    () => ({
      // settings
      isDark, toggleTheme, apiKey, setApiKey, model, setModel,
      webGrounding, setWebGrounding, profile, setProfile,
      // nav
      activePage, pageParams, navigate,
      // data
      cases, addCase, updateCase, deleteCase,
      clients, addClient, updateClient, deleteClient, getClientName,
      tasks, addTask, updateTask, deleteTask,
      timeEntries, addTimeEntry, deleteTimeEntry,
      analyses, saveAnalysis, deleteAnalysis,
      aiHistory, pushHistory,
      aiUsage, recordUsage, setAiUsage,
      templates, addTemplate, deleteTemplate,
      auditLog, audit,
      // toast
      toasts, showToast, removeToast,
      // backup
      exportBackup, importBackup,
    }),
    [
      isDark, toggleTheme, apiKey, setApiKey, model, setModel, webGrounding, setWebGrounding,
      profile, setProfile, activePage, pageParams, navigate, cases, addCase, updateCase, deleteCase,
      clients, addClient, updateClient, deleteClient, getClientName, tasks, addTask, updateTask, deleteTask,
      timeEntries, addTimeEntry, deleteTimeEntry, analyses, saveAnalysis, deleteAnalysis, aiHistory, pushHistory,
      aiUsage, recordUsage, templates, addTemplate, deleteTemplate, auditLog, audit, toasts, showToast, removeToast,
      exportBackup, importBackup,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
