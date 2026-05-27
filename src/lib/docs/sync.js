/** Bus léger pour rafraîchir les documents insérés (canvas). */

export const DOC_UPDATED_EVENT = 'forma-doc-updated'

export function notifyDocUpdated(docId) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(DOC_UPDATED_EVENT, { detail: { docId } }))
}

export function subscribeDocUpdates(callback) {
  if (typeof window === 'undefined') return () => {}
  const handler = (e) => callback(e.detail?.docId ?? null)
  window.addEventListener(DOC_UPDATED_EVENT, handler)
  return () => window.removeEventListener(DOC_UPDATED_EVENT, handler)
}
