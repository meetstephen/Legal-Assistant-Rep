// Keep auth-event callbacks synchronous; never acquire another Supabase auth lock inside them.
export function stableSessionUser(previous, next) {
  return previous && next && previous.id === next.id && previous.email === next.email ? previous : next;
}

export function watchAuthSession({ getUser, subscribe, onUser, onRecovery, onLoading, onError }) {
  let active = true, revision = 0;
  const accept = (user, event) => {
    if (!active) return;
    revision += 1;
    onUser(user);
    if (event === 'PASSWORD_RECOVERY' && user) onRecovery(true);
    else if (!user || event === 'SIGNED_IN') onRecovery(false);
    onError(''); onLoading(false);
  };
  let unsubscribe = () => {};
  try { unsubscribe = subscribe(accept); }
  catch (e) { onError(e.message || 'Authentication configuration is invalid.'); onLoading(false); }
  const refresh = async () => {
    const started = revision;
    try {
      const user = await getUser();
      if (active && started === revision) accept(user, 'SESSION_RESTORED');
    } catch (e) {
      if (active && started === revision) { onError(e.message || 'Could not restore your session.'); onLoading(false); }
    }
  };
  void refresh();
  return { refresh, dispose() { active = false; revision += 1; unsubscribe(); } };
}

export function authErrorMessage(error) {
  const messages = {
    invalid_credentials: 'Email or password is incorrect. Try again or reset your password.',
    email_not_confirmed: 'Confirm your email before signing in. Check your inbox and spam folder.',
    email_address_not_authorized: 'Email delivery is not configured for public users. Contact the workspace administrator.',
    over_email_send_rate_limit: 'Too many emails requested. Please wait before trying again.',
    over_request_rate_limit: 'Too many attempts. Please wait and try again.',
    otp_expired: 'This email link has expired or already been used. Request a new link.',
    user_banned: 'Account access is suspended. Contact your workspace administrator.',
    weak_password: 'Choose a stronger password meeting the requirements shown.',
  };
  if (messages[error?.code]) return messages[error.code];
  if (/failed to fetch|network|fetch failed/i.test(error?.message || '')) return 'Could not connect. Check your internet connection and try again.';
  return error?.message || 'Authentication failed. Please try again.';
}

export function signUpNotice(data) {
  return data?.session ? 'Signed in successfully.' : 'Check your inbox and spam folder for a confirmation email if this address is eligible. Already registered? Log in or reset your password.';
}

