// ============================================================
// lexi/crypto.js — sanitisation + light client-side obfuscation
//
// Mirrors lexi/crypto.py. The Python build uses Fernet symmetric encryption to
// protect SMTP credentials at rest in PostgreSQL. A browser SPA has no trusted
// server-side secret, so true at-rest encryption is not meaningful here — we
// instead (a) never transmit credentials anywhere except the user's own Gemini
// endpoint, and (b) lightly obfuscate the locally-stored API key so it is not
// sitting in plaintext in localStorage. The headline security control that DOES
// port directly is prompt-injection sanitisation of uploaded documents.
// ============================================================

// Known prompt-injection trigger phrases.
const INJECTION_PATTERNS = [
  /ignore (all|any|the|your) (previous|prior|above) (instructions|prompts?)/i,
  /disregard (the|all|your) (system|previous|above)/i,
  /you are now\b/i,
  /act as (?:an?|the)\b/i,
  /\bsystem prompt\b/i,
  /\bdeveloper mode\b/i,
  /\bjailbreak\b/i,
  /reveal (your|the) (system|hidden|internal) (prompt|instructions)/i,
  /\bBEGIN (SYSTEM|PROMPT)\b/i,
];

// Strip control characters, neutralise injection markers, and cap size.
export function sanitizeDocContext(raw = '', maxChars = 120000) {
  if (!raw) return { text: '', flags: [], truncated: false };
  let text = String(raw)
    // strip control chars except \n and \t
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\r\n/g, '\n');

  const flags = [];
  INJECTION_PATTERNS.forEach((re) => {
    if (re.test(text)) {
      flags.push(re.source.slice(0, 40));
      text = text.replace(new RegExp(re.source, 'gi'), '[redacted-instruction]');
    }
  });

  let truncated = false;
  if (text.length > maxChars) {
    text = `${text.slice(0, maxChars)}\n…[document truncated at ${maxChars} characters]`;
    truncated = true;
  }
  return { text: text.trim(), flags, truncated };
}

// Reversible, NON-cryptographic obfuscation for the locally-stored key.
// This is deterrence against shoulder-surfing of localStorage, not security.
export function obfuscate(s = '') {
  try {
    return btoa(unescape(encodeURIComponent(`lx:${s}`)));
  } catch {
    return s;
  }
}

export function deobfuscate(s = '') {
  try {
    const out = decodeURIComponent(escape(atob(s)));
    return out.startsWith('lx:') ? out.slice(3) : out;
  } catch {
    return s;
  }
}
