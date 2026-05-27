/** Bus léger pour rafraîchir les tableurs insérés (canvas + docs). */

export const SHEET_UPDATED_EVENT = 'forma-sheet-updated'

export function notifySheetUpdated(sheetId) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(SHEET_UPDATED_EVENT, { detail: { sheetId } }))
}

export function subscribeSheetUpdates(callback) {
  if (typeof window === 'undefined') return () => {}
  const handler = (e) => callback(e.detail?.sheetId ?? null)
  window.addEventListener(SHEET_UPDATED_EVENT, handler)
  return () => window.removeEventListener(SHEET_UPDATED_EVENT, handler)
}
