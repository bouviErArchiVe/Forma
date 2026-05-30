/** FormaLibrary — modèle dossiers et items (local-first, blobs en Dexie). */

import { createId } from '../id'

export type LibraryCategoryId =
  | 'texture'
  | 'material'
  | 'detail'
  | 'block'
  | 'image'
  | 'reference'
  | 'pdf'
  | 'norm'
  | 'palette'
  | 'object'
  | 'doc'
  | 'sheet'
  | 'svg'
  | 'dwg'
  | 'note'

export interface LibraryFolder {
  id: string
  parentId: string | null
  name: string
  icon: string
  tags: string[]
  favorite: boolean
  preset: string | null
  createdAt: number
  updatedAt: number
}

export interface LibraryItem {
  id: string
  folderId: string | null
  name: string
  category: LibraryCategoryId
  mimeType: string | null
  tags: string[]
  favorite: boolean
  /** Fichier binaire (image/pdf/…) conservé localement en IndexedDB. */
  blob?: Blob
  textContent: string
  size: number
  pageCount: number
  refModule: string | null
  refId: string | null
  metadata: Record<string, unknown>
  createdAt: number
  updatedAt: number
}

export interface LibraryFolderNode extends LibraryFolder {
  children: LibraryFolderNode[]
}

export function createFolder(partial: Partial<LibraryFolder> = {}): LibraryFolder {
  const now = Date.now()
  return {
    id: partial.id || createId(),
    parentId: partial.parentId ?? null,
    name: partial.name || 'Dossier',
    icon: partial.icon || '📁',
    tags: partial.tags || [],
    favorite: !!partial.favorite,
    preset: partial.preset ?? null,
    createdAt: partial.createdAt || now,
    updatedAt: now,
  }
}

export function createItem(partial: Partial<LibraryItem> = {}): LibraryItem {
  const now = Date.now()
  return {
    id: partial.id || createId(),
    folderId: partial.folderId ?? null,
    name: partial.name || 'Sans titre',
    category: partial.category || 'image',
    mimeType: partial.mimeType ?? null,
    tags: partial.tags || [],
    favorite: !!partial.favorite,
    blob: partial.blob,
    textContent: partial.textContent || '',
    size: partial.size || 0,
    pageCount: partial.pageCount || 0,
    refModule: partial.refModule ?? null,
    refId: partial.refId ?? null,
    metadata: partial.metadata || {},
    createdAt: partial.createdAt || now,
    updatedAt: now,
  }
}

export function buildFolderTree(folders: LibraryFolder[]): LibraryFolderNode[] {
  const byParent: Record<string, LibraryFolder[]> = {}
  for (const f of folders || []) {
    const pid = f.parentId || 'root'
    ;(byParent[pid] ||= []).push(f)
  }
  for (const list of Object.values(byParent)) {
    list.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  }
  const walk = (parentId: string | null): LibraryFolderNode[] =>
    (byParent[parentId || 'root'] || []).map((f) => ({ ...f, children: walk(f.id) }))
  return walk(null)
}

export function getFolderPath(folders: LibraryFolder[], folderId: string | null): LibraryFolder[] {
  if (!folderId) return []
  const map = Object.fromEntries((folders || []).map((f) => [f.id, f]))
  const path: LibraryFolder[] = []
  let cur: LibraryFolder | undefined = map[folderId]
  while (cur) {
    path.unshift(cur)
    cur = cur.parentId ? map[cur.parentId] : undefined
  }
  return path
}

export function getDescendantFolderIds(
  folders: LibraryFolder[],
  folderId: string | null,
): string[] {
  const ids: string[] = folderId ? [folderId] : []
  const children = (folders || []).filter((f) => (f.parentId || null) === folderId)
  for (const c of children) ids.push(...getDescendantFolderIds(folders, c.id))
  return ids
}
