import { createSafePersistStorage } from '@/lib/storage'
import { createFolder, createItem } from './model'
import { LIBRARY_PRESETS } from './constants'
import { putBlob, getBlobUrl, deleteBlob, shouldUseBlobStorage } from '@/lib/storage/blobStore'

const KEY = 'forma-library'

function readStore() {
  try {
    const raw = createSafePersistStorage().getItem(KEY)
    const data = raw ? JSON.parse(raw) : null
    return {
      folders: Array.isArray(data?.folders) ? data.folders : [],
      items: Array.isArray(data?.items) ? data.items : [],
    }
  } catch {
    return { folders: [], items: [] }
  }
}

function writeStore(data) {
  createSafePersistStorage().setItem(KEY, JSON.stringify({ ...data, updatedAt: Date.now() }))
}

export function loadLibrary() {
  return readStore()
}

export function ensureLibraryPresets() {
  const store = readStore()
  if (store.folders.length > 0) return store
  const folders = LIBRARY_PRESETS.map((p) => createFolder({
    name: p.label,
    icon: p.icon,
    tags: p.tags,
    preset: p.id,
  }))
  const next = { folders, items: store.items }
  writeStore(next)
  return next
}

export function saveLibrary(data) {
  writeStore(data)
  return data
}

export function listFolders() {
  return readStore().folders
}

export function listItems(folderId) {
  const { items } = readStore()
  if (folderId === undefined) return items
  return items.filter((i) => (i.folderId || null) === (folderId || null))
}

export function listAllItems() {
  return readStore().items
}

export function saveFolder(folder) {
  const store = readStore()
  const idx = store.folders.findIndex((f) => f.id === folder.id)
  const next = { ...folder, updatedAt: Date.now() }
  if (idx >= 0) store.folders[idx] = next
  else store.folders.unshift(next)
  writeStore(store)
  return next
}

export function createAndSaveFolder(partial) {
  return saveFolder(createFolder(partial))
}

export function deleteFolder(id) {
  const store = readStore()
  const ids = new Set([id])
  let changed = true
  while (changed) {
    changed = false
    for (const f of store.folders) {
      if (f.parentId && ids.has(f.parentId) && !ids.has(f.id)) { ids.add(f.id); changed = true }
    }
  }
  store.folders = store.folders.filter((f) => !ids.has(f.id))
  store.items = store.items.filter((i) => !ids.has(i.folderId))
  writeStore(store)
}

export function saveItem(item) {
  const store = readStore()
  const idx = store.items.findIndex((i) => i.id === item.id)
  const payload = { ...item }
  if (payload._blobUrl) {
    delete payload._blobUrl
    delete payload.dataUrl
    delete payload.previewUrl
  }
  const next = { ...payload, updatedAt: Date.now() }
  if (idx >= 0) store.items[idx] = next
  else store.items.unshift(next)
  writeStore(store)
  return next
}

/** Persiste le fichier volumineux en IndexedDB et garde les métadonnées en localStorage. */
export async function saveItemWithBlob(item) {
  if (!item) return null
  let next = { ...item }
  const src = item.dataUrl || item.previewUrl
  if (src && !item.blobId && shouldUseBlobStorage(item.size || src.length)) {
    const blobId = item.blobId || `flb_${item.id}`
    const ok = await putBlob(blobId, src)
    if (ok) {
      next = { ...next, blobId, dataUrl: null, previewUrl: null }
    }
  }
  return saveItem(next)
}

export async function hydrateLibraryItem(item) {
  if (!item?.blobId) return item
  const url = await getBlobUrl(item.blobId)
  if (!url) return item
  return { ...item, dataUrl: url, previewUrl: url, _blobUrl: true }
}

export async function hydrateLibraryItems(items) {
  return Promise.all((items || []).map(hydrateLibraryItem))
}

export async function deleteItemWithBlob(id) {
  const store = readStore()
  const item = store.items.find((i) => i.id === id)
  if (item?.blobId) await deleteBlob(item.blobId)
  store.items = store.items.filter((i) => i.id !== id)
  writeStore(store)
}

export function createAndSaveItem(partial) {
  return saveItem(createItem(partial))
}

export function deleteItem(id) {
  const store = readStore()
  const item = store.items.find((i) => i.id === id)
  if (item?.blobId) deleteBlob(item.blobId).catch(() => {})
  store.items = store.items.filter((i) => i.id !== id)
  writeStore(store)
}

export function moveItem(id, folderId) {
  const store = readStore()
  const idx = store.items.findIndex((i) => i.id === id)
  if (idx >= 0) {
    store.items[idx] = { ...store.items[idx], folderId: folderId || null, updatedAt: Date.now() }
    writeStore(store)
  }
}

export function duplicateItem(id) {
  const store = readStore()
  const src = store.items.find((i) => i.id === id)
  if (!src) return null
  const copy = createItem({ ...src, name: `${src.name} (copie)` })
  store.items.unshift(copy)
  writeStore(store)
  return copy
}

let timer = null
export function autosaveLibrary(getData, delay = 400) {
  return new Promise((resolve) => {
    clearTimeout(timer)
    timer = setTimeout(() => resolve(saveLibrary(getData())), delay)
  })
}
