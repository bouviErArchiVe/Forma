/** FormaCombine — historique des exports PDF (métadonnées LS + blobs IDB) */

import { createSafePersistStorage } from '@/lib/storage'
import { putBlob, getBlobUrl, getBlob, deleteBlob } from '@/lib/storage/blobStore'

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

export async function saveCombineExport({ name, pageCount, fileCount, pdfBlob, pdfDataUrl }) {
  const id = `exp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  let blobId = null
  if (pdfBlob) {
    await putBlob(id, pdfBlob)
    blobId = id
  } else if (pdfDataUrl) {
    await putBlob(id, pdfDataUrl)
    blobId = id
  } else {
    return null
  }
  const entry = {
    id,
    name: name || 'Export FormaCombine',
    pageCount: pageCount || 0,
    fileCount: fileCount || 0,
    blobId,
    createdAt: Date.now(),
  }
  const list = [entry, ...readAll()].slice(0, MAX)
  writeAll(list)
  return entry
}

export function deleteCombineExport(id) {
  const entry = readAll().find((e) => e.id === id)
  if (entry?.blobId) deleteBlob(entry.blobId).catch(() => {})
  writeAll(readAll().filter((e) => e.id !== id))
}

async function resolveExportUrl(entry) {
  if (!entry) return null
  if (entry.pdfDataUrl) return entry.pdfDataUrl
  if (entry.blobId) return getBlobUrl(entry.blobId)
  return null
}

export async function downloadExport(entry) {
  const url = await resolveExportUrl(entry)
  if (!url) return
  const a = document.createElement('a')
  a.href = url
  a.download = `${(entry.name || 'formacombine').replace(/[^\w\- ]+/g, '_')}.pdf`
  a.click()
  if (entry.blobId && url.startsWith('blob:')) {
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }
}

export async function openExport(entry) {
  const url = await resolveExportUrl(entry)
  if (url) window.open(url, '_blank')
}

export async function shareExport(entry) {
  const blob = entry?.blobId ? await getBlob(entry.blobId) : null
  if (blob && navigator.share && navigator.canShare?.({ files: [new File([blob], 'x.pdf', { type: 'application/pdf' })] })) {
    const file = new File([blob], `${(entry.name || 'formacombine').replace(/[^\w\- ]+/g, '_')}.pdf`, { type: 'application/pdf' })
    await navigator.share({ files: [file], title: entry.name || 'FormaCombine' })
    return true
  }
  await downloadExport(entry)
  return false
}

export function exportSizeLabel(entry) {
  const bytes = entry?.pdfDataUrl
    ? Math.round(entry.pdfDataUrl.length * 0.75)
    : entry?.sizeBytes || 0
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}
