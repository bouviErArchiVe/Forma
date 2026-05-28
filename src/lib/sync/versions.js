/** FormaSync — versions locales (IndexedDB pour gros payloads) */

import { SYNC_KEYS, MAX_LOCAL_VERSIONS, VERSION_MIN_INTERVAL_MS } from './constants'
import { safeJsonParse, safeGetLocalStorage, safeSetLocalStorage } from '@/lib/storage'
import { hashPayload, removeLocalData, saveLocalDataAsync } from './localVault'
import { idbAvailable, idbPut, idbGet, idbDelete, IDB_STORES } from '@/lib/storage/indexedDb'

function versionKey(id) {
  return `${SYNC_KEYS.versionPrefix}${id}`
}

function resourceKey(resourceType, resourceId) {
  return `${resourceType}:${resourceId}`
}

function readIndex() {
  return safeJsonParse(safeGetLocalStorage(SYNC_KEYS.versions, '{}'), {})
}

function writeIndex(index) {
  safeSetLocalStorage(SYNC_KEYS.versions, JSON.stringify(index))
}

function uid() {
  return `ver_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

async function storeVersionBlob(versionId, data) {
  const serialized = JSON.stringify(data)
  if (idbAvailable()) {
    await idbPut(IDB_STORES.versions, { id: versionId, data, createdAt: Date.now() })
  }
  safeSetLocalStorage(versionKey(versionId), serialized)
}

async function loadVersionBlob(versionId) {
  if (idbAvailable()) {
    try {
      const row = await idbGet(IDB_STORES.versions, versionId)
      if (row?.data) return row.data
    } catch { /* fallback */ }
  }
  return safeJsonParse(safeGetLocalStorage(versionKey(versionId), null), null)
}

export function listVersions(resourceType, resourceId) {
  const key = resourceKey(resourceType, resourceId)
  return (readIndex()[key] || []).sort((a, b) => b.createdAt - a.createdAt)
}

export async function getVersionData(versionId) {
  return loadVersionBlob(versionId)
}

export async function maybeSaveVersion(resourceType, resourceId, payload, label) {
  const key = resourceKey(resourceType, resourceId)
  const index = readIndex()
  const versions = index[key] || []
  const hash = hashPayload(payload)
  const last = versions[0]

  if (last?.hash === hash) return null
  if (last && Date.now() - last.createdAt < VERSION_MIN_INTERVAL_MS) return null

  const versionId = uid()
  await storeVersionBlob(versionId, {
    resourceType,
    resourceId,
    payload,
    createdAt: Date.now(),
  })

  const entry = {
    id: versionId,
    hash,
    label: label || `Version ${new Date().toLocaleString('fr-FR')}`,
    createdAt: Date.now(),
    size: typeof payload === 'string' ? payload.length : JSON.stringify(payload).length,
  }

  const next = [entry, ...versions].slice(0, MAX_LOCAL_VERSIONS)
  index[key] = next
  writeIndex(index)

  if (versions.length >= MAX_LOCAL_VERSIONS) {
    const removed = versions.slice(MAX_LOCAL_VERSIONS - 1)
    for (const v of removed) {
      removeLocalData(versionKey(v.id))
      if (idbAvailable()) idbDelete(IDB_STORES.versions, v.id).catch(() => {})
    }
  }

  return entry
}

export async function saveVersionNow(resourceType, resourceId, payload, label) {
  const key = resourceKey(resourceType, resourceId)
  const index = readIndex()
  const versions = index[key] || []
  const versionId = uid()
  await storeVersionBlob(versionId, {
    resourceType,
    resourceId,
    payload,
    createdAt: Date.now(),
  })
  const entry = {
    id: versionId,
    hash: hashPayload(payload),
    label: label || `Point de restauration ${new Date().toLocaleString('fr-FR')}`,
    createdAt: Date.now(),
    size: typeof payload === 'string' ? payload.length : JSON.stringify(payload).length,
  }
  index[key] = [entry, ...versions].slice(0, MAX_LOCAL_VERSIONS)
  writeIndex(index)
  return entry
}

export async function restoreVersion(versionId) {
  const data = await loadVersionBlob(versionId)
  if (!data) throw new Error('Version introuvable')
  return data
}

export function deleteVersion(versionId, resourceType, resourceId) {
  removeLocalData(versionKey(versionId))
  if (idbAvailable()) idbDelete(IDB_STORES.versions, versionId).catch(() => {})
  const key = resourceKey(resourceType, resourceId)
  const index = readIndex()
  index[key] = (index[key] || []).filter((v) => v.id !== versionId)
  writeIndex(index)
}

export function getAllVersionedResources() {
  const index = readIndex()
  return Object.entries(index).map(([key, versions]) => {
    const [resourceType, ...rest] = key.split(':')
    const list = Array.isArray(versions) ? versions : []
    return { resourceType, resourceId: rest.join(':'), versions: list, count: list.length }
  })
}

// Sync wrapper for callers expecting sync getVersionData
export function getVersionDataSync(versionId) {
  return safeJsonParse(safeGetLocalStorage(versionKey(versionId), null), null)
}
