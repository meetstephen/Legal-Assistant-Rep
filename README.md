[![React](https://img.shields.io/badge/Built%20with-React%2018-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Bundler-Vite%205-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Gemini](https://img.shields.io/badge/AI-Google%20Gemini%202.5-4285F4?logo=google&logoColor=white)](https://ai.google.dev)
[![Tailwind](https://img.shields.io/badge/Styling-Tailwind%20CSS-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Jurisdiction](https://img.shields.io/badge/Jurisdiction-Nigeria%20🇳🇬-008751)](#)
[![Grounding](https://img.shields.io/badge/Grounding-Live%20Web%20%2B%20Statute%20RAG-059669)](#)
[![Reasoning](https://img.shields.io/badge/Reasoning-Gemini%20Thinking-A29BFE)](#)
[![Beta](https://img.shields.io/badge/Status-Private%20Beta-f59e0b)](#)

# ⚖️ LexiAssist 2.0

**AI-powered legal workspace for Nigerian lawyers — now with native step-by-step reasoning, app-wide live web grounding with real source links, one-click citation verification, and a one-click "work from this document" workflow.**

LexiAssist combines a jurisdiction-focused AI legal assistant with a full law-office management suite — covering research, drafting, case tracking, task management, client management, contract review, document handling, AI usage tracking, persistent storage, and export-ready firm branding.

> **This is the React / Vite build.** The capabilities, logic and feature set are ported from the original Streamlit/Python edition of LexiAssist 2.0, re-implemented as a fast, deployable **single-page web app** (no Python server). Everything runs in the browser against your own Google Gemini API key.

> **Brand vs build:** the app presents itself everywhere as **LexiAssist 2.0**. A precise internal build number is tracked in `src/lexi/runtime.js` (`__version__`) for data records, migrations, and debugging — it is intentionally not shown to users.

---

## What's New in 2.0

| Feature | Description |
|---|---|
| 🧠 Native reasoning ("thinking") | The Gemini 2.5 models reason through the Nigerian legal framework **before** writing the answer, using a native per-mode thinking budget. The reasoning trace is shown in a collapsible **"🧠 How LexiAssist reasoned"** panel so you can audit the logic. |
| 🌐 App-wide live web grounding | A **single sidebar switch — "🌐 Live web grounding (all AI features)"** — puts *every* AI feature online: it searches the live web via Google and grounds the answer in **real, current sources with clickable links**, instead of training-memory. Verified-database grounding and the citation audit still layer on top. |
| 📰 Practice Updates (always live) | The legal news / practice-update feed is **always** sourced live from the web — it fetches real, recent Nigerian developments and shows the **source link for each item**. No fabricated "news". |
| 🔎 Real online research | The **Quick Precedent Finder** (on Home and Research) and the main **Research** page genuinely search the live web for relevant Nigerian cases with source links, instead of relying on the model's memory. |
| 🔍 One-click citation verification | Under the citation audit on any answer, **"🔎 Verify cited case(s) on the live web"** runs a live search and reports each case as **REAL / NOT FOUND / UNCERTAIN** with a source link. |
| 📄 One-click document actions | Drop a contract / pleading / judgment and use one-click chips — **📄 Summarise · ⚠️ Spot Risks · 📋 Key Terms & Obligations · 🗣️ Explain to Client** — each runs instantly with the uploaded document attached. Whole documents are analysed (up to ~60 pages). |
| 🤖 AI Usage tab | Per-call Gemini usage and estimated spend (today / month / all-time, charts, call log, CSV export) lives in **Profile → 🤖 AI Usage**. |
| 🧭 Grouped navigation | A 5-section sidebar (Practice · Matters · Clients & Fees · Tools · Account) replaces the old flat tab bar. |

### ✨ Beyond the original — new in this React edition

These go *further* than the build this mirrors:

| New feature | Why it matters |
|---|---|
| 💬 **AI Chat (multi-turn)** | A persistent, streaming **conversation** that remembers context across turns — the original is single-shot only. Each reply carries its own reasoning trace, live-web sources, and citation audit. Attach a document or a **case as context**, and **save any reply straight to a case**. |
| ⌘K **Command palette** | Press **⌘K / Ctrl+K** (or the header button) to fuzzy-jump to any page and run quick actions (toggle grounding/theme, open chat, sign out) — premium navigation a Streamlit app can't provide. |
| 📲 **Installable PWA + offline** | A web manifest + service worker make LexiAssist **installable** ("Add to Home Screen") and load **offline** for non-AI features. |
| 🧷 **Case → Chat integration** | "Ask AI" on any case opens the chat with that matter preloaded as context. |
| 🔐 **Supabase login + cloud sync** | Optional email auth (password or magic link). When enabled, each lawyer signs in and their workspace **syncs across devices**, isolated per user by Postgres **Row Level Security**. Off by default (local-only) until you set the env vars. |
| 🚦 **AI rate limiting** | Client-side per-user caps (per-minute & per-day, set in Admin) **and** a server-side per-IP limit in the proxy (HTTP 429) — protects a shared key from runaway spend/abuse. |
| ⏳➡️✅ **Deadline → Task** | The Deadline Calculator can **create a High-priority reminder task** (with the computed deadline and a verify-the-state-law note) in one click — connecting Tools to the Task Manager. |
| 🌙 **Dark by default** | Ships in dark theme (flash-free, respects a saved choice), with a one-click toggle. |
| 🎨 **Premium UI** | Layered emerald/teal glow backdrop, glass cards, gradient brand — a polished feel beyond a stock dashboard. |
| 📱 **Mobile-first + installable** | Responsive throughout with iOS safe-area support, plus an installable **PWA** (offline app shell). A **true native iOS/Android** build is a `npx cap add` away via the included Capacitor config (see `DEPLOYMENT.md`). |
| 🛡️ **Hardened security** | Strict CSP + security headers, Supabase auth with password recovery, an optional PBKDF2 device-passcode lock, and dual-layer rate limiting. |
| 🔁 **Datastore migrations** | A versioned `migrator.js` upgrades older saved data on boot, so the workspace keeps working as the schema evolves. |
| 🧪 **CI you can run locally** | `npm run ci` (eslint + vitest + build) reproduces the gate exactly. |

---

## How the AI stays accurate (and how to *prove* it)

LexiAssist is built so a lawyer can **verify** what the AI says, not just trust it. Four layers work together:

1. **Native reasoning before answering** — the model spends a budget of private "thinking" tokens working through the issue, applicable statutes, and authorities before it writes a word. The summarised reasoning is shown so you can check the logic.
2. **Live web grounding (real sources)** — when web grounding is on (and always-on for Practice Updates, Research, and the citation verifier), answers are grounded in **live Google Search results** and the **actual source URLs are shown as clickable links**. Open them and confirm — they are real.
3. **Verified Nigerian database grounding** — landmark Supreme Court / Court of Appeal decisions and core statute provisions are retrieved and injected into the prompt, and every answer is scanned so cited cases are checked against this database.
4. **Citation audit + one-click verifier** — every response is scanned for citations and labelled ✅ Verified / ⚠️ Unverified; one click then runs a **live web check** on the cited cases (REAL / NOT FOUND / UNCERTAIN, with links).

> The Practice Updates feed, Research and the citation verifier force live web search **on by default** — they do not depend on the sidebar switch. The general AI features are **off by default** for web grounding — flip the sidebar switch **🌐 Live web grounding** to put those online too.

### What needs to be enabled on your side
Live grounding uses **Google Search as a tool through the Gemini API**, which draws on your **API key's Search grounding quota** (a free daily allowance on standard Google AI Studio keys, then billable). If a search is ever unavailable, the app **degrades gracefully** via an automatic fallback chain (**thinking + search → search-only → plain**) — it falls back to verified-database grounding and still answers.

---

## Features

### 🤖 AI Legal Assistant
- **Eight task types** — 💬 General Query · 🔍 Legal Analysis (issue-spotting, CREAC) · 📄 Document Drafting · 📚 Legal Research · 📋 Procedural Guidance · 🎯 Strategic Advisory · ⚖️ Statutory Interpretation · 📑 Contract Review
- **Native reasoning** — Gemini 2.5 "thinking" runs before the answer (per-mode budget); collapsible reasoning-trace panel for auditability
- **Three response modes** — Brief · Standard · Comprehensive
- **Streaming output** — responses appear word-by-word via `streamGenerateContent`
- **Live web grounding (per query, or app-wide)** — grounds answers in real web sources and shows the links used
- **4-axis confidence scores** — Statutory Grounding · Case Law Support · Procedural Certainty · Position-taking
- **RAG grounding** — verified Nigerian statute provisions retrieved by similarity and injected into every system prompt
- **Citation audit + one-click live-web verifier** — see "How the AI stays accurate" above
- **Contract Review** — clause-by-clause risk matrix and signability grade
- **Contract Version Diffing** — visual line-by-line diff of V1 vs V2 plus AI explanation of legal significance
- **One-click document workflow** — upload PDF/DOCX/TXT/RTF/CSV/JSON (sanitised against prompt injection), then run Summarise / Spot Risks / Key Terms / Explain-to-Client in one click; whole-document analysis (~60 pages)
- **Quality gate** — silent self-critique on the AI Assistant; a weak first draft triggers one automatic stricter regeneration (shown as a "Quality-checked" badge)
- **Quick Precedent Finder** — fast, always-live search returning a compact list of on-point Nigerian authorities with source links (on Home and Research)
- **Save to Case · Analysis Comparison · Issue Spotting · Follow-up Questions · Case Strength Meter**

### 🔍 Authority Verification (standalone page)
- Paste any AI-generated argument, draft, or memo; every case citation is extracted and classified **Verified / Unverified**
- Deterministic checks: verified-case database match, repealed-law scan, foreign-authority scan
- One-click live-web confirmation (REAL / NOT FOUND / UNCERTAIN, with links)
- Downloadable TXT verification report

### 🛡️ Citation Verification Engine
- A curated seed database of verified landmark Supreme Court and Court of Appeal decisions across Constitutional · Electoral · Contract · Land · Evidence · Criminal · Customary Law · Procedure
- Regex coverage for major Nigerian report series: NWLR · LPELR · SCNLR · SC · All NLR · NMLR · NCLR · FWLR
- Verified citations badged ✅; unverified flagged inline with ⚠️; one-click live-web confirmation
- Admin-added verified cases persist to the local datastore and load into every session

### 📰 Practice Updates (live)
- Always sourced **live from the web** — fetches real, recent Nigerian legal developments
- Each item shows date, plain-English summary, practice impact, and a **clickable source link**; deep-dive on any item is also live-web-grounded

### ✅ Task Manager
- Tasks with due date, priority, status, linked case, assignee, notes; overdue auto-detection; 4-badge summary; inline updates; audit-logged; persisted

### 📋 Court Process Checklist
- AI-generated, rule-cited filing checklist for **15 matter types × 13 courts × 11 state rule sets** — pre-action, documents, filing steps, frontloading, service, common defects, timeline

### 📜 Audit Log
- 17 event types, colour-coded, **hash-chained** (retroactive tampering is detectable), admin-viewable with filtering and CSV export

### 🔒 Security
- **Authentication** — optional Supabase email login (password or magic link) with **forgot-password + password-recovery** flows; per-user data isolation via Postgres **Row Level Security**. Login tabs are clearly labelled (🔑 Log In / ✨ Sign Up / ✉️ Magic Link).
- **Device passcode lock** — an optional always-on login wall (`src/lexi/auth.js`): **PBKDF2-HMAC-SHA256 (260,000 iterations)** via Web Crypto, constant-time compare, and a **5-attempt / 5-minute lockout**
- **Discoverable password/passcode change** — Profile opens on the **Security tab by default** so changing credentials is immediate; a prominent amber banner warns when the bootstrap default passcode is still active
- **Visible Lock/Sign-out** — the sidebar Lock button is always visible when a passcode is configured (in both local and cloud modes), with a "Tap Lock to sign out" hint in local mode; the Profile page also shows a "Lock workspace" card in local mode
- **Admin password reset** — admins can reset any user's password (sends a Supabase reset email in cloud mode, or resets the device passcode in local mode) from the Admin panel
- **Hardened HTTP headers** — strict **Content-Security-Policy** (no inline scripts), `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, and HSTS (`vercel.json` / `netlify.toml`)
- **Prompt-injection protection** — `sanitizeDocContext()` strips control characters, detects known injection patterns, and wraps uploaded document text in hard "data-only" delimiters before it reaches the AI
- **Local key handling** — your Gemini key is stored only in this browser (lightly obfuscated) and sent only to Google's API (or hidden entirely in server-key proxy mode)
- **AI rate limiting** — configurable per-user caps (Admin) + server-side per-IP throttle in the proxy
- **Graceful AI fallback chain** — if a model rejects native thinking or the web-search tool, the call automatically steps down (thinking+search → search-only → plain) instead of failing
- **XSS-safe rendering** — AI output is HTML-escaped before a small, safe markdown subset is applied

### ⚙️ Firm Admin Settings (admin only)
- Billing defaults (hourly rate, currency, VAT/WHT) with live preview · default court/jurisdiction · monthly AI budget + allowed-model whitelist · letterhead footer + bank details · admin-rights toggle · add-verified-case — all audit-logged

### 🔎 Global Search
- One field searches across **Cases · Clients · saved Analyses · AI history** simultaneously, grouped by category

### 🏢 Practice Management
- Case & hearing management (with the hearing **Calendar** as a tab inside Cases) · Task Manager · Home dashboard with Next-7-Days panel · rich empty states · Case Bundle Export (PDF/TXT) · fuzzy Conflict Checker · client records · document templates with `[PLACEHOLDER]` detection · full JSON backup/restore

### 📧 Hearing Reminders
- The Notifications tab prepares ready-to-send reminder emails (for hearings within 1/3/7 days) via your mail client. *(The Python edition sends HTML emails automatically over encrypted Gmail SMTP; a browser SPA has no server, so this build hands off to your mail app.)*

---

## Navigation

Grouped sidebar navigation with 5 sections:

| Section | Pages |
|---|---|
| ⚖️ **Practice** | 🏠 Home · 🧠 AI Assistant · 💬 AI Chat · 📚 Research *(Case Law & Statutes + From My Sources)* · 📝 Notes → Brief |
| 📁 **Matters** | 📁 Cases *(Case Manager + Hearing Calendar)* · ✅ Tasks · 📜 Pleadings · 🔍 Conflict Check |
| 👥 **Clients & Fees** | 👥 Clients · ⚖️ Fee Calculator *(incl. time & billing)* |
| 🔧 **Tools** | 🔧 Tools · 📰 Practice Updates · 🔍 Authority Verify · 🎯 Witness Prep · 🤝 Settlement · 🔎 Due Diligence · 📋 Templates · 🔎 Search |
| 👤 **Account** | 👤 Profile *(incl. 🤖 AI Usage)* · ❓ Help · 📜 Privacy · 📋 Terms · 📜 Audit Log *(admin)* · 🛡️ Admin *(admin only)* |

### 🔧 Tools — Tab Reference

| Tab | What it does |
|---|---|
| ⏳ Limitation Periods | Reference table with state-variation warnings |
| 🧮 Deadline Calculator | Compute limitation deadlines from date of cause of action (end-of-month clamped) with special-notes warnings |
| 🏛️ Court Hierarchy | Visual hierarchy of Nigerian courts with jurisdiction notes |
| 📜 Legal Maxims | Searchable library of maxims with custom additions |
| 🛡️ AML / SCUML | AML/CFT thresholds (MLPPA 2022) and red-flag checklist |
| 📋 Court Process Checklist | AI-generated filing checklist — 15 matter types × 13 courts × 11 state rule sets |

---

## Legal Safety

- **Reasoning + verifiable sources** — the model reasons before answering, and (when grounded) cites real, clickable web sources alongside verified-database citations.
- **AI tone** — firm positions where facts and authorities permit; uncertainty expressed clearly where law is unsettled or facts incomplete.
- **Limitation periods** — every computed deadline carries a verification warning (state-specific laws, public-officer exceptions, continuing injury, fraud/concealment).
- **Filing fees** — amber warning that registry fees change without notice and must be confirmed.
- **Disclaimer footer** — every AI output and export carries a disclaimer that the content is AI-generated and does not constitute legal advice.

---

## Export Support

| Format | Notes |
|---|---|
| **TXT** | Plain text with firm header, footer, and disclaimer |
| **DOC** | Word-compatible document with firm branding |
| **PDF** | Print-ready (browser print-to-PDF) with firm name and timestamp |
| **HTML** | Styled web page with firm branding (fallback) |
| **Case Bundle** | Single PDF/TXT combining case facts, all saved analyses, and hearings — one click from the Cases tab |
| **Court Process Checklist** | Export of the AI-generated filing checklist |
| **Authority Verification Report** | TXT report of all citations found, their status, and live verdicts |

Firm name, lawyer details, bank details, and letterhead footer are pulled from **Profile** and **Firm Admin Settings** and applied to all exports automatically.

---

## Tech Stack

| Core | Purpose |
|---|---|
| React 18 | UI framework |
| Vite 5 | Bundler / dev server / production build |
| Tailwind CSS 3 | Styling + dark mode |
| Google Gemini 2.5 API | AI generation, native thinking, and live Google Search grounding |
| lucide-react | Icons |

| Optional | Purpose |
|---|---|
| @supabase/supabase-js | Email auth + per-user cloud workspace sync |
| pdfjs-dist | PDF document import (lazy-loaded) |
| mammoth | DOCX import (lazy-loaded) |
| Vitest | Unit + smoke tests |
| ESLint | Linting |

There is **no required backend**: the app talks directly to the Gemini API from the browser using your own key (BYOK), and persists workspace data in `localStorage`. For a hosted, shared deployment you can optionally add the **Vercel Edge proxy** (to hide a server key) and **Supabase** (for login + cloud sync) — see [`DEPLOYMENT.md`](DEPLOYMENT.md).

---

## Project Structure

The original Python package layout is mirrored module-for-module in JavaScript:

```text
.
├── index.html                     # Vite HTML entry
├── src/
│   ├── main.jsx                   # React mount
│   ├── index.css                  # Tailwind layers + utilities
│   ├── App.jsx                    # Entry point + navigation routing      (≈ app.py)
│   └── lexi/                      # Application package                   (≈ lexi/)
│       ├── runtime.js             # BRAND_LABEL / __version__ / flags     (≈ runtime.py)
│       ├── ai.js                  # generate(): thinking, grounding, fallback, usage (≈ ai.py)
│       ├── helpers.js             # audit log, calculators, usage records (≈ helpers.py)
│       ├── prompts.js             # system-prompt composer + confidence parser (≈ prompts.py)
│       ├── promptData/            # external prompt templates             (≈ prompt_data/)
│       ├── citations.js           # verified case DB + audit + repealed/foreign scans (≈ citations.py)
│       ├── webSearch.js           # live research + one-click verifier + updates (≈ web_search.py)
│       ├── database.js            # localStorage persistence + backup     (≈ database.py)
│       ├── migrator.js            # datastore schema migrations           (≈ migrator.py)
│       ├── crypto.js              # doc sanitisation + key obfuscation    (≈ crypto.py)
│       ├── auth.js                # optional PBKDF2 workspace lock         (≈ auth.py)
│       ├── supabase.js            # optional Supabase auth + cloud workspace sync
│       ├── rateLimit.js           # client-side AI rate limiter (pure/testable)
│       ├── themes.js              # theme engine + semantic tokens        (≈ themes.py)
│       ├── exports.js             # TXT / HTML / PDF / DOC export          (≈ exports.py)
│       ├── legalData.js           # Nigerian reference data
│       ├── utils.js               # formatting, markdown, downloads
│       ├── useAiRun.js            # shared streaming-AI hook
│       ├── nav.js                 # grouped navigation config
│       ├── AppContext.jsx         # global state + actions
│       ├── components/            # shared UI (ui, Layout, Toast, AiPanels, AiResult, PromptTool, AuthGate, CommandPalette, QuickPrecedentFinder)
│       └── pages/                 # one module per screen                 (≈ lexi/pages/)
├── public/
│   ├── favicon.svg                # app logo (tab icon)
│   ├── manifest.webmanifest       # PWA manifest (installable)
│   └── sw.js                      # service worker (offline app shell)
├── api/
│   └── gemini.js                  # Vercel Edge Function: secure Gemini proxy (hides key)
├── supabase/
│   └── schema.sql                 # per-user workspaces table + RLS policies
├── tests/                         # Vitest smoke + unit tests             (≈ tests/)
├── .github/workflows/ci.yml       # lint + test + build CI
├── netlify.toml                   # Netlify config (SPA rewrite)
├── vercel.json                    # Vercel config (SPA rewrite)
├── package.json                   # dependencies + scripts                (≈ requirements.txt)
└── README.md
```

---

## Getting Started

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # production build to dist/
npm run preview  # preview the production build locally
```

Then open the app, go to **Profile → AI Settings**, and paste a **Google Gemini API key** (from [Google AI Studio](https://aistudio.google.com/app/apikey)). For live web grounding and real source links, enable **Google Search grounding** on the key.

---

## Deployment — Netlify or Vercel? 🚀

This is a static single-page app (a `dist/` folder of HTML/JS/CSS) with **no server component**, so **both platforms host it perfectly and for free**. Config for both is already committed (`netlify.toml`, `vercel.json`), each with the SPA rewrite that serves `index.html` on deep links/refresh.

**Recommendation: deploy to Vercel.** For *this specific app*, Vercel is the slightly better fit because:

- **Zero-config Vite detection** — Vercel auto-detects the Vite framework, build command (`npm run build`) and output (`dist`); you can deploy by importing the repo with no settings to fill in.
- **Headroom to hide the API key later** — the one realistic upgrade for this app is moving the Gemini call behind a serverless function so the key isn't in the browser. Vercel's serverless/edge functions are first-class and need almost no wiring (drop a file in `api/`), which makes that future step trivial.
- **Fast global CDN + instant preview deployments** per pull request.

**Choose Netlify instead if** your team already lives there, or you want its built-in form handling, split testing, or redirect/header niceties. For a pure static SPA the two are functionally equivalent — Netlify will serve this app just as well.

### Deploy on Vercel
1. Push this repo to GitHub.
2. On Vercel → **New Project** → import the repo.
3. Framework preset **Vite** is auto-detected (build `npm run build`, output `dist`). Click **Deploy**.

### Deploy on Netlify
1. Push this repo to GitHub.
2. On Netlify → **Add new site → Import an existing project**.
3. Build command `npm run build`, publish directory `dist` (already in `netlify.toml`). Click **Deploy**.

> **Security note:** because this is a client-side app, the Gemini API key is supplied by each user and stored in their own browser. Do **not** bake a shared secret key into the build for a public deployment — anyone could read it. **To deploy with your own key kept secret, use server-key mode:** this repo ships a Vercel Edge Function (`api/gemini.js`) that proxies Gemini with a server-side key. Set `GEMINI_API_KEY` (server-side) and `VITE_USE_PROXY=true` (build-time) in Vercel and the browser never sees the key.

➡️ **Full step-by-step (secure key + Supabase database): see [`DEPLOYMENT.md`](DEPLOYMENT.md).**

---

## Quality & CI

Every change is gated by `npm run ci`, reproduced in GitHub Actions (`.github/workflows/ci.yml`):

- **eslint** — lint (flat config, React + hooks rules) — *mirrors the original `ruff` gate*
- **vitest** — unit + smoke tests: citations & audit, prompt-injection sanitisation, PBKDF2 security + rate limiting, fee/deadline calculators, hash-chained audit log, usage costing, and full-import page wiring — *mirrors the original `pytest` gate*
- **vite build** — production build must succeed — *mirrors the original byte-compile gate*

```bash
npm run lint     # eslint
npm run test     # vitest run
npm run build    # vite build
npm run ci       # all three
```

---

## Who This Is For

Lawyers, litigation teams, solo practitioners, chambers, and legal-operations professionals working within the **Nigerian legal system** who need AI-assisted research, drafting, contract review, matter tracking, task management, citation verification, and document handling in one place — with confidence that the AI **reasons before it answers**, can be put **online to cite real, current sources with links**, is grounded in primary Nigerian law, and produces output that is **independently verifiable** before it reaches a courtroom or a client.

---

## Disclaimer

LexiAssist provides **AI-generated legal information** for workflow support, drafting, research, and practice management. It does **not** constitute legal advice. Limitation periods in Nigeria are governed largely by **state-specific laws** — always verify against the applicable statute for the relevant jurisdiction. All statutes, procedural rules, case citations, and authorities generated by this tool must be **independently verified** before reliance in court or in advice to clients. Live web sources should be opened and confirmed; the verification databases cover landmark decisions and key statutes but are not exhaustive — always confirm against **NWLR**, **LPELR**, or **Law Pavilion** before filing.

---

<p align="center">
  <strong>LexiAssist 2.0</strong> · Built for Nigerian lawyers · React + Vite edition · Powered by Google Gemini · Reasoning + live-web grounded · Private Beta<br/>
  <em>Oyim Stephen Esq. &amp; Associates</em>
</p>
