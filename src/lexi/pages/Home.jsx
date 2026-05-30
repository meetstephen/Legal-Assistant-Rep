// ============================================================
// lexi/pages/Home.jsx — dashboard with Next-7-Days panel
// ============================================================

import React, { useMemo } from 'react';
import {
  Home as HomeIcon, Brain, BookOpen, ShieldCheck, FolderOpen,
  ListChecks, Users, CalendarClock, ArrowRight, Sparkles, Globe, MessageCircle,
} from 'lucide-react';
import { useApp } from '../AppContext.jsx';
import { Card, Button, Badge, PageHeader } from '../components/ui.jsx';
import { QuickPrecedentFinder } from '../components/QuickPrecedentFinder.jsx';
import { BRAND_LABEL } from '../runtime.js';
import { formatDate, formatRelativeDate, daysUntil, formatCurrency, cn } from '../utils.js';

export function Home() {
  const { cases, clients, tasks, timeEntries, navigate, profile, aiReady, webGrounding } = useApp();

  const upcoming = useMemo(() => {
    const out = [];
    cases.forEach((c) => {
      const hs = [c.nextHearing && { date: c.nextHearing }, ...(c.hearings || [])].filter(Boolean);
      hs.forEach((h) => {
        const d = daysUntil(h.date);
        if (d >= 0 && d <= 7) out.push({ title: c.title, date: h.date, suitNo: c.suitNo });
      });
    });
    return out.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [cases]);

  const dueTasks = useMemo(
    () => tasks.filter((t) => t.status !== 'done' && t.due && daysUntil(t.due) <= 7).sort((a, b) => new Date(a.due) - new Date(b.due)),
    [tasks]
  );

  const billable = timeEntries.reduce((s, e) => s + e.amount, 0);
  const cur = profile.currency || '₦';

  const stats = [
    { label: 'Active cases', value: cases.filter((c) => c.status === 'active').length, icon: FolderOpen, tone: 'from-emerald-400 to-teal-500', page: 'cases' },
    { label: 'Open tasks', value: tasks.filter((t) => t.status !== 'done').length, icon: ListChecks, tone: 'from-blue-400 to-indigo-500', page: 'tasks' },
    { label: 'Clients', value: clients.length, icon: Users, tone: 'from-violet-400 to-fuchsia-500', page: 'clients' },
    { label: 'Billable', value: formatCurrency(billable, cur), icon: CalendarClock, tone: 'from-amber-400 to-orange-500', page: 'fees' },
  ];

  const quick = [
    { id: 'ai', label: 'Ask the AI Assistant', icon: Brain, desc: 'Reason, draft, analyse — grounded in Nigerian law' },
    { id: 'chat', label: 'Open AI Chat', icon: MessageCircle, desc: 'A conversation that remembers context' },
    { id: 'research', label: 'Research case law', icon: BookOpen, desc: 'Live web + verified database' },
    { id: 'authority', label: 'Verify authorities', icon: ShieldCheck, desc: 'Extract & confirm citations' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader icon={HomeIcon} title={profile.firmName ? `Welcome, ${profile.firmName}` : `Welcome to ${BRAND_LABEL}`} subtitle="Your AI-assisted Nigerian legal workspace" gradient="from-emerald-400 to-teal-500" />

      {!aiReady && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">Get started — add your Gemini API key</p>
              <p className="text-sm text-amber-700/80 dark:text-amber-300/70">Powers reasoning, live web grounding, drafting and verification.</p>
            </div>
            <Button size="sm" onClick={() => navigate('profile')}>Add API key</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <button key={s.label} onClick={() => navigate(s.page)} className="text-left">
            <Card variant="glass" hover className="py-4">
              <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-2', s.tone)}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</div>
              <div className="text-xs text-slate-400">{s.label}</div>
            </Card>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card variant="glass">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><CalendarClock className="w-5 h-5 text-emerald-500" /> Next 7 days</h3>
          {upcoming.length === 0 && dueTasks.length === 0 ? (
            <p className="text-sm text-slate-400">Nothing scheduled in the next week. Add hearings to cases and due dates to tasks.</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((h, i) => (
                <div key={`h${i}`} className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">⚖️ {h.title}</p>
                    <p className="text-xs text-slate-400">Hearing · {formatDate(h.date)}</p>
                  </div>
                  <Badge variant={daysUntil(h.date) <= 3 ? 'danger' : 'warning'}>{formatRelativeDate(h.date)}</Badge>
                </div>
              ))}
              {dueTasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">✅ {t.title}</p>
                    <p className="text-xs text-slate-400">Task due · {formatDate(t.due)}</p>
                  </div>
                  <Badge variant={daysUntil(t.due) < 0 ? 'danger' : 'warning'}>{formatRelativeDate(t.due)}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card variant="glass">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><Sparkles className="w-5 h-5 text-violet-500" /> Quick actions</h3>
          <div className="space-y-2">
            {quick.map((a) => (
              <button key={a.id} onClick={() => navigate(a.id)} className="w-full text-left group">
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2.5 hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors">
                  <a.icon className="w-5 h-5 text-emerald-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{a.label}</p>
                    <p className="text-xs text-slate-400">{a.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <QuickPrecedentFinder compact />

      <Card variant="flat" className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
        <Globe className={cn('w-4 h-4', webGrounding ? 'text-emerald-500' : 'text-slate-400')} />
        Live web grounding is <span className={cn('font-semibold', webGrounding ? 'text-emerald-600' : 'text-slate-500')}>{webGrounding ? 'ON' : 'OFF'}</span> for general AI features — toggle it in the sidebar. Practice Updates, Research and the citation verifier go online regardless.
      </Card>
    </div>
  );
}
