import { loadLocalPages } from '@/lib/projectPersistence'
import { getFolderChildren, getFolderDescendantIds } from '@/lib/folders/tree'

function byteLen(str) {
  try {
    return new Blob([str]).size
  } catch {
    return String(str || '').length
  }
}

export function estimateNotebookBytes(notebook) {
  if (!notebook?.id) return 0
  let total = byteLen(JSON.stringify(notebook))
  try {
    const pages = loadLocalPages(notebook.id)
    total += byteLen(JSON.stringify(pages))
  } catch { /* ignore */ }
  return total
}

export function formatBytes(bytes) {
  const b = Number(bytes) || 0
  if (b < 1024) return `${b} o`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} Ko`
  return `${(b / (1024 * 1024)).toFixed(1)} Mo`
}

export function getFolderStats(folderId, folders, notebooks, { recursive = true } = {}) {
  const folder = folderId ? folders.find((f) => f.id === folderId) : null
  const folderIds = folderId
    ? (recursive ? [folderId, ...getFolderDescendantIds(folders, folderId)] : [folderId])
    : folders.map((f) => f.id)

  const subfolderCount = folderId
    ? getFolderChildren(folders, folderId).length
    : getFolderChildren(folders, null).length

  const directNotebooks = (notebooks || []).filter((n) => n.folder_id === folderId)
  const allNotebooks = (notebooks || []).filter((n) => folderIds.includes(n.folder_id))
  const list = recursive ? allNotebooks : directNotebooks

  const totalBytes = list.reduce((sum, nb) => sum + estimateNotebookBytes(nb), 0)

  return {
    folderId,
    name: folder?.name || 'Bibliothèque',
    path: folder?.name || '/',
    createdAt: folder?.createdAt || null,
    updatedAt: folder?.updatedAt || null,
    lastOpenedAt: folder?.lastOpenedAt || null,
    subfolderCount,
    hasSubfolders: subfolderCount > 0,
    notebookCount: directNotebooks.length,
    totalNotebookCount: allNotebooks.length,
    totalBytes,
    totalSizeLabel: formatBytes(totalBytes),
    isEmpty: subfolderCount === 0 && directNotebooks.length === 0,
    type: 'folder',
  }
}

export function getNotebookItemStats(notebook, subjects = []) {
  const subj = subjects.find((s) => s.id === notebook.subject)
  const bytes = estimateNotebookBytes(notebook)
  let pageCount = 0
  try {
    pageCount = loadLocalPages(notebook.id).length
  } catch { /* ignore */ }
  return {
    id: notebook.id,
    name: notebook.title || 'Sans titre',
    type: 'notebook',
    subject: subj?.l || notebook.subject || '—',
    createdAt: notebook.created_at,
    updatedAt: notebook.updated_at,
    pageCount,
    bytes,
    sizeLabel: formatBytes(bytes),
    folder_id: notebook.folder_id || null,
  }
}
