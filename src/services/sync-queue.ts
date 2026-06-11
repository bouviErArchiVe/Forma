/**
 * Squelette sync future (addendum §17) — journal d’opérations, pas de backend encore.
 */

export type SyncOpType = 'page_update' | 'notebook_update' | 'page_delete'

export type SyncOpStatus = 'pending' | 'applied' | 'synced' | 'failed'

export interface SyncOperation {
  id: string
  type: SyncOpType
  entityId: string
  payload: unknown
  createdAt: number
  retries: number
  status: SyncOpStatus
}

const STORAGE_KEY = 'forma-sync-queue'
export const MAX_OPS = 500
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

const queue: SyncOperation[] = loadQueue()

function normalizeOp(raw: SyncOperation): SyncOperation {
  const status =
    raw.status === 'applied' ||
    raw.status === 'synced' ||
    raw.status === 'failed' ||
    raw.status === 'pending'
      ? raw.status
      : 'pending'
  return {
    ...raw,
    retries: typeof raw.retries === 'number' ? raw.retries : 0,
    status,
  }
}

export function pruneQueue(
  ops: SyncOperation[],
  now = Date.now(),
): SyncOperation[] {
  const cutoff = now - MAX_AGE_MS
  const fresh = ops.filter((op) => op.createdAt >= cutoff)
  return fresh.length > MAX_OPS ? fresh.slice(-MAX_OPS) : fresh
}

function loadQueue(): SyncOperation[] {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY)
    if (raw && !localStorage.getItem(STORAGE_KEY) && sessionStorage.getItem(STORAGE_KEY)) {
      try {
        localStorage.setItem(STORAGE_KEY, raw)
        sessionStorage.removeItem(STORAGE_KEY)
      } catch {
        /* quota */
      }
    }
    if (!raw) return []
    const parsed = JSON.parse(raw) as SyncOperation[]
    if (!Array.isArray(parsed)) return []
    return pruneQueue(parsed.map(normalizeOp))
  } catch {
    return []
  }
}

function persistQueue(): void {
  const pruned = pruneQueue(queue)
  queue.length = 0
  queue.push(...pruned)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
  } catch {
    /* quota — ignorer */
  }
}

export function enqueueSyncOp(op: Omit<SyncOperation, 'retries' | 'status'>): void {
  const existing = queue.findIndex((q) => q.type === op.type && q.entityId === op.entityId)
  const entry: SyncOperation = { ...op, retries: 0, status: 'pending' }
  if (existing >= 0) queue[existing] = entry
  else queue.push(entry)
  persistQueue()
}

export function peekSyncQueue(): readonly SyncOperation[] {
  return queue
}

export function clearSyncQueue(): void {
  queue.length = 0
  localStorage.removeItem(STORAGE_KEY)
  sessionStorage.removeItem(STORAGE_KEY)
}

/**
 * Simulation locale : marque les ops `pending` en `applied`.
 * Le passage à `synced` / `failed` viendra avec l’API cloud (voir docs/SYNC_API.md).
 */
export async function processSyncQueue(): Promise<{ processed: number }> {
  let processed = 0
  for (const op of queue) {
    if (op.status === 'pending') {
      op.status = 'applied'
      processed++
    }
  }
  persistQueue()
  return { processed }
}
