/** FormaSync — coffre local (priorité appareil) — dual-write localStorage + IndexedDB */

import { safeGetLocalStorage, safeSetLocalStorage, safeJsonParse } from '@/lib/storage'
import { idbAvailable, idbPut, idbDelete, IDB_STORES } from '@/lib/storage/indexedDb'

export function saveLocalData(key, data) {
  const serialized = typeof data === 'string' ? data : JSON.stringify(data)
  safeSetLocalStorage(key, serialized)
  if (idbAvailable()) {
    idbPut(IDB_STORES.kv, { key, value: serialized, updatedAt: Date.now() }).catch(() => {})
  }
  return true
}

export async function saveLocalDataAsync(key, data) {
  const serialized = typeof data === 'string' ? data : JSON.stringify(data)
  safeSetLocalStorage(key, serialized)
  if (idbAvailable()) {
    await idbPut(IDB_STORES.kv, { key, value: serialized, updatedAt: Date.now() })
  }
  return true
}

export function loadLocalData(key, fallback = null) {
  const raw = safeGetLocalStorage(key)
  if (raw == null) return fallback
  if (fallback === null || typeof fallback === 'object') {
    return safeJsonParse(raw, fallback)
  }
  return raw
}

export async function loadLocalDataAsync(key, fallback = null) {
  if (idbAvailable()) {
    try {
      const { idbGet } = await import('@/lib/storage/indexedDb')
      const row = await idbGet(IDB_STORES.kv, key)
      if (row?.value != null) {
        if (fallback === null || typeof fallback === 'object') return safeJsonParse(row.value, fallback)
        return row.value
      }
    } catch { /* fallback LS */ }
  }
  return loadLocalData(key, fallback)
}

export function removeLocalData(key) {
  try { localStorage.removeItem(key) } catch { /* ignore */ }
  if (idbAvailable()) {
    idbDelete(IDB_STORES.kv, key).catch(() => {})
  }
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
