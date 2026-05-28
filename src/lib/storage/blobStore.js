import { idbPut, idbGet, idbDelete, idbAvailable, IDB_STORES } from '@/lib/storage/indexedDb'

const STORE = IDB_STORES.blobs

async function dataUrlToBlob(dataUrl) {
  const res = await fetch(dataUrl)
  return res.blob()
}

export async function putBlob(id, data) {
  if (!id || !idbAvailable()) return false
  try {
    const blob = data instanceof Blob ? data : await dataUrlToBlob(data)
    await idbPut(STORE, { id, blob, updatedAt: Date.now() })
    return true
  } catch {
    return false
  }
}

export async function getBlob(id) {
  if (!id || !idbAvailable()) return null
  try {
    const rec = await idbGet(STORE, id)
    return rec?.blob || null
  } catch {
    return null
  }
}

export async function getBlobUrl(id) {
  const blob = await getBlob(id)
  if (!blob) return null
  return URL.createObjectURL(blob)
}

export async function deleteBlob(id) {
  if (!id || !idbAvailable()) return
  try {
    await idbDelete(STORE, id)
  } catch { /* ignore */ }
}

export function shouldUseBlobStorage(sizeOrLength) {
  return (sizeOrLength || 0) > 48000
}
