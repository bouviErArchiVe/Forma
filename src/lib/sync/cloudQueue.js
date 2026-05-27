/** FormaSync — file d'attente cloud (optionnelle) */

import { SYNC_KEYS, CLOUD_RETRY_MS } from './constants'
import { safeJsonParse, safeGetLocalStorage, safeSetLocalStorage } from '@/lib/storage'
import { isOnline } from './localVault'

function readQueue() {
  return safeJsonParse(safeGetLocalStorage(SYNC_KEYS.cloudQueue, '[]'), [])
}

function writeQueue(items) {
  safeSetLocalStorage(SYNC_KEYS.cloudQueue, JSON.stringify(items.slice(-100)))
}

function uid() {
  return `cq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function enqueueCloudSync({ resourceType, resourceId, label }) {
  const queue = readQueue()
  const existing = queue.findIndex((q) => q.resourceType === resourceType && q.resourceId === resourceId)
  const item = {
    id: uid(),
    resourceType,
    resourceId,
    label: label || resourceId,
    enqueuedAt: Date.now(),
    attempts: 0,
  }
  if (existing >= 0) {
    queue[existing] = { ...queue[existing], enqueuedAt: Date.now(), attempts: queue[existing].attempts }
  } else {
    queue.push(item)
  }
  writeQueue(queue)
  return item
}

export function getCloudQueue() {
  return readQueue()
}

export function getCloudQueueCount() {
  return readQueue().length
}

export function removeFromCloudQueue(resourceType, resourceId) {
  writeQueue(readQueue().filter((q) => !(q.resourceType === resourceType && q.resourceId === resourceId)))
}

export function markCloudSyncFailed(resourceType, resourceId) {
  const queue = readQueue()
  const idx = queue.findIndex((q) => q.resourceType === resourceType && q.resourceId === resourceId)
  if (idx >= 0) {
    queue[idx].attempts = (queue[idx].attempts || 0) + 1
    queue[idx].lastAttempt = Date.now()
  }
  writeQueue(queue)
}

export async function processCloudQueue(handlers, { cloudEnabled } = {}) {
  if (!cloudEnabled || !isOnline()) return { processed: 0, failed: 0 }
  const queue = readQueue()
  let processed = 0
  let failed = 0

  for (const item of queue) {
    if (item.lastAttempt && Date.now() - item.lastAttempt < CLOUD_RETRY_MS && item.attempts > 0) continue
    const handler = handlers[item.resourceType]
    if (!handler) continue
    try {
      await handler(item.resourceId)
      removeFromCloudQueue(item.resourceType, item.resourceId)
      processed += 1
    } catch {
      markCloudSyncFailed(item.resourceType, item.resourceId)
      failed += 1
    }
  }
  return { processed, failed }
}
