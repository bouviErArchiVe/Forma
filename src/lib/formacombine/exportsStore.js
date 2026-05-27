/** FormaCombine — historique des exports PDF */

import { createSafePersistStorage } from '@/lib/storage'

const KEY = 'forma-combine-exports'
const MAX = 15

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
  createSafePersistStorage().setItem(KEY, JSON.stringify(list.slice(0, MAX)))
}

export function listCombineExports() {
  return readAll().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}

export function saveCombineExport({ name, pageCount, fileCount, pdfDataUrl }) {
  if (!pdfDataUrl) return null
  const entry = {
    id: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: name || 'Export FormaCombine',
    pageCount: pageCount || 0,
    fileCount: fileCount || 0,
    pdfDataUrl,
    createdAt: Date.now(),
  }
  const list = [entry, ...readAll()].slice(0, MAX)
  writeAll(list)
  return entry
}

export function deleteCombineExport(id) {
  writeAll(readAll().filter((e) => e.id !== id))
}

export function downloadExport(entry) {
  if (!entry?.pdfDataUrl) return
  const a = document.createElement('a')
  a.href = entry.pdfDataUrl
  a.download = `${(entry.name || 'formacombine').replace(/[^\w\- ]+/g, '_')}.pdf`
  a.click()
}

export function openExport(entry) {
  if (!entry?.pdfDataUrl) return
  window.open(entry.pdfDataUrl, '_blank')
}

export function exportSizeLabel(entry) {
  const bytes = entry?.pdfDataUrl ? Math.round(entry.pdfDataUrl.length * 0.75) : 0
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}
