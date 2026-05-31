// ============================================================
// App.jsx — entry point + navigation routing (mirrors app.py)
// ============================================================

import React, { useEffect } from 'react';
import { AppProvider, useApp } from './lexi/AppContext.jsx';
import { Layout } from './lexi/components/Layout.jsx';
import { AuthGate } from './lexi/components/AuthGate.jsx';
import { CommandPalette } from './lexi/components/CommandPalette.jsx';
import { Onboarding } from './lexi/components/Onboarding.jsx';
import { ToastContainer } from './lexi/components/Toast.jsx';
import { storage, STORAGE_KEYS } from './lexi/database.js';
import { runMigrations } from './lexi/migrator.js';
import { registerVerifiedCases } from './lexi/citations.js';

import { Home } from './lexi/pages/Home.jsx';
import { AIAssistant } from './lexi/pages/AIAssistant.jsx';
import { Chat } from './lexi/pages/Chat.jsx';
import { Research } from './lexi/pages/Research.jsx';
import { NotesToBrief, Pleadings, WitnessPrep, Settlement, DueDiligence } from './lexi/pages/ToolPages.jsx';
import { Cases } from './lexi/pages/Cases.jsx';
import { Tasks } from './lexi/pages/Tasks.jsx';
import { ConflictCheck } from './lexi/pages/ConflictCheck.jsx';
import { Clients } from './lexi/pages/Clients.jsx';
import { FeeCalculator } from './lexi/pages/FeeCalculator.jsx';
import { Tools } from './lexi/pages/Tools.jsx';
import { PracticeUpdates } from './lexi/pages/PracticeUpdates.jsx';
import { AuthorityVerify } from './lexi/pages/AuthorityVerify.jsx';
import { Templates } from './lexi/pages/Templates.jsx';
import { GlobalSearch } from './lexi/pages/GlobalSearch.jsx';
import { Profile } from './lexi/pages/Profile.jsx';
import { Help, Privacy, Terms } from './lexi/pages/InfoPages.jsx';
import { Admin } from './lexi/pages/Admin.jsx';
import { AuditLog } from './lexi/pages/AuditLog.jsx';
import { Feedback } from './lexi/pages/Feedback.jsx';

const PAGES = {
  home: Home,
  ai: AIAssistant,
  chat: Chat,
  research: Research,
  notes: NotesToBrief,
  cases: Cases,
  tasks: Tasks,
  pleadings: Pleadings,
  conflict: ConflictCheck,
  clients: Clients,
  fees: FeeCalculator,
  tools: Tools,
  updates: PracticeUpdates,
  authority: AuthorityVerify,
  witness: WitnessPrep,
  settlement: Settlement,
  diligence: DueDiligence,
  templates: Templates,
  search: GlobalSearch,
  profile: Profile,
  help: Help,
  privacy: Privacy,
  terms: Terms,
  audit: AuditLog,
  admin: Admin,
  feedback: Feedback,
};

function Router() {
  const { activePage } = useApp();
  const Page = PAGES[activePage] || Home;
  return (
    <Layout>
      <Page />
    </Layout>
  );
}

export default function App() {
  // Run datastore migrations + load admin-added verified cases on boot.
  useEffect(() => {
    try {
      runMigrations();
      const extra = storage.get(STORAGE_KEYS.ADMIN_CASES, []);
      if (Array.isArray(extra) && extra.length) registerVerifiedCases(extra);
    } catch {
      /* noop */
    }
  }, []);

  return (
    <AppProvider>
      <AuthGate>
        <Router />
        <Onboarding />
        <CommandPalette />
      </AuthGate>
      <ToastContainer />
    </AppProvider>
  );
}
