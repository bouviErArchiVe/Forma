import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  MAX_OPS,
  clearSyncQueue,
  enqueueSyncOp,
  peekSyncQueue,
  processSyncQueue,
  pruneQueue,
} from './sync-queue'
import type { SyncOperation } from './sync-queue'

const STORAGE_KEY = 'forma-sync-queue'
const DAY_MS = 24 * 60 * 60 * 1000

/** Horodatage récent pour éviter le pruning 30 jours dans les tests d’enqueue. */
function recentAt(offsetMs = 0): number {
  return Date.now() + offsetMs
}

function makeOp(
  partial: Partial<SyncOperation> & Pick<SyncOperation, 'id' | 'type' | 'entityId' | 'createdAt'>,
): SyncOperation {
  return {
    payload: null,
    retries: 0,
    status: 'pending',
    ...partial,
  }
}

describe('sync-queue', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    clearSyncQueue()
  })

  afterEach(() => {
    clearSyncQueue()
    vi.useRealTimers()
  })

  it('deduplicates ops by type and entityId', () => {
    enqueueSyncOp({
      id: 'op1',
      type: 'page_update',
      entityId: 'page-a',
      payload: { v: 1 },
      createdAt: recentAt(0),
    })
    enqueueSyncOp({
      id: 'op2',
      type: 'page_update',
      entityId: 'page-a',
      payload: { v: 2 },
      createdAt: recentAt(1),
    })
    const q = peekSyncQueue()
    expect(q).toHaveLength(1)
    expect(q[0].id).toBe('op2')
    expect(q[0].payload).toEqual({ v: 2 })
    expect(q[0].status).toBe('pending')
  })

  it('new ops are pending', () => {
    enqueueSyncOp({
      id: 'op1',
      type: 'notebook_update',
      entityId: 'nb1',
      payload: null,
      createdAt: recentAt(),
    })
    expect(peekSyncQueue()[0].status).toBe('pending')
  })

  it('persists queue to localStorage', () => {
    enqueueSyncOp({
      id: 'op1',
      type: 'notebook_update',
      entityId: 'nb1',
      payload: null,
      createdAt: recentAt(),
    })
    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw!) as { entityId: string; status: string }[]
    expect(parsed[0].entityId).toBe('nb1')
    expect(parsed[0].status).toBe('pending')
  })

  it('migrates queue from sessionStorage to localStorage on load', async () => {
    clearSyncQueue()
    vi.resetModules()
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: 'legacy',
          type: 'page_delete',
          entityId: 'p-old',
          payload: null,
          createdAt: recentAt(),
          retries: 0,
        },
      ]),
    )
    const { peekSyncQueue: peekFresh } = await import('./sync-queue')
    expect(peekFresh()).toHaveLength(1)
    expect(peekFresh()[0].entityId).toBe('p-old')
    expect(peekFresh()[0].status).toBe('pending')
    expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy()
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('processSyncQueue marks pending ops as applied', async () => {
    enqueueSyncOp({
      id: 'op1',
      type: 'page_update',
      entityId: 'p1',
      payload: {},
      createdAt: recentAt(0),
    })
    enqueueSyncOp({
      id: 'op2',
      type: 'page_update',
      entityId: 'p2',
      payload: {},
      createdAt: recentAt(1),
    })
    await expect(processSyncQueue()).resolves.toEqual({ processed: 2 })
    const q = peekSyncQueue()
    expect(q).toHaveLength(2)
    expect(q.every((op) => op.status === 'applied')).toBe(true)
  })

  it('processSyncQueue skips non-pending ops', async () => {
    enqueueSyncOp({
      id: 'op1',
      type: 'page_update',
      entityId: 'p1',
      payload: {},
      createdAt: recentAt(),
    })
    const q = peekSyncQueue()
    ;(q[0] as { status: string }).status = 'synced'
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...q]))
    vi.resetModules()
    const { processSyncQueue: processFresh, peekSyncQueue: peekFresh } =
      await import('./sync-queue')
    await expect(processFresh()).resolves.toEqual({ processed: 0 })
    expect(peekFresh()[0].status).toBe('synced')
  })

  it('pruneQueue drops ops older than 30 days', () => {
    const now = 1_700_000_000_000
    const ops = [
      makeOp({
        id: 'old',
        type: 'page_update',
        entityId: 'a',
        createdAt: now - 31 * DAY_MS,
      }),
      makeOp({
        id: 'fresh',
        type: 'page_update',
        entityId: 'b',
        createdAt: now - 1 * DAY_MS,
      }),
    ]
    const pruned = pruneQueue(ops, now)
    expect(pruned).toHaveLength(1)
    expect(pruned[0].id).toBe('fresh')
  })

  it('pruneQueue keeps only the last MAX_OPS entries', () => {
    const now = Date.now()
    const ops = Array.from({ length: MAX_OPS + 50 }, (_, i) =>
      makeOp({
        id: `op-${i}`,
        type: 'page_update',
        entityId: `e-${i}`,
        createdAt: now + i,
      }),
    )
    const pruned = pruneQueue(ops, now)
    expect(pruned).toHaveLength(MAX_OPS)
    expect(pruned[0].id).toBe(`op-50`)
    expect(pruned[pruned.length - 1].id).toBe(`op-${MAX_OPS + 49}`)
  })

  it('load prunes stale ops from localStorage', async () => {
    clearSyncQueue()
    vi.resetModules()
    const now = 2_000_000_000_000
    vi.setSystemTime(now)
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        makeOp({
          id: 'stale',
          type: 'page_delete',
          entityId: 'old',
          createdAt: now - 40 * DAY_MS,
        }),
        makeOp({
          id: 'keep',
          type: 'page_delete',
          entityId: 'new',
          createdAt: now,
        }),
      ]),
    )
    const { peekSyncQueue: peekFresh } = await import('./sync-queue')
    expect(peekFresh()).toHaveLength(1)
    expect(peekFresh()[0].id).toBe('keep')
  })

  it('enqueue trims queue beyond MAX_OPS', () => {
    const base = Date.now()
    for (let i = 0; i < MAX_OPS + 10; i++) {
      enqueueSyncOp({
        id: `id-${i}`,
        type: 'page_update',
        entityId: `entity-${i}`,
        payload: i,
        createdAt: base + i,
      })
    }
    expect(peekSyncQueue()).toHaveLength(MAX_OPS)
    expect(peekSyncQueue()[0].entityId).toBe('entity-10')
  })
})
