import { getFolderChildren } from '@/lib/folders/tree'
import { getNotebookItemStats } from '@/lib/folders/stats'

export const FOLDER_VIEWS = [
  { id: 'grid', label: 'Grille', icon: '⊞' },
  { id: 'list', label: 'Liste', icon: '☰' },
  { id: 'details', label: 'Détails', icon: '▤' },
]

export const FOLDER_SORTS = [
  { id: 'manual', label: 'Manuel' },
  { id: 'name', label: 'Nom' },
  { id: 'updated', label: 'Modifié' },
  { id: 'created', label: 'Créé' },
  { id: 'type', label: 'Type' },
  { id: 'size', label: 'Taille' },
]

export const CONTENT_FILTERS = [
  { id: 'all', label: 'Tout' },
  { id: 'folders', label: 'Dossiers' },
  { id: 'notebooks', label: 'Carnets' },
]

export function sortFolderItems(folders, notebooks, sortId, subjects, folderId) {
  const subfolders = getFolderChildren(folders, folderId || null).map((f) => ({
    kind: 'folder',
    id: f.id,
    name: f.name,
    updatedAt: f.updatedAt,
    createdAt: f.createdAt,
    sortOrder: f.sortOrder ?? 0,
    raw: f,
  }))
  const books = (notebooks || [])
    .filter((n) => (n.folder_id || null) === (folderId || null))
    .map((n) => {
      const stats = getNotebookItemStats(n, subjects)
      return {
        kind: 'notebook',
        id: n.id,
        name: stats.name,
        updatedAt: n.updated_at,
        createdAt: n.created_at,
        sortOrder: 0,
        bytes: stats.bytes,
        raw: n,
        stats,
      }
    })

  const items = [...subfolders, ...books]
  const cmpDate = (a, b, key) => new Date(b[key] || 0) - new Date(a[key] || 0)

  switch (sortId) {
    case 'manual':
      return items.sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === 'folder' ? -1 : 1
        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name, 'fr')
      })
    case 'name':
      return items.sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }))
    case 'created':
      return items.sort((a, b) => cmpDate(a, b, 'createdAt'))
    case 'type':
      return items.sort((a, b) => {
        const t = a.kind.localeCompare(b.kind)
        return t || a.name.localeCompare(b.name, 'fr')
      })
    case 'size':
      return items.sort((a, b) => (b.bytes || 0) - (a.bytes || 0) || a.name.localeCompare(b.name, 'fr'))
    default:
      return items.sort((a, b) => cmpDate(a, b, 'updatedAt'))
  }
}

export function filterFolderItems(items, query, contentFilter) {
  let out = items
  if (contentFilter === 'folders') out = out.filter((i) => i.kind === 'folder')
  if (contentFilter === 'notebooks') out = out.filter((i) => i.kind === 'notebook')
  const q = String(query || '').trim().toLowerCase()
  if (!q) return out
  return out.filter((i) => i.name.toLowerCase().includes(q))
}
