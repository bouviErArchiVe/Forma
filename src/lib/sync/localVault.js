/** FormaSync — coffre local (priorité appareil) */

import { safeGetLocalStorage, safeSetLocalStorage, safeJsonParse } from '@/lib/storage'

export function saveLocalData(key, data) {
  const serialized = typeof data === 'string' ? data : JSON.stringify(data)
  return safeSetLocalStorage(key, serialized)
}

export function loadLocalData(key, fallback = null) {
  const raw = safeGetLocalStorage(key)
  if (raw == null) return fallback
  if (fallback === null || typeof fallback === 'object') {
    return safeJsonParse(raw, fallback)
  }
  return raw
}

export function removeLocalData(key) {
  try { localStorage.removeItem(key) } catch { /* ignore */ }
}

export function hashPayload(payload) {
  const str = typeof payload === 'string' ? payload : JSON.stringify(payload)
  let h = 0
  for (let i = 0; i < str.length; i += 1) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0
  }
  return `${h}_${str.length}`
}

export function estimateSize(payload) {
  const str = typeof payload === 'string' ? payload : JSON.stringify(payload)
  return str.length
}

export function isOnline() {
  return typeof navigator !== 'undefined' ? navigator.onLine !== false : true
}
