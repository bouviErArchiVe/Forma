/** FormaSync — file d'attente offline (sauvegarde locale différée) */

import { IDB_STORES } from '@/lib/storage/indexedDb'
import { idbPut, idbGetAll, idbDelete, idbAvailable } from '@/lib/storage/indexedDb'
import { safeJsonParse, safeGetLocalStorage, safeSetLocalStorage } from '@/lib/storage'
import { saveLocalDataAsync } from './localVault'

const LS_KEY = 'forma-offline-save-queue'

function uid() {
  return `oq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

async function readQueueAsync() {
  if (idbAvailable()) {
    try {
      const rows = await idbGetAll(IDB_STORES.offline_queue)
      if (rows?.length) return rows.sort((a, b) => a.enqueuedAt - b.enqueuedAt)
    } catch { /* fallback */ }
  }
  return safeJsonParse(safeGetLocalStorage(LS_KEY, '[]'), [])
}

function readQueueSync() {
  return safeJsonParse(safeGetLocalStorage(LS_KEY, '[]'), [])
}

async function writeQueue(items) {
  const trimmed = items.slice(-100)
  safeSetLocalStorage(LS_KEY, JSON.stringify(trimmed))
  if (idbAvailable()) {
    try {
      const existing = await idbGetAll(IDB_STORES.offline_queue)
      for (const row of existing) {
        await idbDelete(IDB_STORES.offline_queue, row.id)
      }
      for (const item of trimmed) {
        await idbPut(IDB_STORES.offline_queue, item)
      }
    } catch { /* LS mirror ok */ }
  }
}

export function enqueueOfflineSave({ storageKey, payload, resourceType, resourceId, label }) {
  const queue = readQueueSync()
  const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload)
  const idx = queue.findIndex((q) => q.storageKey === storageKey && q.resourceId === resourceId)
  const item = {
    id: idx >= 0 ? queue[idx].id : uid(),
    storageKey,
    payload: serialized,
    resourceType,
    resourceId,
    label: label || resourceId,
    enqueuedAt: Date.now(),
    attempts: idx >= 0 ? (queue[idx].attempts || 0) : 0,
  }
  if (idx >= 0) queue[idx] = item
  else queue.push(item)
  writeQueue(queue)
  return item
}

export function getOfflineQueueCount() {
  return readQueueSync().length
}

export async function processOfflineQueue() {
  const queue = await readQueueAsync()
  if (!queue.length) return { processed: 0, failed: 0 }

  let processed = 0
  let failed = 0
  const remaining = []

  for (const item of queue) {
    try {
      await saveLocalDataAsync(item.storageKey, item.payload)
      processed += 1
    } catch {
      item.attempts = (item.attempts || 0) + 1
      if (item.attempts < 5) remaining.push(item)
      failed += 1
    }
  }

  await writeQueue(remaining)
  return { processed, failed }
}

export function clearOfflineQueue() {
  writeQueue([])
}
