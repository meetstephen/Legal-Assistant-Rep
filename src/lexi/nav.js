// ============================================================
// lexi/nav.js — grouped navigation (5 sections, mirrors the README)
// ============================================================

import {
  Home, Brain, BookOpen, StickyNote, FolderOpen, ListChecks, ScrollText,
  ShieldAlert, Users, Calculator, Wrench, Newspaper, ShieldCheck, UserCheck,
  Handshake, FileSearch, Files, Search, User, HelpCircle, Lock, FileText,
  Shield, History, MessageCircle, MessageSquarePlus, CalendarDays,
  Star, Building2,
} from 'lucide-react';

export const NAV_SECTIONS = [
  {
    title: '⚖️ Practice',
    items: [
      { id: 'home',     label: 'Home',          icon: Home           },
      { id: 'ai',       label: 'AI Assistant',   icon: Brain          },
      { id: 'chat',     label: 'AI Chat',         icon: MessageCircle  },
      { id: 'research', label: 'Research',        icon: BookOpen       },
      { id: 'notes',    label: 'Notes → Brief',  icon: StickyNote     },
    ],
  },
  {
    title: '📁 Matters',
    items: [
      { id: 'cases',       label: 'Cases',        icon: FolderOpen,   badge: 'cases'   },
      { id: 'court-diary', label: 'Court Diary',  icon: CalendarDays                   },
      { id: 'tasks',       label: 'Tasks',        icon: ListChecks,   badge: 'tasks'   },
      { id: 'pleadings',   label: 'Pleadings',    icon: ScrollText                     },
      { id: 'conflict',    label: 'Conflict Check', icon: ShieldAlert                  },
    ],
  },
  {
    title: '👥 Clients & Fees',
    items: [
      { id: 'clients', label: 'Clients',       icon: Users,       badge: 'clients' },
      { id: 'fees',    label: 'Fee Calculator', icon: Calculator                    },
    ],
  },
  {
    title: '🔧 Tools',
    items: [
      { id: 'tools',             label: 'Tools',             icon: Wrench      },
      { id: 'updates',           label: 'Practice Updates',  icon: Newspaper   },
      { id: 'authority',         label: 'Authority Verify',  icon: ShieldCheck },
      { id: 'land-transactions', label: 'Land Transactions', icon: Building2   },
      { id: 'witness',           label: 'Witness Prep',      icon: UserCheck   },
      { id: 'settlement',        label: 'Settlement',         icon: Handshake   },
      { id: 'diligence',         label: 'Due Diligence',      icon: FileSearch  },
      { id: 'templates',         label: 'Templates',          icon: Files       },
      { id: 'search',            label: 'Search',             icon: Search      },
    ],
  },
  {
    title: '👤 Account',
    items: [
      { id: 'profile',        label: 'Profile',            icon: User              },
      { id: 'nba-compliance', label: 'NBA Compliance',     icon: Star              },
      { id: 'feedback',       label: 'Feedback',           icon: MessageSquarePlus },
      { id: 'help',           label: 'Help',               icon: HelpCircle        },
      { id: 'privacy',        label: 'Privacy',            icon: Lock              },
      { id: 'terms',          label: 'Terms',              icon: FileText          },
      { id: 'audit',          label: 'Audit Log',          icon: History,  adminOnly: true },
      { id: 'admin',          label: 'Admin',              icon: Shield,   adminOnly: true },
    ],
  },
];

export const ALL_PAGE_IDS = NAV_SECTIONS.flatMap((s) => s.items.map((i) => i.id));
