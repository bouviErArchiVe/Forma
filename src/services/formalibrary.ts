/** FormaLibrary — service Dexie (dossiers + items avec blobs locaux). */

import { db } from '../db'
import { LIBRARY_PRESETS } from '../lib/formalibrary/constants'
import {
  createFolder,
  getDescendantFolderIds,
  type LibraryFolder,
  type LibraryItem,
} from '../lib/formalibrary/model'

const urlCache = new Map<string, string>()

export async function listFolders(): Promise<LibraryFolder[]> {
  return db.libraryFolders.toArray()
}

export async function listItems(): Promise<LibraryItem[]> {
  return db.libraryItems.orderBy('updatedAt').reverse().toArray()
}

/** Crée les dossiers presets au premier lancement (idempotent). */
export async function ensurePresets(): Promise<LibraryFolder[]> {
  const existing = await db.libraryFolders.count()
  if (existing > 0) return listFolders()
  const folders = LIBRARY_PRESETS.map((p) =>
    createFolder({ name: p.label, icon: p.icon, tags: p.tags, preset: p.id }),
  )
  await db.libraryFolders.bulkPut(folders)
  return folders
}

export async function saveFolder(folder: LibraryFolder): Promise<LibraryFolder> {
  const next = { ...folder, updatedAt: Date.now() }
  await db.libraryFolders.put(next)
  return next
}

export async function createAndSaveFolder(
  partial: Partial<LibraryFolder>,
): Promise<LibraryFolder> {
  return saveFolder(createFolder(partial))
}

export async function deleteFolder(id: string): Promise<void> {
  const folders = await listFolders()
  const ids = new Set(getDescendantFolderIds(folders, id))
  const items = await db.libraryItems.toArray()
  const itemIds = items.filter((i) => i.folderId != null && ids.has(i.folderId)).map((i) => i.id)
  for (const iid of itemIds) revokeItemUrl(iid)
  await db.transaction('rw', db.libraryFolders, db.libraryItems, async () => {
    await db.libraryFolders.bulkDelete([...ids])
    await db.libraryItems.bulkDelete(itemIds)
  })
}

export async function saveItem(item: LibraryItem): Promise<LibraryItem> {
  const next = { ...item, updatedAt: Date.now() }
  await db.libraryItems.put(next)
  revokeItemUrl(next.id)
  return next
}

export async function deleteItem(id: string): Promise<void> {
  revokeItemUrl(id)
  await db.libraryItems.delete(id)
}

export async function moveItem(id: string, folderId: string | null): Promise<void> {
  await db.libraryItems.update(id, { folderId, updatedAt: Date.now() })
}

export async function toggleItemFavorite(id: string): Promise<void> {
  const item = await db.libraryItems.get(id)
  if (!item) return
  await db.libraryItems.update(id, { favorite: !item.favorite, updatedAt: Date.now() })
}

/** URL objet (cachée) pour prévisualiser/ouvrir le blob d'un item. */
export function getItemUrl(item: LibraryItem): string {
  if (!item.blob) return ''
  const hit = urlCache.get(item.id)
  if (hit) return hit
  const url = URL.createObjectURL(item.blob)
  urlCache.set(item.id, url)
  return url
}

function revokeItemUrl(id: string): void {
  const url = urlCache.get(id)
  if (url) {
    URL.revokeObjectURL(url)
    urlCache.delete(id)
  }
}

export function revokeAllItemUrls(): void {
  for (const url of urlCache.values()) URL.revokeObjectURL(url)
  urlCache.clear()
}
