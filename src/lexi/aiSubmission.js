// Input readiness is separate from legal scope. A missing jurisdiction must
// prompt the user to select one, not leave an unexplained disabled button.
export function hasAiInput(text, document = null, busy = false) {
  return Boolean((String(text || '').trim() || document) && !busy);
}

export function hasSourceInput(question, documents = []) {
  return Boolean(String(question || '').trim() && documents.length);
}
