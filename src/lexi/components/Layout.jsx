// ============================================================
// lexi/components/Layout.jsx — header + grouped sidebar shell
// ============================================================

import React, { useState } from 'react';
import { Scale, Sun, Moon, Menu, X, Globe, KeyRound, Search as SearchIcon, ChevronLeft, ChevronRight as ChevronRightIcon, LogOut, Lock, User as UserIcon } from 'lucide-react';
import { useApp } from '../AppContext.jsx';
import { NAV_SECTIONS } from '../nav.js';
import { BRAND_LABEL, TAGLINE } from '../runtime.js';
import { cn } from '../utils.js';
import { Toggle, Badge } from './ui.jsx';

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
  const { webGrounding, setWebGrounding, aiReady, useProxy } = useApp();
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
          <span className="text-emerald-500">Key on server (secure)</span>
        ) : aiReady ? (
          <span className="text-emerald-500">API key configured</span>
        ) : (
          <span className="text-amber-500">No API key</span>
        )}
      </div>
    </div>
  );
}

// Account / session bar: shows the signed-in user (cloud mode) and a way to
// lock the workspace or sign out — the sidebar "logout" the user asked for.
function AccountBar({ onAction }) {
  const { supabaseEnabled, user, signOut, lockEnabled, lockNow, showToast } = useApp();
  const canSignOut = supabaseEnabled && !!user;
  const canLock = lockEnabled;
  if (!canSignOut && !canLock) return null;

  const doLock = () => { lockNow(); onAction && onAction(); };
  const doSignOut = async () => { await signOut(); showToast('info', 'Signed out.'); onAction && onAction(); };

  return (
    <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 space-y-2">
      <div className="flex items-center gap-2 px-1 text-xs text-slate-500 dark:text-slate-400 min-w-0">
        <div className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
          <UserIcon className="w-3.5 h-3.5 text-emerald-500" />
        </div>
        <span className="truncate">{canSignOut ? user.email : 'This device'}</span>
      </div>
      <div className="flex gap-2">
        {canLock && (
          <button
            onClick={doLock}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <Lock className="w-3.5 h-3.5" /> Lock
          </button>
        )}
        {canSignOut && (
          <button
            onClick={doSignOut}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        )}
      </div>
    </div>
  );
}

export function Layout({ children }) {
  const { isDark, toggleTheme } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen lexi-app-bg text-slate-900 dark:text-slate-100 flex flex-col">
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
              <h1 className="text-base font-bold">
                <span className="lexi-gradient-text">{BRAND_LABEL}</span>
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

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className={cn(
          'hidden lg:flex flex-col flex-shrink-0 h-[calc(100vh-4rem)] sticky top-16 border-r border-slate-200 dark:border-slate-800 overflow-y-auto thin-scrollbar transition-all duration-200',
          collapsed ? 'w-0 p-0 border-r-0 overflow-hidden' : 'w-64 p-4'
        )}>
          {!collapsed && (
            <>
              <GroundingSwitch />
              <div className="mt-5 flex-1">
                <NavList />
              </div>
              <AccountBar />
              <div className="pt-3 mt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center gap-1.5 text-[10px] text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Private Beta
              </div>
            </>
          )}
        </aside>

        {/* Sidebar collapse/expand button (desktop) */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden lg:flex items-center justify-center w-5 h-10 rounded-r-lg bg-slate-100 dark:bg-slate-800 border border-l-0 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-emerald-500 fixed top-1/2 -translate-y-1/2 z-30 transition-all"
          style={{ left: collapsed ? '0px' : '256px' }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRightIcon className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-slate-900 p-4 overflow-y-auto thin-scrollbar animate-slideInRight">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold lexi-gradient-text">{BRAND_LABEL}</span>
                <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <GroundingSwitch />
              <div className="mt-5">
                <NavList onNavigate={() => setMobileOpen(false)} />
              </div>
              <AccountBar onAction={() => setMobileOpen(false)} />
              <div className="pt-3 mt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center gap-1.5 text-[10px] text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Private Beta
              </div>
            </div>
          </div>
        )}

        {/* Main */}
        <main className="flex-1 min-w-0 px-4 lg:px-8 py-6 safe-x max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="safe-bottom border-t border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-5 text-center text-xs text-slate-400 dark:text-slate-500 space-y-1">
          <p className="font-medium text-slate-500 dark:text-slate-400">
            ⚖️ LexiAssist · AI-Powered Legal Research &amp; Drafting for Nigerian Practice
          </p>
          <p>
            Oyim Stephen Esq. &amp; Associates&nbsp;&nbsp;|&nbsp;&nbsp;Powered by LexiAssist 2.0&nbsp;&nbsp;|&nbsp;&nbsp;&copy; {new Date().getFullYear()}
          </p>
          <p className="text-[11px] italic text-slate-400/80 dark:text-slate-500/80">
            Authorities are cited and verifiable · finalised under the supervising practitioner&apos;s judgment
          </p>
        </div>
      </footer>
    </div>
  );
}
