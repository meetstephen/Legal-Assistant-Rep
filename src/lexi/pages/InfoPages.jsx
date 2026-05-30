// ============================================================
// lexi/pages/InfoPages.jsx — Help · Privacy · Terms
// ============================================================

import React from 'react';
import { HelpCircle, Lock, FileText } from 'lucide-react';
import { Card, PageHeader } from '../components/ui.jsx';
import { BRAND_LABEL, DISCLAIMER } from '../runtime.js';

function Section({ title, children }) {
  return (
    <div>
      <h3 className="font-semibold text-slate-900 dark:text-white mb-1.5">{title}</h3>
      <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1.5">{children}</div>
    </div>
  );
}

export function Help() {
  return (
    <div className="space-y-6">
      <PageHeader icon={HelpCircle} title="Help" subtitle={`Getting the most out of ${BRAND_LABEL}`} gradient="from-sky-400 to-blue-500" />
      <Card variant="glass" className="space-y-5">
        <Section title="1. Add your Gemini API key">
          <p>Go to <strong>Profile → AI Settings</strong> and paste a key from Google AI Studio. For live web grounding and real source links, enable Google Search grounding on the key. The key is stored only in your browser.</p>
        </Section>
        <Section title="2. Turn on live web grounding">
          <p>Flip <strong>🌐 Live web grounding</strong> in the sidebar to put all AI features online. Practice Updates, Research and the citation verifier go online regardless of the switch.</p>
        </Section>
        <Section title="3. How the AI stays accurate">
          <p>Four layers: (a) native reasoning before answering, (b) live web grounding with real source links, (c) a verified Nigerian case/statute database injected into prompts, and (d) a citation audit with one-click live verification (REAL / NOT FOUND / UNCERTAIN).</p>
        </Section>
        <Section title="4. Work from a document">
          <p>In the AI Assistant, upload a PDF/DOCX/TXT and use the one-click chips — Summarise, Spot Risks, Key Terms, Explain to Client. Whole documents are analysed; text is sanitised against prompt injection.</p>
        </Section>
        <Section title="5. Verify before you rely">
          <p>Open the source links and confirm them. The verification databases cover landmark decisions and key statutes but are not exhaustive — always confirm against NWLR, LPELR or Law Pavilion before filing.</p>
        </Section>
      </Card>
    </div>
  );
}

export function Privacy() {
  return (
    <div className="space-y-6">
      <PageHeader icon={Lock} title="Privacy" subtitle="How your data is handled" gradient="from-emerald-500 to-teal-600" />
      <Card variant="glass" className="space-y-5">
        <Section title="Where your data lives">
          <p>This is a client-side application. Your cases, clients, tasks, analyses, templates and settings are stored in your browser&apos;s local storage on this device. They are not sent to any LexiAssist server.</p>
        </Section>
        <Section title="What is sent to Google">
          <p>When you run an AI feature, your prompt (and any document text you attach) is sent directly from your browser to the Google Gemini API using your own API key, subject to Google&apos;s terms and privacy policy. When live web grounding is on, Gemini performs Google Searches to ground the answer.</p>
        </Section>
        <Section title="Your API key">
          <p>Your key is stored locally (lightly obfuscated) and used only to call the Gemini API. It is never transmitted to us. Clear it any time in Profile → AI Settings.</p>
        </Section>
        <Section title="Document handling & security">
          <p>Uploaded documents are parsed in the browser and sanitised against prompt-injection before being sent to the model. Sensitive client data should only be processed in line with your professional confidentiality obligations and applicable data-protection law (e.g. the NDPA 2023).</p>
        </Section>
        <Section title="Your control">
          <p>Export or delete all data at any time from Profile → Data. Clearing your browser storage removes everything.</p>
        </Section>
      </Card>
    </div>
  );
}

export function Terms() {
  return (
    <div className="space-y-6">
      <PageHeader icon={FileText} title="Terms of Service" subtitle="Please read before relying on any output" gradient="from-slate-500 to-slate-700" />
      <Card variant="glass" className="space-y-5">
        <Section title="Professional tool, not legal advice">
          <p>{BRAND_LABEL} provides AI-generated legal information for workflow support, drafting, research and practice management. It is intended for use by qualified Nigerian lawyers and does not constitute legal advice or create a lawyer-client relationship.</p>
        </Section>
        <Section title="Independent verification">
          <p>All statutes, procedural rules, case citations and authorities generated must be independently verified before reliance in court or in advice to clients. Limitation periods are largely governed by state-specific laws — verify against the applicable statute.</p>
        </Section>
        <Section title="No warranty">
          <p>Output may contain errors or omissions and is provided &quot;as is&quot; without warranty. You are responsible for reviewing, correcting and approving anything produced. The authors accept no liability for losses arising from use.</p>
        </Section>
        <Section title="Acceptable use">
          <p>Do not use the tool for unlawful purposes, to generate misleading authorities for filing, or in breach of the Rules of Professional Conduct or your duties to the court.</p>
        </Section>
        <Section title="Third-party services">
          <p>AI generation is provided by Google&apos;s Gemini API under your own key and is subject to Google&apos;s terms. Search grounding uses Google Search.</p>
        </Section>
        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-200">
          <strong>Disclaimer:</strong> {DISCLAIMER}
        </div>
      </Card>
    </div>
  );
}
