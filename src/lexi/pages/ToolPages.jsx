// ============================================================
// lexi/pages/ToolPages.jsx — focused AI tools built on PromptTool
//   Notes → Brief · Pleadings · Witness Prep · Settlement · Due Diligence
// ============================================================

import React from 'react';
import { StickyNote, ScrollText, UserCheck, Handshake, FileSearch } from 'lucide-react';
import { PromptTool } from '../components/PromptTool.jsx';
import { COURTS } from '../legalData.js';

export function NotesToBrief() {
  return (
    <PromptTool
      icon={StickyNote}
      title="Notes → Brief"
      subtitle="Turn rough case notes into a structured legal brief"
      gradient="from-amber-400 to-orange-500"
      feature="notes-brief"
      resultTitle="Legal Brief"
      intro="Paste your raw notes, instructions, or facts. LexiAssist organises them into a clean brief: facts, issues, applicable law, analysis, and recommended next steps."
      fields={[
        { key: 'notes', label: 'Your raw notes / instructions', placeholder: 'Client called re: land dispute at Lekki; neighbour built on boundary; survey plan from 2019; no C of O yet…', rows: 10, required: true },
      ]}
      systemInstruction="You are a Nigerian legal assistant. Convert the lawyer's rough notes into a well-structured legal brief with the headings: 1) Parties & Background, 2) Facts, 3) Issues for Determination, 4) Applicable Law (statutes + authorities), 5) Preliminary Analysis, 6) Recommended Next Steps & Documents. Be concise and practical; flag missing information the lawyer should obtain."
      buildUserText={(v) => `Convert these notes into a structured brief:\n\n${v.notes}`}
    />
  );
}

export function Pleadings() {
  return (
    <PromptTool
      icon={ScrollText}
      title="Pleadings Drafter"
      subtitle="Draft court-ready pleadings in correct Nigerian form"
      gradient="from-rose-400 to-red-500"
      feature="pleadings"
      resultTitle="Draft Pleading"
      defaultMode="comprehensive"
      intro="Generate a properly formatted Nigerian pleading. Use [PLACEHOLDER] for details you have not supplied — they are easy to find and complete."
      fields={[
        { key: 'doc', label: 'Document to draft', kind: 'select', options: [
          { value: 'Statement of Claim', label: 'Statement of Claim' },
          { value: 'Statement of Defence', label: 'Statement of Defence' },
          { value: 'Reply', label: 'Reply' },
          { value: 'Counter-Claim', label: 'Counter-Claim' },
          { value: 'Originating Summons', label: 'Originating Summons' },
          { value: 'Motion on Notice', label: 'Motion on Notice' },
          { value: 'Affidavit in Support', label: 'Affidavit in Support' },
          { value: 'Written Address', label: 'Written Address' },
          { value: 'Notice of Appeal', label: 'Notice of Appeal' },
        ] },
        { key: 'court', label: 'Court', kind: 'select', options: COURTS.map((c) => ({ value: c, label: c })) },
        { key: 'facts', label: 'Facts / instructions', placeholder: 'Parties, suit number (if any), the claim, key facts, reliefs sought…', rows: 8, required: true },
      ]}
      systemInstruction="You are a Nigerian litigation draftsman. Produce a complete, properly formatted pleading using correct Nigerian court formatting (court heading, parties, suit number, numbered paragraphs, reliefs, dating and counsel block). Use [PLACEHOLDER] for any missing details. Ensure the document type and court match the instructions."
      buildUserText={(v) => `Draft a ${v.doc} for the ${v.court}.\n\nFacts/instructions:\n${v.facts}`}
    />
  );
}

export function WitnessPrep() {
  return (
    <PromptTool
      icon={UserCheck}
      title="Witness Preparation"
      subtitle="Examination-in-chief and cross-examination planning"
      gradient="from-sky-400 to-blue-500"
      feature="witness-prep"
      resultTitle="Witness Prep Plan"
      intro="Generate a witness-preparation plan: themes, examination-in-chief questions, anticipated cross-examination, and how to handle difficult areas. For lawyer use — not witness coaching to fabricate evidence."
      fields={[
        { key: 'role', label: 'Witness role', kind: 'input', placeholder: 'e.g. Claimant / eyewitness / expert surveyor' },
        { key: 'matter', label: 'Matter & facts the witness can speak to', placeholder: 'Nature of the case and what this witness knows…', rows: 8, required: true },
      ]}
      systemInstruction="You are a Nigerian trial advocate preparing a witness. Produce: 1) Key themes the witness supports, 2) Examination-in-chief question outline (non-leading), 3) Likely cross-examination lines and how to withstand them honestly, 4) Documents to tender through this witness and the foundation needed (Evidence Act 2011), 5) Demeanour/practical tips. Emphasise truthful testimony — never suggest fabricating or tailoring false evidence."
      buildUserText={(v) => `Prepare a witness (${v.role || 'witness'}) for trial.\n\nMatter & knowledge:\n${v.matter}`}
    />
  );
}

export function Settlement() {
  return (
    <PromptTool
      icon={Handshake}
      title="Settlement & Negotiation"
      subtitle="Demand letters, settlement analysis, and terms"
      gradient="from-emerald-400 to-green-500"
      feature="settlement"
      resultTitle="Settlement Output"
      intro="Draft a settlement/demand letter, analyse a settlement position (BATNA/WATNA), or generate Terms of Settlement for adoption as consent judgment."
      fields={[
        { key: 'kind', label: 'Output', kind: 'select', options: [
          { value: 'Demand letter', label: 'Demand letter' },
          { value: 'Settlement position analysis (BATNA/WATNA)', label: 'Settlement position analysis (BATNA/WATNA)' },
          { value: 'Terms of Settlement (consent judgment)', label: 'Terms of Settlement (consent judgment)' },
        ] },
        { key: 'facts', label: 'Matter, parties, and your client’s objectives', placeholder: 'What happened, the amount/relief in issue, what your client wants, any deadline…', rows: 8, required: true },
      ]}
      systemInstruction="You are a Nigerian dispute-resolution lawyer. Depending on the requested output, draft a firm but professional demand letter, OR a candid settlement analysis (best/worst alternative to a negotiated agreement, realistic range, leverage), OR Terms of Settlement suitable for adoption as a consent judgment. Reflect Nigerian practice and the Evidence Act position on 'without prejudice' communications where relevant."
      buildUserText={(v) => `Produce: ${v.kind}.\n\nMatter:\n${v.facts}`}
    />
  );
}

export function DueDiligence() {
  return (
    <PromptTool
      icon={FileSearch}
      title="Due Diligence"
      subtitle="Legal due-diligence checklists and red-flag analysis"
      gradient="from-indigo-400 to-violet-500"
      feature="due-diligence"
      resultTitle="Due Diligence Output"
      defaultMode="comprehensive"
      intro="Generate a tailored legal due-diligence checklist and red-flag framework for a transaction or counterparty under Nigerian law (CAMA 2020, CAC searches, land/title, tax, regulatory, litigation searches)."
      fields={[
        { key: 'type', label: 'Transaction / subject', kind: 'select', options: [
          { value: 'Company acquisition / investment', label: 'Company acquisition / investment' },
          { value: 'Real estate / land purchase', label: 'Real estate / land purchase' },
          { value: 'Joint venture', label: 'Joint venture' },
          { value: 'Lending / security', label: 'Lending / security' },
          { value: 'Counterparty KYC', label: 'Counterparty KYC' },
          { value: 'Other', label: 'Other' },
        ], required: true },
        { key: 'detail', label: 'Specifics', placeholder: 'Target/asset, sector, value, what your client is worried about…', rows: 7, required: true },
      ]}
      systemInstruction="You are a Nigerian corporate/commercial lawyer running legal due diligence. Produce: 1) Scope, 2) Document request list, 3) Searches to conduct (CAC/CAMA, land registry & Governor's consent, court/litigation, tax/FIRS, regulatory), 4) Red flags to watch for, 5) Risk matrix and recommended conditions precedent/warranties. Tailor to the transaction type."
      buildUserText={(v) => `Run legal due diligence for: ${v.type}.\n\nDetails:\n${v.detail}`}
    />
  );
}
