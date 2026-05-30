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

> **Status of Supabase wiring:** this repo ships the **schema, RLS policies, env wiring and runtime detection** (`SUPABASE_ENABLED` in `src/lexi/runtime.js`). The data layer (`src/lexi/database.js`) is written behind a single `storage` interface, so connecting it is a contained change: on sign-in, load the user's `workspaces.data` row into the store and debounce-save it back on change. Until you wire that, the app uses local storage and ignores the Supabase vars. See "Wiring Supabase" below.

### Wiring Supabase (developer note)
`src/lexi/database.js` exposes `storage.get/set/exportAll/importAll`. To go cloud-backed:
1. `npm i @supabase/supabase-js` and create a client from the two `VITE_SUPABASE_*` vars.
2. Add a small sign-in screen (Supabase `signInWithOtp` / `signInWithPassword`).
3. On auth state "signed in", `select data from workspaces where user_id = auth.uid()` and `storage.importAll(data)` (then refresh state).
4. Subscribe to store writes (debounced) and `upsert` `{ user_id, data: storage.exportAll() }` back to `workspaces`.
RLS guarantees isolation, so no server code is needed for persistence.

---

## Part D — Local development

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

## Part E — Deploying on Netlify instead

Netlify hosts the static SPA equally well (`netlify.toml` is included). The one difference: the proxy. Netlify uses **Netlify Functions** rather than Vercel Edge Functions, so port `api/gemini.js` to `netlify/functions/gemini.js` (same logic; export a `handler`) and set `GEMINI_API_KEY` + `VITE_USE_PROXY=true` in **Site settings → Environment variables**. For a pure BYOK static deploy, no function is needed and Netlify works with zero changes.

---

## Security checklist

- [ ] `GEMINI_API_KEY` is set **without** the `VITE_` prefix (so it stays server-side).
- [ ] `VITE_USE_PROXY=true` so the client uses `/api/gemini`.
- [ ] In DevTools → Network, AI calls hit `/api/gemini`, not `googleapis.com`, and carry no key.
- [ ] Supabase **service_role** key is **never** put in any `VITE_` var or the client.
- [ ] Supabase RLS is **enabled** on every table (the provided `schema.sql` does this).
- [ ] Rotate the Gemini key if it was ever pasted somewhere public.
