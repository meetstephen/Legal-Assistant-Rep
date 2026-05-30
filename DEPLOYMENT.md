# Deploying LexiAssist 2.0 on Vercel (securely)

This guide takes you from the repo to a live, secure deployment where **your Gemini API key is never exposed in the browser**, plus an optional **Supabase** database for multi-device / multi-user persistence.

There are two operating modes:

| Mode | Key location | Best for |
|---|---|---|
| **BYOK** (default) | Each user pastes their own key; stored in their browser | Personal use, demos, local dev |
| **Server-key (proxy)** | One key in Vercel env vars; calls go through `/api/gemini` | A shared app you host for your firm/clients |

This guide focuses on **Server-key mode** because that's the "don't expose my key" setup.

---

## How the key stays secret (the architecture)

```
Browser ──POST /api/gemini { model, body }──►  Vercel Edge Function  ──+ GEMINI_API_KEY──►  Google Gemini
        ◄────────── streamed answer ───────────  (api/gemini.js)                          
```

- The browser **never** receives the key. It only ever talks to your own `/api/gemini` endpoint.
- The Edge Function (`api/gemini.js`) reads `GEMINI_API_KEY` from server-side env vars and adds it to the Google request.
- Streaming (token-by-token) still works because the function pipes Google's SSE stream straight back.

The client only switches to this mode when the build-time flag `VITE_USE_PROXY=true` is set.

---

## Part A — Get your keys ready

1. **Gemini API key** — create one at [Google AI Studio](https://aistudio.google.com/app/apikey).
   - For live web grounding (real source links), make sure **Google Search grounding** is enabled/available on the key. Standard keys include a free daily allowance, then it's billable.
2. **GitHub** — push this repo to a GitHub repository (Vercel deploys from Git).

---

## Part B — Deploy on Vercel with the key hidden

1. Go to **[vercel.com](https://vercel.com)** → sign in with GitHub → **Add New… → Project** → import your repo.
2. Vercel auto-detects the framework as **Vite** (Build Command `npm run build`, Output `dist`). Leave as-is.
3. Before clicking Deploy, open **Environment Variables** and add:

   | Name | Value | Notes |
   |---|---|---|
   | `GEMINI_API_KEY` | *your Gemini key* | **Server-side only — do NOT prefix with `VITE_`.** This is the secret. |
   | `VITE_USE_PROXY` | `true` | Build-time flag that makes the client call `/api/gemini`. |

   (Apply them to **Production**, and **Preview**/**Development** if you want previews to work too.)
4. Click **Deploy**. When it finishes you'll get a `https://<your-app>.vercel.app` URL.
5. Open the app → **Profile → AI Settings** should show a green **"Server key mode is ON"** notice, and you can use every AI feature **without entering a key**.

### Verify the key is not exposed
- Open DevTools → **Network**, run any AI feature. You'll see a request to **`/api/gemini`** (your domain) — not to `googleapis.com`, and no key in the request. ✅
- View source / bundle: the key is never in the client because it only exists in the serverless env.

> The repo already includes `api/gemini.js` (the Edge Function) and a `vercel.json` whose SPA rewrite **excludes** `/api/*`, so the function is reachable. Nothing else to configure.

### Costs & limits
- Gemini usage bills to the key you provided. Watch spend in Google AI Studio / Google Cloud billing; the app's **Profile → AI Usage** tab also estimates it.
- Because it's one shared key, **all users draw from the same quota**. For real multi-tenant use, add login (Part C) and consider per-user rate limiting.

---

## Part C — Add a database with Supabase (optional)

The app works out-of-the-box using the browser's `localStorage` (data stays on one device). Add Supabase when you want **login + data that follows the user across devices**, or **multiple lawyers in a firm**.

### C1. Create the project
1. Go to **[supabase.com](https://supabase.com)** → **New project**. Pick a region near your users; save the database password.
2. In **Project Settings → API**, copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`
   > The anon key is *designed* to be public; it's safe in the browser **because Row Level Security restricts every row to its owner**. Never expose the **service_role** key.

### C2. Create the tables (with security)
1. In Supabase → **SQL Editor → New query**.
2. Paste the contents of [`supabase/schema.sql`](supabase/schema.sql) from this repo and **Run**.
   - This creates a `workspaces` table (one JSON row per user) and a shared read-only `verified_cases` table, both protected by **Row Level Security** so a user can only read/write their own data.

### C3. Turn on auth
1. Supabase → **Authentication → Providers** → enable **Email** (magic link or password). Optionally enable Google/GitHub.
2. Under **Authentication → URL Configuration**, add your Vercel URL (`https://<your-app>.vercel.app`) to **Site URL** and **Redirect URLs**.

### C4. Add the env vars to Vercel
In your Vercel project → **Settings → Environment Variables**, add:

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | your Project URL |
| `VITE_SUPABASE_ANON_KEY` | your anon public key |

Redeploy (Deployments → ⋯ → Redeploy) so the build picks up the new vars.

### C5. That's it — login is now on
Once those two vars are present at build time, the app **automatically**:
- shows a **login / sign-up screen** (email + password, or magic link) before the workspace;
- on sign-in, **loads that user's workspace** from the `workspaces` table and hydrates the app;
- **auto-saves** changes back to the cloud (debounced) — you'll see the sync status in **Profile** (e.g. "Synced to cloud"), with a **Sign out** button there;
- keeps every user's data **isolated** via the RLS policies from `schema.sql`.

No code changes needed — it's wired in (`src/lexi/supabase.js` + `AppContext`). With the vars **absent**, the app silently stays in local-only mode (no login).

> Cloud sync covers your workspace data (cases, clients, tasks, analyses, templates, audit log, profile, chat). Device-only items (theme, a locally-entered BYOK key) are intentionally **not** synced.

---

## Part D — Rate limiting (protect your key/quota)

Two layers, both already built in:

**1. Client-side (per user/device)** — caps AI calls per-minute and per-day before they're sent. Tune in **Admin → Firm Admin Settings**: *AI calls / minute* and *AI calls / day*. Defaults: 12/min, 300/day. When exceeded, the user sees a friendly "rate limit reached" toast.

**2. Server-side (per IP, in the proxy)** — `api/gemini.js` enforces a best-effort per-IP limit and returns HTTP **429**, which the client surfaces. Configure with the server env var:

| Name | Value | Notes |
|---|---|---|
| `RATE_LIMIT_PER_MIN` | e.g. `20` | Requests/min per IP; `0` disables. Server-side only. |

> The server limiter is in-memory per edge instance (best-effort). For strict, globally-consistent limits, back it with **Upstash Redis** or a **Supabase** counter table — the hook is marked in `api/gemini.js`.

---

## Part E — Local development

```bash
cp .env.example .env        # fill in values
# For BYOK local dev, you can leave VITE_USE_PROXY empty and paste a key in the UI.
npm install
npm run dev                 # http://localhost:5173
```

To test the **proxy** locally, use the Vercel CLI (it runs the Edge Function):
```bash
npm i -g vercel
vercel dev                  # serves the app + /api/gemini with your .env
```

Run the quality gate any time:
```bash
npm run ci                  # eslint + vitest + vite build
```

---

## Part F — Deploying on Netlify instead

Netlify hosts the static SPA equally well (`netlify.toml` is included). The one difference: the proxy. Netlify uses **Netlify Functions** rather than Vercel Edge Functions, so port `api/gemini.js` to `netlify/functions/gemini.js` (same logic; export a `handler`) and set `GEMINI_API_KEY` + `VITE_USE_PROXY=true` in **Site settings → Environment variables**. The Supabase vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) work identically on Netlify. For a pure BYOK static deploy, no function is needed and Netlify works with zero changes.

---

## Security checklist

- [ ] `GEMINI_API_KEY` is set **without** the `VITE_` prefix (so it stays server-side).
- [ ] `VITE_USE_PROXY=true` so the client uses `/api/gemini`.
- [ ] In DevTools → Network, AI calls hit `/api/gemini`, not `googleapis.com`, and carry no key.
- [ ] `RATE_LIMIT_PER_MIN` set on the server, and per-user limits set in **Admin** (client-side).
- [ ] Supabase **service_role** key is **never** put in any `VITE_` var or the client.
- [ ] Supabase RLS is **enabled** on every table (the provided `schema.sql` does this).
- [ ] After enabling Supabase, confirm a second account cannot see the first account's data.
- [ ] Rotate the Gemini key if it was ever pasted somewhere public.
