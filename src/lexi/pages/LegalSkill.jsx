// ============================================================
// lexi/pages/LegalSkill.jsx — Legal Analysis Skill
//
// Implements the legal-analysis skill with IRAC reasoning,
// risk classification, clause redlining, NDA triage, compliance
// checks, legal risk assessment, and document drafting —
// all powered by the Gemini AI with Nigerian law specifics.
// ============================================================

import React, { useState, useRef } from 'react';
import {
  Scale, FileSearch, ShieldCheck, AlertTriangle, FileText,
  ClipboardList, Gavel, Search, Sparkles, Square, Upload,
  X, ChevronDown, ChevronUp, Info, BookOpen, PenTool,
  BarChart2, CheckCircle2, Circle,
} from 'lucide-react';
import { useApp } from '../AppContext.jsx';
import { useAiRun } from '../useAiRun.js';
import {
  Card, Button, Input, Select, Textarea, Badge,
  PageHeader, Toggle,
} from '../components/ui.jsx';
import { AiResult } from '../components/AiResult.jsx';
import { extractDocument, ACCEPTED_DOC_TYPES } from '../docParse.js';
import { wrapDocument } from '../prompts.js';
import { cn } from '../utils.js';

// ── Master Legal Skill System Prompt ─────────────────────────────────────────
const LEGAL_SKILL_BASE = `You are operating as a Senior Legal Analyst with deep expertise in commercial law, contract analysis, regulatory compliance, and Nigerian legal practice. You apply rigorous legal reasoning — issue-spotting, rule application, and risk assessment — producing practical, actionable output.

JURISDICTION PRIORITY: Nigerian law applies by default (common law, CAMA 2020, NDPA 2023, Labour Act, Evidence Act 2011, Arbitration and Mediation Act 2023, CBN regulations, NITDA guidelines). Flag where foreign law may apply.

CORE LEGAL ANALYSIS PROTOCOL:
Apply the IRAC structure to every material legal question:
  I — Issue: State the precise legal question
  R — Rule: Identify the governing law, regulation, case, or clause
  A — Application: Apply the rule to the specific facts
  C — Conclusion: State the legal position and risk level

RISK CLASSIFICATION (use these labels consistently):
  🔴 CRITICAL — Voids contract, creates criminal liability, or exposes to major damages → Do not proceed without legal resolution
  🟠 HIGH — Material financial, regulatory, or reputational risk → Negotiate out or escalate to counsel
  🟡 MEDIUM — Unfavourable but manageable; standard risk in the industry → Negotiate if possible, flag and accept if not
  🟢 LOW — Minor or theoretical risk; market standard → Note but proceed

CLAUSE REDLINING FORMAT (use whenever suggesting revised language):
  ORIGINAL: "[exact original clause text]"
  ISSUE: [what this clause does and why it creates risk]
  RISK LEVEL: [🔴/🟠/🟡/🟢]
  SUGGESTED REVISION: "[improved clause language]"
  NEGOTIATING NOTE: [how to position in negotiation; likely counterparty response]

NIGERIAN LAW FLAGS (always check):
  - Unsigned agreements — enforceability in practice vs. theory
  - Foreign governing law for agreements to be enforced in Nigeria
  - Arbitration seats with no Nigeria enforcement treaty
  - Data transfer clauses without NDPA 2023 compliance mechanisms
  - IP assignment without consideration (may be unenforceable)
  - Land transactions without Land Use Act compliance
  - Employment terms inconsistent with the Labour Act

QUALITY CONTROL (complete every response):
  ✓ Governing law and jurisdiction identified
  ✓ User's position and exposure identified
  ✓ All material issues spotted (not just obvious ones)
  ✓ IRAC applied to each material issue
  ✓ Risk levels assigned
  ✓ Practical recommendation given for each issue
  ✓ Alternative clause language provided where relevant
  ✓ Appropriate disclaimer at end

DISCLAIMER (append to every response): "⚠️ This is legal analysis and information, not legal advice. For matters with significant legal consequences, consult a qualified lawyer in the relevant jurisdiction."`;

// ── Mode Configurations ───────────────────────────────────────────────────────
const MODES = [
  {
    id: 'review-contract',
    label: 'Contract Review',
    icon: FileSearch,
    color: 'from-blue-400 to-indigo-500',
    badge: '/review-contract',
    description: 'Full clause-by-clause review with risk matrix and redlined alternatives.',
    placeholder: 'Paste the full contract text here, or upload the document below…',
    inputLabel: 'Contract / Agreement Text',
    extraFields: [
      { key: 'position', label: "Your client's position", type: 'select', options: ['Party A (offeror / vendor / licensor)', 'Party B (offeree / purchaser / licensee)', 'Neutral reviewer', 'Regulator / compliance officer'] },
      { key: 'concern', label: 'Specific concern (optional)', type: 'input', placeholder: 'e.g. liability caps, data protection, termination rights' },
    ],
    systemSuffix: `CONTRACT REVIEW TASK:
Conduct a systematic review covering all of the following:
1. FUNDAMENTAL TERMS: Parties, consideration, governing law, effective date, term, renewal
2. PERFORMANCE OBLIGATIONS: Obligations of each party, deliverables, timelines, performance standards
3. PAYMENT TERMS: Amount, schedule, late payment, invoice process, set-off rights
4. RISK ALLOCATION: Limitation of liability, indemnification, warranties, force majeure
5. INTELLECTUAL PROPERTY: Ownership, licenses (scope/exclusivity/territory/duration), background vs. foreground IP
6. CONFIDENTIALITY: Scope, obligations, duration, standard exceptions
7. TERMINATION: Convenience, cause, cure period, consequences, data return
8. DISPUTE RESOLUTION: Escalation ladder, arbitration clause, jurisdiction

For each risk found, use the CLAUSE REDLINING FORMAT above.
End with an EXECUTIVE SUMMARY TABLE:
| Issue | Clause | Risk Level | Recommendation |
|-------|--------|------------|---------------|`,
    userPrefix: (vals) => `Please conduct a full legal review of the following agreement.\nMy client's position: ${vals.position || 'Party B (reviewing before signing)'}${vals.concern ? `\nParticular concern: ${vals.concern}` : ''}\n\nCONTRACT TEXT:\n`,
  },
  {
    id: 'triage-nda',
    label: 'NDA Triage',
    icon: ShieldCheck,
    color: 'from-emerald-400 to-teal-500',
    badge: '/triage-nda',
    description: 'Classify the NDA as GREEN (standard), YELLOW (counsel review), or RED (full legal review).',
    inputLabel: 'NDA Text',
    placeholder: 'Paste the NDA text here, or upload the document below…',
    extraFields: [
      { key: 'side', label: 'Disclosing or receiving?', type: 'select', options: ['Receiving party (we receive confidential info)', 'Disclosing party (we share confidential info)', 'Mutual (both parties disclose)'] },
    ],
    systemSuffix: `NDA TRIAGE TASK:
Rapidly triage this NDA and produce a clear classification:

CLASSIFICATION:
  🟢 GREEN — Standard, acceptable NDA → can sign under standard delegation
  🟡 YELLOW — Non-standard provisions → legal counsel review recommended before signing  
  🔴 RED — Material risks or unusual provisions → full legal review required

CHECK SPECIFICALLY FOR:
  - Definition of Confidential Information (too broad? too narrow?)
  - Duration of confidentiality obligations (reasonable? perpetual?)
  - Scope of permitted use
  - Permitted disclosures (employees, advisers, courts — standard carve-outs present?)
  - Return/destruction obligations on termination
  - Residuals clause (allows use of information "retained in unaided memory" — risky)
  - Non-solicitation or non-compete clauses embedded in the NDA
  - Governing law and jurisdiction
  - One-sided vs. mutual obligations
  - IP assignment language hidden in the NDA
  - Injunctive relief / waiver of damages limitations

OUTPUT FORMAT:
1. CLASSIFICATION: [GREEN/YELLOW/RED] with one-sentence reason
2. KEY FLAGS: Bullet list of issues found with risk levels
3. MUST-FIX BEFORE SIGNING: Items that require negotiation (for YELLOW/RED)
4. STANDARD CLAUSES PRESENT: What's already acceptable
5. RECOMMENDED EDITS: Specific language changes`,
    userPrefix: (vals) => `Please triage this NDA.\nOur position: ${vals.side || 'Receiving party'}\n\nNDA TEXT:\n`,
  },
  {
    id: 'compliance-check',
    label: 'Compliance Check',
    icon: CheckCircle2,
    color: 'from-violet-400 to-fuchsia-500',
    badge: '/compliance-check',
    description: 'Surface applicable regulations, required approvals, and risk areas for a product or action.',
    inputLabel: 'Describe the feature, product, or business activity',
    placeholder: 'e.g. We want to launch a fintech app that collects biometric data from Nigerian users and processes payments via a third-party payment processor in the US…',
    extraFields: [
      { key: 'industry', label: 'Industry / sector', type: 'select', options: ['Technology / Software', 'Fintech / Payments', 'Healthcare', 'E-commerce', 'Real Estate', 'Media / Content', 'Manufacturing', 'General / Other'] },
      { key: 'jurisdiction', label: 'Primary jurisdiction', type: 'select', options: ['Nigeria (Federal)', 'Lagos State', 'Abuja (FCT)', 'Other Nigerian State', 'Nigeria + UK', 'Nigeria + US', 'Nigeria + EU', 'Multi-jurisdictional'] },
    ],
    systemSuffix: `COMPLIANCE CHECK TASK:
Conduct a systematic compliance analysis covering:

1. APPLICABLE REGULATIONS: List every law, regulation, guideline, or code that applies
2. REQUIRED APPROVALS / LICENCES: What must be obtained before proceeding?
3. DATA PROTECTION (NDPA 2023 / NDPR): 
   - Lawful basis for processing
   - Data subject rights implementation required
   - Privacy notice requirements
   - Cross-border transfer mechanisms
   - DPO requirement?
   - Breach notification process
4. SECTORAL REGULATION: Apply sector-specific rules (CBN, SEC, NAFDAC, NCC, etc.)
5. CORPORATE/COMMERCIAL: Company law, consumer protection, advertising standards
6. EMPLOYMENT LAW: If staff are involved, Labour Act compliance
7. GAP ANALYSIS: What the client currently has vs. what's required
8. REMEDIATION ROADMAP: Prioritised steps to achieve compliance (Critical first)

OUTPUT FORMAT:
| Regulation | Requirement | Current Status | Action Required | Priority |
|-----------|-------------|----------------|-----------------|----------|`,
    userPrefix: (vals) => `Please conduct a compliance check for the following.\nIndustry: ${vals.industry || 'Technology'}\nPrimary jurisdiction: ${vals.jurisdiction || 'Nigeria (Federal)'}\n\nDESCRIPTION:\n`,
  },
  {
    id: 'legal-risk-assessment',
    label: 'Risk Assessment',
    icon: AlertTriangle,
    color: 'from-amber-400 to-orange-500',
    badge: '/legal-risk-assessment',
    description: 'Classify legal risks by severity × likelihood with escalation criteria.',
    inputLabel: 'Describe the situation, transaction, or dispute',
    placeholder: 'e.g. Our client entered a contract to supply 500 tonnes of goods. The supplier has failed to deliver and is now claiming force majeure due to a port strike. Our client faces losses of ₦120m…',
    extraFields: [
      { key: 'client_position', label: 'Client position', type: 'select', options: ['Claimant / Plaintiff (seeking remedy)', 'Defendant / Respondent (defending claim)', 'Contracting party (risk review before committing)', 'Investor / Acquirer (due diligence)', 'Regulator / Compliance'] },
    ],
    systemSuffix: `LEGAL RISK ASSESSMENT TASK:
Produce a structured legal risk register covering:

RISK MATRIX (Severity × Likelihood):
  Severity: Critical (4) / High (3) / Medium (2) / Low (1)
  Likelihood: Very Likely (4) / Likely (3) / Unlikely (2) / Remote (1)
  Risk Score = Severity × Likelihood

For each identified risk:
1. RISK DESCRIPTION: What is the legal risk?
2. GOVERNING LAW: What statute, case, or doctrine applies?
3. SEVERITY: Critical / High / Medium / Low
4. LIKELIHOOD: Very Likely / Likely / Unlikely / Remote
5. RISK SCORE: [1-16]
6. FINANCIAL EXPOSURE: Estimated range if quantifiable
7. MITIGATION: Steps to reduce the risk
8. ESCALATION TRIGGER: The event or threshold that requires immediate escalation to senior counsel

Output a RISK REGISTER TABLE followed by EXECUTIVE SUMMARY:
| Risk | Law/Basis | Severity | Likelihood | Score | Mitigation |
|------|-----------|----------|------------|-------|------------|

Then: TOP 3 PRIORITY RISKS with detailed IRAC analysis.
Then: RECOMMENDED IMMEDIATE ACTIONS.`,
    userPrefix: (vals) => `Please conduct a legal risk assessment for the following.\nClient position: ${vals.client_position || 'Contracting party'}\n\nSITUATION:\n`,
  },
  {
    id: 'issue-spotting',
    label: 'Issue Spotting',
    icon: Search,
    color: 'from-cyan-400 to-blue-500',
    badge: '/brief',
    description: 'IRAC analysis across all material legal issues in a document or situation.',
    inputLabel: 'Describe the legal situation or paste the document',
    placeholder: 'e.g. A client has been operating a lending business via a mobile app without CBN approval for 2 years. They have 50,000 active loans outstanding and want to seek retroactive approval. Describe the legal landscape…',
    extraFields: [
      { key: 'focus', label: 'Focus area (optional)', type: 'select', options: ['All issues (comprehensive)', 'Contract law issues', 'Regulatory / compliance issues', 'Criminal / liability exposure', 'IP and technology law', 'Employment law', 'Land and property law', 'Dispute resolution options'] },
    ],
    systemSuffix: `LEGAL ISSUE SPOTTING TASK:
Identify and analyse ALL material legal issues using IRAC:

For EACH issue:
  ■ ISSUE: [Precise legal question]
  ■ RULE: [Governing statute, regulation, case, or contractual provision — with section numbers]
  ■ APPLICATION: [How the rule applies to the specific facts]
  ■ CONCLUSION: [Legal position + risk level 🔴🟠🟡🟢]
  ■ PRACTICAL RECOMMENDATION: [What the client should do about this issue]

After all issues:
  PRIORITY ACTION LIST: Ordered by urgency (most time-sensitive first)
  MISSING INFORMATION: What additional facts/documents are needed for complete analysis
  REFERRAL NOTE: Which issues require specialist counsel (tax, IP, criminal, etc.)`,
    userPrefix: (vals) => `Please spot and analyse all legal issues in the following.\nFocus: ${vals.focus || 'All issues (comprehensive)'}\n\nFACTS / DOCUMENT:\n`,
  },
  {
    id: 'draft-document',
    label: 'Draft Document',
    icon: PenTool,
    color: 'from-rose-400 to-pink-500',
    badge: '/legal-response',
    description: 'Draft NDAs, contracts, clauses, demand letters, or compliance policies.',
    inputLabel: 'Describe what you need drafted',
    placeholder: 'e.g. Draft a mutual NDA for an AI startup sharing training data with a data vendor. Mutual confidentiality, 2 years post-termination, Lagos arbitration, Nigerian law, exclude residuals clause…',
    extraFields: [
      { key: 'doc_type', label: 'Document type', type: 'select', options: ['Non-Disclosure Agreement (NDA)', 'Service Agreement', 'Employment Contract', 'Consultancy Agreement', 'Software Licence', 'Data Processing Agreement (DPA)', 'Shareholder Agreement', 'Term Sheet', 'Demand Letter', 'Legal Opinion / Memo', 'Privacy Policy', 'Terms of Service', 'Other'] },
      { key: 'governing_law', label: 'Governing law', type: 'select', options: ['Nigerian law (Lagos)', 'Nigerian law (Abuja)', 'Nigerian law (other state)', 'English law', 'Other'] },
    ],
    systemSuffix: `LEGAL DOCUMENT DRAFTING TASK:
Draft a complete, professionally structured legal document. Requirements:
- Use correct Nigerian legal drafting conventions
- Include all standard provisions for this document type
- Use [PLACEHOLDER] for all information not supplied
- Flag any provisions that may need jurisdiction-specific tailoring
- After the draft, provide DRAFTING NOTES explaining key choices and flagging anything the client should review

DOCUMENT STANDARDS:
  - Clear, precise, unambiguous language
  - Defined terms used consistently
  - All cross-references correct
  - Execution block appropriate to the parties (individuals vs. companies)
  - Nigerian stamp duty implications noted where relevant`,
    userPrefix: (vals) => `Please draft the following legal document.\nDocument type: ${vals.doc_type || 'Other'}\nGoverning law: ${vals.governing_law || 'Nigerian law (Lagos)'}\n\nDRAFTING INSTRUCTIONS:\n`,
  },
  {
    id: 'meeting-briefing',
    label: 'Meeting Briefing',
    icon: ClipboardList,
    color: 'from-slate-500 to-slate-700',
    badge: '/meeting-briefing',
    description: 'Structured pre-meeting briefing for contract negotiations, compliance reviews, board meetings.',
    inputLabel: 'Describe the meeting and its context',
    placeholder: 'e.g. I have a contract negotiation meeting tomorrow with a US SaaS vendor about their enterprise agreement. We process employee HR data on their platform. The main issues are liability caps, data residency, and termination fees…',
    extraFields: [
      { key: 'meeting_type', label: 'Meeting type', type: 'select', options: ['Contract negotiation', 'Compliance review', 'Board / investor meeting', 'Dispute / mediation', 'Regulatory meeting', 'Due diligence session', 'Client advisory meeting', 'Other'] },
    ],
    systemSuffix: `MEETING BRIEFING TASK:
Produce a structured pre-meeting briefing:

1. MEETING OBJECTIVE: What must be achieved in this meeting?
2. KEY LEGAL ISSUES: The 3-5 most important legal points on the agenda
3. OUR POSITION (by issue): What position should we take and why?
4. THEIR LIKELY POSITION: What will the other side argue?
5. NEGOTIATING STRATEGY: Recommended approach, concessions we can make vs. red lines
6. WALKAWAY POINTS: Issues on which we cannot compromise and why
7. QUESTIONS TO ASK: Information we need to extract in the meeting
8. RISKS IF WE AGREE / RISKS IF WE DON'T: For each major issue
9. NEXT STEPS TEMPLATE: Draft action items to close out the meeting

End with: PREP CHECKLIST — documents to bring, authority limits to confirm, specialists to loop in.`,
    userPrefix: (vals) => `Please prepare a pre-meeting briefing.\nMeeting type: ${vals.meeting_type || 'Contract negotiation'}\n\nCONTEXT:\n`,
  },
];

// ── Expandable Instruction Panel ──────────────────────────────────────────────
function InstructionPanel({ mode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-500" />
          What this skill checks & how it outputs results
        </div>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-2 text-sm text-slate-600 dark:text-slate-300 space-y-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">Risk Levels Used</p>
              <ul className="space-y-1 text-xs">
                <li><span className="font-bold">🔴 Critical</span> — Voids contract or criminal liability</li>
                <li><span className="font-bold">🟠 High</span> — Material financial or regulatory risk</li>
                <li><span className="font-bold">🟡 Medium</span> — Unfavourable but manageable</li>
                <li><span className="font-bold">🟢 Low</span> — Minor or theoretical risk</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">Analysis Framework</p>
              <ul className="space-y-1 text-xs">
                <li><span className="font-bold">I</span> — Issue: The precise legal question</li>
                <li><span className="font-bold">R</span> — Rule: Governing law or clause</li>
                <li><span className="font-bold">A</span> — Application: How rule meets facts</li>
                <li><span className="font-bold">C</span> — Conclusion: Position + risk level</li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400">
            <strong>Nigerian law default:</strong> CAMA 2020 · NDPA 2023 · Labour Act · Evidence Act 2011 · Arbitration & Mediation Act 2023 · CBN regulations · NITDA guidelines
          </p>
        </div>
      )}
    </div>
  );
}

// ── Mode Panel ────────────────────────────────────────────────────────────────
function ModePanel({ mode, onRun, ai }) {
  const { webGrounding } = useApp();
  const [text, setText] = useState('');
  const [extraVals, setExtraVals] = useState({});
  const [doc, setDoc] = useState(null);
  const [docBusy, setDocBusy] = useState(false);
  const [useGrounding, setUseGrounding] = useState(webGrounding);
  const fileRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setDocBusy(true);
    try {
      const parsed = await extractDocument(file);
      setDoc(parsed);
    } catch (e) {
      alert(e.message);
    } finally { setDocBusy(false); }
  };

  const buildPrompt = () => {
    const prefix = mode.userPrefix ? mode.userPrefix(extraVals) : '';
    let content = text.trim();
    if (doc) content += (content ? '\n\n' : '') + wrapDocument(doc.sanitized);
    return prefix + content;
  };

  const canRun = text.trim() || doc;

  return (
    <div className="space-y-4">
      <InstructionPanel mode={mode} />

      <Card variant="glass" className="space-y-4">
        {/* Extra fields */}
        {mode.extraFields && mode.extraFields.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-3">
            {mode.extraFields.map(f =>
              f.type === 'select' ? (
                <Select key={f.key} label={f.label} value={extraVals[f.key] || f.options[0]}
                  onChange={e => setExtraVals(v => ({ ...v, [f.key]: e.target.value }))}
                  options={f.options.map(o => ({ value: o, label: o }))} />
              ) : (
                <Input key={f.key} label={f.label} value={extraVals[f.key] || ''}
                  onChange={e => setExtraVals(v => ({ ...v, [f.key]: e.target.value }))}
                  placeholder={f.placeholder || ''} />
              )
            )}
          </div>
        )}

        {/* Document upload */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Upload document (PDF / DOCX / TXT) or paste text below</p>
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept={ACCEPTED_DOC_TYPES} className="hidden"
              onChange={e => handleFile(e.target.files?.[0])} />
            <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()} isLoading={docBusy}
              leftIcon={<Upload className="w-4 h-4" />}>Upload</Button>
          </div>
        </div>
        {doc && (
          <div className="flex items-center gap-2 text-sm bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-3 py-2">
            <FileText className="w-4 h-4 text-emerald-500" />
            <span className="text-emerald-700 dark:text-emerald-300 font-medium">{doc.name}</span>
            <Badge variant="default">{doc.chars.toLocaleString()} chars</Badge>
            <button onClick={() => setDoc(null)} className="ml-auto text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>
        )}

        <Textarea label={mode.inputLabel} rows={8}
          placeholder={mode.placeholder || 'Paste text or describe the situation…'}
          value={text} onChange={e => setText(e.target.value)} />

        <div className="flex items-center justify-between flex-wrap gap-3">
          <Toggle checked={useGrounding} onChange={setUseGrounding} label="Live web grounding" hint="Cite current regulations and case law" />
          <div className="flex gap-2">
            {ai.running ? (
              <Button variant="danger" onClick={ai.stop} leftIcon={<Square className="w-4 h-4" />}>Stop</Button>
            ) : (
              <Button onClick={() => onRun(buildPrompt(), mode, useGrounding)} disabled={!canRun}
                leftIcon={<Sparkles className="w-5 h-5" />}>
                Run {mode.label}
              </Button>
            )}
          </div>
        </div>
      </Card>

      <AiResult ai={ai} title={mode.label} exportTitle={`LexiAssist — ${mode.label}`} showAudit />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function LegalSkill() {
  const { apiKey, aiReady, model, profile, navigate } = useApp();
  const ai = useAiRun('legal-skill');
  const [activeMode, setActiveMode] = useState('review-contract');

  const mode = MODES.find(m => m.id === activeMode) || MODES[0];

  const runAnalysis = (userText, selectedMode, useGrounding) => {
    const systemInstruction = [
      LEGAL_SKILL_BASE,
      `\n\nFIRM CONTEXT: ${profile.firmName || 'Nigerian legal practice'}.`,
      `DEFAULT JURISDICTION: ${profile.defaultJurisdiction || 'Nigeria (Federal)'}.`,
      '\n\n' + selectedMode.systemSuffix,
    ].join('\n');

    ai.run({
      systemInstruction,
      userText,
      mode: 'comprehensive',
      webGrounding: useGrounding,
      thinking: true,
      qualityGate: false,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Scale}
        title="Legal Analysis Skill"
        subtitle="Contract review · NDA triage · Compliance check · Risk assessment · Issue spotting · Document drafting"
        gradient="from-slate-600 to-slate-900"
      >
        {!aiReady && (
          <Button size="sm" onClick={() => navigate('profile')}>Add API Key</Button>
        )}
      </PageHeader>

      {!aiReady && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Add your Google Gemini API key in <strong>Profile → AI Settings</strong> to use the Legal Analysis Skill.
          </p>
        </Card>
      )}

      {/* Mode selector — pill tabs with badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {MODES.map(m => {
          const Icon = m.icon;
          const active = activeMode === m.id;
          return (
            <button key={m.id} onClick={() => setActiveMode(m.id)}
              className={cn('flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all',
                active ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 bg-white/50 dark:bg-slate-800/30'
              )}>
              <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center', m.color)}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <span className={cn('text-xs font-semibold leading-tight', active ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-400')}>
                {m.label}
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-700 rounded px-1">{m.badge}</span>
            </button>
          );
        })}
      </div>

      {/* Active mode description */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <div className={cn('w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0', mode.color)}>
          <mode.icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-semibold text-slate-900 dark:text-white text-sm">{mode.label}</p>
          <p className="text-xs text-slate-500">{mode.description}</p>
        </div>
      </div>

      {/* Active mode panel */}
      <ModePanel key={activeMode} mode={mode} onRun={runAnalysis} ai={ai} />

      {/* Footer note */}
      <Card variant="flat" className="text-xs text-slate-400 space-y-1">
        <p className="font-semibold text-slate-600 dark:text-slate-300 text-sm flex items-center gap-1.5">
          <BookOpen className="w-4 h-4" /> Legal Analysis Skill — Nigerian Law Focus
        </p>
        <p>This skill applies Nigerian law by default: CAMA 2020, NDPA 2023, Labour Act, Evidence Act 2011, Arbitration and Mediation Act 2023, CBN/NITDA/SEC regulations. The AI reasons through issues using the IRAC framework and classifies risks as Critical / High / Medium / Low. All output is legal analysis, not legal advice — always verify authorities and consult qualified counsel for consequential matters.</p>
      </Card>
    </div>
  );
}
