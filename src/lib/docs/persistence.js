import { createSafePersistStorage } from '@/lib/storage'
import { createDoc, cloneDoc } from './model'

const KEY = 'forma-documents'

function readAll() {
  try {
    const raw = createSafePersistStorage().getItem(KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function writeAll(list) {
  createSafePersistStorage().setItem(KEY, JSON.stringify(list))
}

export function listDocs() {
  return readAll().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
}

export function getDoc(id) {
  return readAll().find((d) => d.id === id) || null
}

export function saveDoc(doc) {
  const list = readAll()
  const idx = list.findIndex((d) => d.id === doc.id)
  const next = { ...doc, updatedAt: Date.now() }
  if (idx >= 0) list[idx] = next
  else list.unshift(next)
  writeAll(list)
  return next
}

export function createAndSave(name, templateId) {
  return saveDoc(createDoc(name, templateId))
}

export function deleteDoc(id) {
  writeAll(readAll().filter((d) => d.id !== id))
}

export function duplicateDoc(id) {
  const src = getDoc(id)
  if (!src) return null
  return saveDoc(cloneDoc(src))
}

export function searchDocs(query) {
  const q = String(query || '').trim().toLowerCase()
  const all = listDocs()
  if (!q) return all
  return all.filter((d) => {
    if (d.name.toLowerCase().includes(q)) return true
    return (d.pages || []).some((p) => (p.html || '').toLowerCase().includes(q))
  })
}

export function sortDocs(list, by = 'updated', dir = 'desc') {
  const copy = [...list]
  copy.sort((a, b) => {
    if (by === 'name') {
      const cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase(), 'fr')
      return dir === 'asc' ? cmp : -cmp
    }
    const va = a.updatedAt || 0
    const vb = b.updatedAt || 0
    return dir === 'asc' ? va - vb : vb - va
  })
  return copy
}

let saveTimer = null
export function autosaveDoc(doc, delay = 500) {
  return new Promise((resolve) => {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => resolve(saveDoc(doc)), delay)
  })
}
