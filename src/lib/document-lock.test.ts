import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  documentLockStorageKey,
  getDocumentLockRemainingMs,
  getDocumentLockTabId,
  isDocumentLockedByOther,
  pruneStaleDocumentLocks,
  releaseDocumentLock,
  tryAcquireDocumentLock,
  tryReacquireDocumentLock,
} from './document-lock'

describe('document-lock', () => {
  const nbId = 'nb-lock-test'
  let tabA: string
  let tabB: string

  beforeEach(() => {
    localStorage.clear()
    tabA = getDocumentLockTabId()
    tabB = getDocumentLockTabId()
  })

  it('grants lock to first tab and blocks second', () => {
    expect(tryAcquireDocumentLock(nbId, tabA)).toBe(true)
    expect(isDocumentLockedByOther(nbId, tabA)).toBe(false)
    expect(tryAcquireDocumentLock(nbId, tabB)).toBe(false)
    expect(isDocumentLockedByOther(nbId, tabB)).toBe(true)
  })

  it('releases lock on cleanup', () => {
    expect(tryAcquireDocumentLock(nbId, tabA)).toBe(true)
    releaseDocumentLock(nbId, tabA)
    expect(localStorage.getItem(documentLockStorageKey(nbId))).toBeNull()
    expect(tryAcquireDocumentLock(nbId, tabB)).toBe(true)
  })

  it('notifies subscribers via storage event', () => {
    const fn = vi.fn()
    const handler = (e: StorageEvent) => {
      if (e.key === documentLockStorageKey(nbId)) fn()
    }
    window.addEventListener('storage', handler)
    tryAcquireDocumentLock(nbId, tabA)
    localStorage.setItem(
      documentLockStorageKey(nbId),
      JSON.stringify({ tabId: tabB, at: Date.now() }),
    )
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: documentLockStorageKey(nbId),
        newValue: localStorage.getItem(documentLockStorageKey(nbId)),
      }),
    )
    expect(fn).toHaveBeenCalled()
    window.removeEventListener('storage', handler)
  })

  it('pruneStaleDocumentLocks removes expired locks', () => {
    localStorage.setItem(
      documentLockStorageKey(nbId),
      JSON.stringify({ tabId: tabA, at: Date.now() - 60_000 }),
    )
    expect(pruneStaleDocumentLocks(45_000)).toBe(1)
    expect(localStorage.getItem(documentLockStorageKey(nbId))).toBeNull()
  })

  it('tryReacquireDocumentLock succeeds when lock expired', () => {
    localStorage.setItem(
      documentLockStorageKey(nbId),
      JSON.stringify({ tabId: tabA, at: Date.now() - 60_000 }),
    )
    expect(tryReacquireDocumentLock(nbId, tabB)).toBe(true)
    expect(isDocumentLockedByOther(nbId, tabB)).toBe(false)
  })

  it('getDocumentLockRemainingMs returns positive while lock active', () => {
    tryAcquireDocumentLock(nbId, tabA)
    const rem = getDocumentLockRemainingMs(nbId)
    expect(rem).toBeGreaterThan(0)
    expect(rem).toBeLessThanOrEqual(45_000)
  })
})
