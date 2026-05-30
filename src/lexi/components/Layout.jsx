// ============================================================
// lexi/components/Layout.jsx — header + grouped sidebar shell
// ============================================================

import React, { useState } from 'react';
import { Scale, Sun, Moon, Menu, X, Globe, Sparkles, KeyRound, Search as SearchIcon } from 'lucide-react';
import { useApp } from '../AppContext.jsx';
import { NAV_SECTIONS } from '../nav.js';
import { BRAND_LABEL, TAGLINE } from '../runtime.js';
import { cn } from '../utils.js';
import { Badge, Toggle } from './ui.jsx';

function NavList({ onNavigate }) {
  const { activePage, navigate, cases, tasks, clients, profile } = useApp();
  const counts = { cases: cases.length, tasks: tasks.filter((t) => t.status !== 'done').length, clients: clients.length };
  return (
    <nav className="space-y-5">
      {NAV_SECTIONS.map((section) => (
        <div key={section.title}>
          <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {section.title}
          </p>
          <div className="space-y-0.5">
            {section.items
              .filter((item) => !item.adminOnly || profile.isAdmin)
              .map((item) => {
                const Icon = item.icon;
                const active = activePage === item.id;
                const badge = item.badge ? counts[item.badge] : 0;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      navigate(item.id);
                      onNavigate && onNavigate();
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      active
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {badge > 0 && <Badge variant={active ? 'success' : 'default'}>{badge}</Badge>}
                  </button>
                );
              })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function GroundingSwitch() {
  const { webGrounding, setWebGrounding, aiReady, useProxy, model } = useApp();
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <Globe className="w-3.5 h-3.5" /> LIVE WEB GROUNDING
      </div>
      <Toggle
        checked={webGrounding}
        onChange={setWebGrounding}
        label="All AI features online"
        hint={webGrounding ? 'Answers grounded in live web sources' : 'Off — uses model + verified DB only'}
      />
      <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
        <KeyRound className="w-3 h-3" />
        {useProxy ? (
          <span className="text-emerald-500">Key on server</span>
        ) : aiReady ? (
          <span className="text-emerald-500">API key set</span>
        ) : (
          <span className="text-amber-500">No API key</span>
        )}
        <span>·</span>
        <span className="truncate">{model}</span>
      </div>
    </div>
  );
}

export function Layout({ children }) {
  const { isDark, toggleTheme } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen lexi-app-bg text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 safe-top bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/70 dark:border-slate-800/70">
        <div className="flex items-center justify-between h-16 px-4 lg:px-6 safe-x">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold flex items-center gap-2">
                <span className="lexi-gradient-text">{BRAND_LABEL}</span>
                <Badge variant="info" className="hidden sm:inline-flex">
                  <Sparkles className="w-3 h-3" /> Gemini 2.5
                </Badge>
              </h1>
              <p className="hidden sm:block text-[11px] text-slate-400 -mt-0.5">{TAGLINE}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.dispatchEvent(new Event('lexi:open-command'))}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm"
              aria-label="Open command palette"
            >
              <SearchIcon className="w-4 h-4" />
              <span>Search</span>
              <kbd className="text-[10px] border border-slate-300 dark:border-slate-600 rounded px-1">⌘K</kbd>
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 h-[calc(100vh-4rem)] sticky top-16 border-r border-slate-200 dark:border-slate-800 p-4 overflow-y-auto thin-scrollbar">
          <GroundingSwitch />
          <div className="mt-5 flex-1">
            <NavList />
          </div>
          <div className="pt-3 mt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Private Beta
          </div>
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-slate-900 p-4 overflow-y-auto thin-scrollbar animate-slideInRight">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold">{BRAND_LABEL}</span>
                <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <GroundingSwitch />
              <div className="mt-5">
                <NavList onNavigate={() => setMobileOpen(false)} />
              </div>
              <div className="pt-3 mt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center gap-1.5 text-[10px] text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Private Beta
              </div>
            </div>
          </div>
        )}

        {/* Main */}
        <main className="flex-1 min-w-0 px-4 lg:px-8 py-6 safe-x safe-bottom max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
