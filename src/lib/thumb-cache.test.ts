import { describe, expect, it } from 'vitest'
import {
  clearMemThumbCache,
  getCachedThumb,
  getMemThumbCacheSize,
  setCachedThumb,
} from './thumb-cache'

describe('thumb-cache LRU memory bound', () => {
  it('caps the in-memory cache for documents with hundreds/thousands of pages', async () => {
    clearMemThumbCache()
    // Simulate a 1000-page notebook generating thumbnails progressively.
    for (let i = 0; i < 250; i++) {
      await setCachedThumb(`page-${i}`, 'nb-1', `data:image/jpeg;base64,${i}`)
    }
    expect(getMemThumbCacheSize()).toBeLessThanOrEqual(200)

    // Oldest entries evicted from memory, but still retrievable from IndexedDB.
    const oldest = await getCachedThumb('page-0')
    expect(oldest).toBe('data:image/jpeg;base64,0')

    // Recent entries remain in memory.
    const recent = await getCachedThumb('page-249')
    expect(recent).toBe('data:image/jpeg;base64,249')
  })
})
