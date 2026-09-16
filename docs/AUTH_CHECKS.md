# Authentication checks and release verification

Regression fixes cover logout SDK errors and current-device scope, conditional signup/confirmation feedback, signup password confirmation and minimum length (without blocking older short passwords at login), inline accessible feedback, recovery cancellation, late session-read races, same-user token refreshes, and startup workspace clearing before session restoration.

Logout now clears cached templates and firm profile as well as case data and personal API keys. Workspace synchronization is not enabled after an unsuccessful initial cloud load, and failed periodic writes can retry instead of being incorrectly marked already saved. Newly detected suspended accounts are checked before workspace loading. These client checks do not replace Supabase RLS/server-side authorization.

Automated tests exercise session events, SDK error handling/redirect arguments, and rendering of the auth wall, recovery and error screens. They do **not** prove real email delivery or the production project's dashboard settings. Do not claim those live flows were verified without testing them.

Before production release, verify Supabase Authentication settings: correct production Site URL and allowed Redirect URLs, email/password signup enabled, confirmation policy, email templates and working SMTP/delivery quotas. These are dashboard settings, not GitHub Actions secrets. No SQL migration is required by this patch.

Important: Supabase's built-in email sender currently delivers only to project-team addresses and allows two messages per hour. Public confirmation/reset/magic-link delivery requires a suitable custom SMTP configuration. Whether this project already has custom SMTP has not been verified. See https://supabase.com/docs/guides/auth/auth-smtp. Do not disable confirmation to conceal a delivery problem.

Using a controlled test mailbox, verify signup and confirmation, incorrect-password feedback, password reset (including expired links), magic link, reload/token refresh, logout on desktop/mobile, and that logout does not sign out another device. Check spam and duplicate-account feedback. Do not disable email confirmation or weaken RLS as a workaround.

References: https://supabase.com/docs/reference/javascript/auth-signup, https://supabase.com/docs/guides/auth/redirect-urls, https://supabase.com/docs/guides/auth/signout, https://supabase.com/docs/reference/javascript/auth-onauthstatechange.

