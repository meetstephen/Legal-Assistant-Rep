// ============================================================
// lexi/components/CommandPalette.jsx — ⌘K / Ctrl+K quick launcher
//
// Premium SPA navigation the original (Streamlit) build can't offer: fuzzy
// jump to any page plus quick actions (toggle grounding/theme, new chat,
// sign out). Open with ⌘K / Ctrl+K or the header button; arrow keys + Enter.
// ============================================================

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, CornerDownLeft, Command, Globe, Moon, Sun, MessageCircle, LogOut } from 'lucide-react';
import { useApp } from '../AppContext.jsx';
import { NAV_SECTIONS } from '../nav.js';
import { cn } from '../utils.js';

function fuzzy(haystack, needle) {
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase().trim();
  if (!n) return true;
  let i = 0;
  for (const ch of n) {
    i = h.indexOf(ch, i);
    if (i === -1) return false;
    i += 1;
  }
  return true;
}

export function CommandPalette() {
  const {
    navigate, profile, webGrounding, setWebGrounding, isDark, toggleTheme,
    supabaseEnabled, signOut, showToast,
  } = useApp();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const commands = useMemo(() => {
    const pages = NAV_SECTIONS.flatMap((s) =>
      s.items
        .filter((i) => !i.adminOnly || profile.isAdmin)
        .map((i) => ({
          id: `go:${i.id}`,
          label: i.label,
          hint: s.title.replace(/^[^ ]+ /, ''),
          icon: i.icon,
          run: () => navigate(i.id),
        }))
    );
    const actions = [
      { id: 'act:chat', label: 'Open AI Chat', hint: 'Action', icon: MessageCircle, run: () => navigate('chat') },
      {
        id: 'act:ground',
        label: `Live web grounding: turn ${webGrounding ? 'OFF' : 'ON'}`,
        hint: 'Action', icon: Globe,
        run: () => { setWebGrounding(!webGrounding); showToast('success', `Web grounding ${webGrounding ? 'off' : 'on'}.`); },
      },
      {
        id: 'act:theme',
        label: `Switch to ${isDark ? 'light' : 'dark'} theme`,
        hint: 'Action', icon: isDark ? Sun : Moon,
        run: () => toggleTheme(),
      },
    ];
    if (supabaseEnabled) {
      actions.push({ id: 'act:signout', label: 'Sign out', hint: 'Account', icon: LogOut, run: async () => { await signOut(); showToast('info', 'Signed out.'); } });
    }
    return [...pages, ...actions];
  }, [profile.isAdmin, webGrounding, isDark, supabaseEnabled, navigate, setWebGrounding, toggleTheme, signOut, showToast]);

  const filtered = useMemo(
    () => commands.filter((c) => fuzzy(`${c.label} ${c.hint}`, q)),
    [commands, q]
  );

  // Open/close hotkeys + external open event (header button).
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('lexi:open-command', onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('lexi:open-command', onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQ('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => { setActive(0); }, [q]);

  if (!open) return null;

  const choose = (cmd) => {
    setOpen(false);
    cmd.run();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter' && filtered[active]) { e.preventDefault(); choose(filtered[active]); }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center pt-[12vh] px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-modalFadeIn">
        <div className="flex items-center gap-3 px-4 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Jump to… or run a command"
            className="flex-1 bg-transparent py-3.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          <kbd className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-0.5">ESC</kbd>
        </div>
        <div ref={listRef} className="max-h-80 overflow-y-auto thin-scrollbar py-2">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-400">No matches.</p>
          ) : (
            filtered.map((c, i) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.id}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(c)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm',
                    i === active ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-300'
                  )}
                >
                  {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
                  <span className="flex-1">{c.label}</span>
                  <span className="text-[11px] text-slate-400">{c.hint}</span>
                  {i === active && <CornerDownLeft className="w-3.5 h-3.5 text-slate-400" />}
                </button>
              );
            })
          )}
        </div>
        <div className="flex items-center gap-3 px-4 py-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400">
          <span className="flex items-center gap-1"><Command className="w-3 h-3" />K to toggle</span>
          <span>↑↓ to navigate</span>
          <span>↵ to select</span>
        </div>
      </div>
    </div>
  );
}
