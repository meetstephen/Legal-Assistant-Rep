# Public authentication email readiness

Public signup is not ready until custom SMTP is configured. Supabase's default email sender only delivers to addresses authorised for the project team. Keep email confirmation enabled; disabling it is not an SMTP fix.

The owner currently has no email provider or sender domain. No SMTP credentials have been configured by this change.

1. Choose an email provider and verify a sender/domain supported by that provider. Check its current free allowance and production restrictions before committing.
2. In Supabase Dashboard, open Authentication > Email > SMTP Settings. Configure the provider's SMTP host, port, username, password and verified sender. Enter credentials in the dashboard, never in chat, client-side VITE variables or repository files.
3. Configure the production Site URL and allowed authentication redirect URLs. Review email rate limits, which still apply with custom SMTP.
4. Test signup, confirmation and password reset with an address outside the project team. Check spam delivery and provider logs. Test expired links and resend behaviour before public launch.

Authoritative setup and limitations: https://supabase.com/docs/guides/auth/auth-smtp

Custom SMTP alone does not require a Supabase Pro subscription. Provider costs and sender verification requirements are separate.
