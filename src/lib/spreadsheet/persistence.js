import { createSafePersistStorage } from '@/lib/storage'
import { createSheet, cloneSheet } from './model'

const KEY = 'forma-spreadsheets'

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

export function listSheets() {
  return readAll().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
}

export function getSheet(id) {
  return readAll().find((s) => s.id === id) || null
}

export function saveSheet(sheet) {
  const list = readAll()
  const idx = list.findIndex((s) => s.id === sheet.id)
  const next = { ...sheet, updatedAt: Date.now() }
  if (idx >= 0) list[idx] = next
  else list.unshift(next)
  writeAll(list)
  return next
}

export function createAndSave(name) {
  return saveSheet(createSheet(name))
}

export function deleteSheet(id) {
  writeAll(readAll().filter((s) => s.id !== id))
}

export function duplicateSheet(id) {
  const src = getSheet(id)
  if (!src) return null
  return saveSheet(cloneSheet(src))
}

export function searchSheets(query) {
  const q = String(query || '').trim().toLowerCase()
  const all = listSheets()
  if (!q) return all
  return all.filter((s) => s.name.toLowerCase().includes(q))
}

export function sortSheets(list, by = 'updated', dir = 'desc') {
  const copy = [...list]
  copy.sort((a, b) => {
    let va = by === 'name' ? a.name.toLowerCase() : (a.updatedAt || 0)
    let vb = by === 'name' ? b.name.toLowerCase() : (b.updatedAt || 0)
    if (by === 'name') return dir === 'asc' ? va.localeCompare(vb, 'fr') : vb.localeCompare(va, 'fr')
    return dir === 'asc' ? va - vb : vb - va
  })
  return copy
}

// Debounced autosave helper
let saveTimer = null
export function autosaveSheet(sheet, delay = 400) {
  return new Promise((resolve) => {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => resolve(saveSheet(sheet)), delay)
  })
}
