import { safeGetLocalStorage, safeJsonParse } from '@/lib/storage'

const NOTEBOOKS_KEY = 'forma_local_notebooks_v1'

export function isLocalNotebookId(id) {
  return String(id || '').startsWith('local-')
}

function pagesKey(nbId) {
  return `forma_pages_${nbId}`
}

export function loadLocalNotebooks() {
  const raw = safeJsonParse(safeGetLocalStorage(NOTEBOOKS_KEY, '[]'), [])
  return Array.isArray(raw) ? raw : []
}

export function saveLocalNotebooksList(notebooks) {
  try {
    const localOnly = (notebooks || []).filter((n) => isLocalNotebookId(n.id))
    localStorage.setItem(NOTEBOOKS_KEY, JSON.stringify(localOnly))
  } catch { /* quota */ }
}

export function upsertLocalNotebook(nb) {
  if (!nb?.id) return
  const list = loadLocalNotebooks().filter((n) => n.id !== nb.id)
  list.unshift({ ...nb, updated_at: nb.updated_at || new Date().toISOString() })
  try {
    localStorage.setItem(NOTEBOOKS_KEY, JSON.stringify(list))
  } catch { /* quota */ }
}

export function deleteLocalNotebook(id) {
  try {
    localStorage.setItem(NOTEBOOKS_KEY, JSON.stringify(loadLocalNotebooks().filter((n) => n.id !== id)))
    localStorage.removeItem(pagesKey(id))
  } catch { /* ignore */ }
}

export function loadLocalPages(nbId) {
  const raw = safeJsonParse(safeGetLocalStorage(pagesKey(nbId), '[]'), [])
  return Array.isArray(raw) ? raw : []
}

export function saveLocalPages(nbId, pages) {
  try {
    localStorage.setItem(pagesKey(nbId), JSON.stringify(pages || []))
  } catch { /* quota */ }
}

export function saveLocalPage(nbId, page, existingPages) {
  const pages = existingPages || loadLocalPages(nbId)
  const idx = pages.findIndex((p) => p.id === page.id || p.page_number === page.page_number)
  const next = idx >= 0
    ? pages.map((p, i) => (i === idx ? { ...p, ...page } : p))
    : [...pages, page]
  next.sort((a, b) => a.page_number - b.page_number)
  saveLocalPages(nbId, next)
  return next
}

export function getLocalNotebook(id) {
  return loadLocalNotebooks().find((n) => n.id === id) || null
}
