import { safeGetLocalStorage, safeJsonParse } from '@/lib/storage'
import { saveNotebookPagesIdb, loadNotebookPagesIdb } from '@/lib/sync/idbVault'

const NOTEBOOKS_KEY = 'forma_local_notebooks_v1'

const pagesCache = new Map()
let notebooksCache = null
let hydrated = false

export function isLocalNotebookId(id) {
  return String(id || '').startsWith('local-')
}

function pagesKey(nbId) {
  return `forma_pages_${nbId}`
}

export function loadLocalNotebooks() {
  if (notebooksCache) return notebooksCache
  const raw = safeJsonParse(safeGetLocalStorage(NOTEBOOKS_KEY, '[]'), [])
  notebooksCache = Array.isArray(raw) ? raw : []
  return notebooksCache
}

export function saveLocalNotebooksList(notebooks) {
  try {
    const localOnly = (notebooks || []).filter((n) => isLocalNotebookId(n.id))
    notebooksCache = localOnly
    localStorage.setItem(NOTEBOOKS_KEY, JSON.stringify(localOnly))
  } catch { /* quota */ }
}

export function upsertLocalNotebook(nb) {
  if (!nb?.id) return
  const list = loadLocalNotebooks().filter((n) => n.id !== nb.id)
  list.unshift({ ...nb, updated_at: nb.updated_at || new Date().toISOString() })
  notebooksCache = list
  try {
    localStorage.setItem(NOTEBOOKS_KEY, JSON.stringify(list))
  } catch { /* quota */ }
}

export function deleteLocalNotebook(id) {
  try {
    const list = loadLocalNotebooks().filter((n) => n.id !== id)
    notebooksCache = list
    localStorage.setItem(NOTEBOOKS_KEY, JSON.stringify(list))
    localStorage.removeItem(pagesKey(id))
    pagesCache.delete(id)
  } catch { /* ignore */ }
}

export function loadLocalPages(nbId) {
  if (pagesCache.has(nbId)) return pagesCache.get(nbId)
  const raw = safeJsonParse(safeGetLocalStorage(pagesKey(nbId), '[]'), [])
  const pages = Array.isArray(raw) ? raw : []
  pagesCache.set(nbId, pages)
  return pages
}

export async function hydrateNotebookPages(nbId) {
  const fromIdb = await loadNotebookPagesIdb(nbId)
  if (fromIdb?.length) {
    pagesCache.set(nbId, fromIdb)
    try {
      localStorage.setItem(pagesKey(nbId), JSON.stringify(fromIdb))
    } catch { /* quota */ }
  }
  return loadLocalPages(nbId)
}

export function saveLocalPages(nbId, pages) {
  try {
    pagesCache.set(nbId, pages || [])
    localStorage.setItem(pagesKey(nbId), JSON.stringify(pages || []))
  } catch { /* quota */ }
}

export async function saveLocalPagesAsync(nbId, pages) {
  pagesCache.set(nbId, pages || [])
  saveLocalPages(nbId, pages)
  await saveNotebookPagesIdb(nbId, pages)
}

export function saveLocalPage(nbId, page, existingPages) {
  const pages = existingPages || loadLocalPages(nbId)
  const idx = pages.findIndex((p) => p.id === page.id || p.page_number === page.page_number)
  const next = idx >= 0
    ? pages.map((p, i) => (i === idx ? { ...p, ...page } : p))
    : [...pages, page]
  next.sort((a, b) => a.page_number - b.page_number)
  saveLocalPages(nbId, next)
  saveLocalPagesAsync(nbId, next).catch(() => {})
  return next
}

export function getLocalNotebook(id) {
  return loadLocalNotebooks().find((n) => n.id === id) || null
}

export async function hydrateProjectStore() {
  if (hydrated) return
  hydrated = true
  notebooksCache = null
  pagesCache.clear()
  loadLocalNotebooks()
}

export function isProjectStoreHydrated() {
  return hydrated
}
