import { describe, expect, it } from 'vitest'
import {
  classifyStorageError,
  isIndexedDbUnavailableError,
  isQuotaExceededError,
  storageErrorMessage,
} from './storage-errors'

describe('storage-errors', () => {
  it('detects QuotaExceededError by name', () => {
    const err = new DOMException('quota', 'QuotaExceededError')
    expect(isQuotaExceededError(err)).toBe(true)
    expect(classifyStorageError(err)).toBe('quota')
    expect(storageErrorMessage('quota')).toMatch(/saturé/)
  })

  it('detects nested Dexie-style inner error', () => {
    expect(
      isQuotaExceededError({
        name: 'BulkError',
        inner: { name: 'QuotaExceededError', message: 'Quota exceeded' },
      }),
    ).toBe(true)
  })

  it('detects IndexedDB unavailable (SecurityError)', () => {
    const err = new DOMException('insecure', 'SecurityError')
    expect(isIndexedDbUnavailableError(err)).toBe(true)
    expect(classifyStorageError(err)).toBe('unavailable')
    expect(storageErrorMessage('unavailable')).toMatch(/indisponible/)
  })

  it('detects backing store failure messages', () => {
    expect(
      isIndexedDbUnavailableError(
        new Error('Internal error opening backing store for indexedDB.open'),
      ),
    ).toBe(true)
  })

  it('classifies generic errors as unknown', () => {
    expect(classifyStorageError(new Error('network'))).toBe('unknown')
  })
})
