/** FormaSync — IndexedDB pages carnets + migration/hydratation */

import { safeGetLocalStorage, safeSetLocalStorage, safeJsonParse } from '@/lib/storage'
import {
  idbAvailable, idbPut, idbGet, idbGetAll, IDB_STORES,
} from '@/lib/storage/indexedDb'

const MIGRATION_FLAG = 'forma-idb-migrated-v1'

export async function saveNotebookPagesIdb(notebookId, pages) {
  const serialized = JSON.stringify(pages || [])
  safeSetLocalStorage(`forma_pages_${notebookId}`, serialized)
  if (idbAvailable()) {
    await idbPut(IDB_STORES.pages, {
      notebookId,
      pages: pages || [],
      updatedAt: Date.now(),
    })
  }
}

export async function loadNotebookPagesIdb(notebookId) {
  if (idbAvailable()) {
    try {
      const row = await idbGet(IDB_STORES.pages, notebookId)
      if (Array.isArray(row?.pages)) return row.pages
    } catch { /* fallback */ }
  }
  return safeJsonParse(safeGetLocalStorage(`forma_pages_${notebookId}`, '[]'), [])
}

export async function migrateLocalStorageToIdb() {
  if (!idbAvailable()) return { migrated: 0 }
  if (safeGetLocalStorage(MIGRATION_FLAG)) return { migrated: 0, skipped: true }

  let migrated = 0
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (!key) continue
      const lower = key.toLowerCase()
      if (!lower.startsWith('forma') && !lower.startsWith('archnote')) continue
      const value = localStorage.getItem(key)
      if (value == null) continue
      if (key.startsWith('forma_pages_')) {
        const notebookId = key.replace('forma_pages_', '')
        const pages = safeJsonParse(value, [])
        await idbPut(IDB_STORES.pages, { notebookId, pages, updatedAt: Date.now() })
      } else {
        await idbPut(IDB_STORES.kv, { key, value, updatedAt: Date.now() })
      }
      migrated += 1
    }
    safeSetLocalStorage(MIGRATION_FLAG, String(Date.now()))
  } catch (err) {
    console.warn('IDB migration:', err?.message)
  }
  return { migrated }
}

/** Restaure le miroir localStorage depuis IndexedDB au démarrage */
export async function hydrateFromIdb() {
  if (!idbAvailable()) return false
  try {
    const rows = await idbGetAll(IDB_STORES.kv)
    for (const row of rows) {
      if (row?.key && row.value != null && safeGetLocalStorage(row.key) == null) {
        safeSetLocalStorage(row.key, row.value)
      }
    }
    const pageRows = await idbGetAll(IDB_STORES.pages)
    for (const row of pageRows) {
      if (row?.notebookId && row.pages) {
        const lsKey = `forma_pages_${row.notebookId}`
        if (safeGetLocalStorage(lsKey) == null) {
          safeSetLocalStorage(lsKey, JSON.stringify(row.pages))
        }
      }
    }
    return true
  } catch {
    return false
  }
}
