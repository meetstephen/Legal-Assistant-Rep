# LexiAssist 2.0 — Private Beta Tester Guide

Thank you for helping evaluate **LexiAssist 2.0**, an AI legal workspace built for Nigerian lawyers. This guide gets you running in a couple of minutes and tells you what we'd love feedback on.

> ⚖️ **Important:** LexiAssist provides AI-generated legal information, **not legal advice**. Always independently verify every statute, rule, citation and authority (NWLR / LPELR / Law Pavilion, and the current Rules/Practice Directions of the relevant court) before relying on anything in court or with a client.

---

## 1. Getting started (2 minutes)

1. Open the app link you were sent.
2. If you see a **login screen**, create an account (email + password) or use the **magic link**. Forgot your password later? Use **"Forgot your password?"** on the login screen.
3. If there's **no login**, you're in local mode — your data stays in your browser on that device.
4. Open **Profile → AI Settings**:
   - If it says **"Server key mode is ON"**, you're ready — no key needed.
   - Otherwise paste your own **Google Gemini API key** (from [Google AI Studio](https://aistudio.google.com/app/apikey)). For live source links, enable **Google Search grounding** on the key.
5. Set your firm details in **Profile → Profile & Firm** (used on exports and invoices).
6. Pick your **state/jurisdiction** in **Admin → Firm Admin Settings** (all 36 states + FCT supported).

**Tips:** Press **⌘K / Ctrl+K** to jump anywhere. Toggle **🌐 Live web grounding** in the sidebar to put answers online. You can **install** the app to your phone/desktop ("Add to Home Screen / Install").

---

## 2. What we'd love you to test

- **AI Assistant** — try each task type (analysis, drafting, contract review…). Does it reason soundly? Are the authorities real? Try the **quality gate** (watch for the "Quality-checked" badge) and **document upload** chips (Summarise / Spot Risks / Key Terms / Explain to Client).
- **AI Chat** — a multi-turn conversation; attach a case as context and "save reply to case".
- **Research & Quick Precedent Finder** — do the live web results return **real** Nigerian cases with working source links?
- **Authority Verify** — paste a draft; are citations correctly flagged Verified / Unverified, and does the live verifier work?
- **Practice Updates** — are the items real and current, with genuine source links?
- **Tools** — Limitation/Deadline calculators, **State Rules & Practice Directions** (your state!), **Rules of Professional Conduct**, AML/SCUML, and the **Court Process Checklist**.
- **Practice management** — Cases (+ hearing calendar + **Add to calendar .ics** + case bundle export), Tasks (+ **export deadlines**), Clients, **Fee Calculator + invoices**, Conflict Check.
- **On your phone** — is everything comfortable to use on mobile?

---

## 3. How to give feedback

- In the app: **Help → Send feedback** (pre-fills a structured email).
- Please include: what you did, what happened, what you expected, the feature/area, and your device/browser.
- Screenshots help a lot.

Most useful of all: tell us where the AI was **wrong**, where a citation was **not real**, or where Nigerian law/procedure was **misstated** — that's exactly what we're hardening.

---

## 4. Known limitations (beta)

- The built-in verified-case database is a **curated seed**, not exhaustive — the live verifier covers gaps, but always confirm independently.
- State **Practice Directions** change frequently; use the **live fetch** in Tools → State Rules and confirm at the registry.
- Estimated AI **costs** are approximations and exclude Google Search grounding request fees.
- Hearing reminders prepare an email via your mail app (no automated server send in this build).
- Data in local-only mode lives in **one browser**; use **Profile → Data → Export backup** to move it, or enable cloud login for multi-device sync.

---

## 5. Privacy & security (what to tell your firm)

- Your workspace data is stored in your browser (local mode) or in your isolated, **row-level-secured** account (cloud mode). It is not shared with other users.
- Prompts/documents are sent only to Google's Gemini API (directly with your key, or via a server proxy that hides a shared key).
- The app ships a strict **Content-Security-Policy** and other security headers, optional **device passcode lock** (PBKDF2), and **rate limiting**.

Thank you — your judgement makes this better. 🙏
