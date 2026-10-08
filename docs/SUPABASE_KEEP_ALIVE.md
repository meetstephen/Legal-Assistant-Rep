# Supabase external keep-alive

The GitHub Actions workflow calls the data-free `public.keep_alive()` RPC from
GitHub once per day. It is an external HTTPS request, does not read or write
legal records, and has no access to user data.

## One-time setup

1. Run the current `supabase/schema.sql` in the Supabase SQL Editor. This
   creates the `keep_alive` RPC and explicitly grants it permission to the
   public client role.
2. In GitHub: **Repository â†’ Settings â†’ Secrets and variables â†’ Actions**, set:
   - `SUPABASE_URL` â€” the Project URL from Supabase.
   - `SUPABASE_PUBLISHABLE_KEY` â€” the current Publishable key from the
     Project's API keys page.
3. Open **Actions â†’ Supabase keep-alive â†’ Run workflow**. A successful run
   reports â€œSupabase external database ping completed successfully.â€

Never use or store the `service_role` key in this workflow. The workflow can
temporarily use the older `SUPABASE_ANON_KEY` or `VITE_SUPABASE_ANON_KEY`
secrets if present, but the publishable-key secret is the supported setting.

If a manual run returns HTTP 401 or 403, replace `SUPABASE_PUBLISHABLE_KEY`
with the current key from Supabase; do not paste any key into an issue, commit,
or chat. If it returns HTTP 404, run the current schema SQL before retrying.

