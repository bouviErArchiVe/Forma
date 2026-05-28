/** FormaCloud — file d'attente sync (après sauvegarde locale) */

import { safeJsonParse, safeGetLocalStorage, safeSetLocalStorage } from '@/lib/storage'
import { FORMA_CLOUD_QUEUE_KEY } from './constants'

function readQueue() {
  return safeJsonParse(safeGetLocalStorage(FORMA_CLOUD_QUEUE_KEY, '[]'), [])
}

function writeQueue(items) {
  safeSetLocalStorage(FORMA_CLOUD_QUEUE_KEY, JSON.stringify(items.slice(-20)))
}

let dirtyTimer = null

/** Marque les données comme à synchroniser (debounce 8s) */
export function notifyFormaCloudDirty(onReady) {
  const queue = readQueue()
  const item = { id: 'full_snapshot', enqueuedAt: Date.now(), attempts: 0 }
  const idx = queue.findIndex((q) => q.id === 'full_snapshot')
  if (idx >= 0) queue[idx] = item
  else queue.push(item)
  writeQueue(queue)

  if (dirtyTimer) clearTimeout(dirtyTimer)
  dirtyTimer = setTimeout(() => {
    dirtyTimer = null
    onReady?.()
  }, 8000)
}

export function getFormaCloudQueueCount() {
  return readQueue().length
}

export function clearFormaCloudQueue() {
  writeQueue([])
}

export function markFormaCloudQueueDone() {
  writeQueue(readQueue().filter((q) => q.id !== 'full_snapshot'))
}

export function markFormaCloudQueueFailed() {
  const queue = readQueue()
  const idx = queue.findIndex((q) => q.id === 'full_snapshot')
  if (idx >= 0) {
    queue[idx].attempts = (queue[idx].attempts || 0) + 1
    queue[idx].lastAttempt = Date.now()
  }
  writeQueue(queue)
}

export function shouldProcessFormaCloudQueue() {
  const queue = readQueue()
  const item = queue.find((q) => q.id === 'full_snapshot')
  if (!item) return false
  if (item.lastAttempt && Date.now() - item.lastAttempt < 30_000 && item.attempts > 0) return false
  return true
}
