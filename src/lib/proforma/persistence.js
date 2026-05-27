import { createSafePersistStorage } from '@/lib/storage'
import { createProformaDoc, cloneProformaDoc } from './model'

const KEY = 'forma-proforma'

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

export function listProformaDocs() {
  return readAll().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
}

export function getProformaDoc(id) {
  return readAll().find((d) => d.id === id) || null
}

export function saveProformaDoc(doc) {
  const list = readAll()
  const idx = list.findIndex((d) => d.id === doc.id)
  const next = { ...doc, updatedAt: Date.now() }
  if (idx >= 0) list[idx] = next
  else list.unshift(next)
  writeAll(list)
  return next
}

export function createAndSaveProforma(opts) {
  return saveProformaDoc(createProformaDoc(opts))
}

export function deleteProformaDoc(id) {
  writeAll(readAll().filter((d) => d.id !== id))
}

export function duplicateProformaDoc(id) {
  const src = getProformaDoc(id)
  if (!src) return null
  return saveProformaDoc(cloneProformaDoc(src))
}

export function searchProformaDocs(query) {
  const q = String(query || '').trim().toLowerCase()
  const all = listProformaDocs()
  if (!q) return all
  return all.filter((d) => d.name.toLowerCase().includes(q))
}

let saveTimer = null
export function autosaveProformaDoc(doc, delay = 600) {
  return new Promise((resolve) => {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => resolve(saveProformaDoc(doc)), delay)
  })
}
