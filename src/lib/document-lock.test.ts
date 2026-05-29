import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  documentLockStorageKey,
  getDocumentLockTabId,
  isDocumentLockedByOther,
  releaseDocumentLock,
  tryAcquireDocumentLock,
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
})
