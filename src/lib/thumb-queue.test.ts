import { describe, expect, it, vi } from 'vitest'
import { ThumbQueue } from './thumb-queue'

describe('ThumbQueue', () => {
  it('caches results', async () => {
    const q = new ThumbQueue(2)
    const run = vi.fn(async () => 'data:image/jpeg;base64,abc')
    const a = await q.enqueue('p1', 1, run)
    const b = await q.enqueue('p1', 1, run)
    expect(a).toBe(b)
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('respects priority order when enqueued together', async () => {
    const q = new ThumbQueue(1)
    const order: string[] = []
    const run =
      (id: string, ms: number) =>
      async () => {
        await new Promise((r) => setTimeout(r, ms))
        order.push(id)
        return id
      }
    const pLow = q.enqueue('low', 1, run('low', 40))
    const pHigh = q.enqueue('high', 100, run('high', 5))
    await Promise.all([pLow, pHigh])
    expect(order.indexOf('high')).toBeLessThan(order.indexOf('low'))
  })

  it('invalidate drops cache and allows refresh', async () => {
    const q = new ThumbQueue(2)
    let n = 0
    await q.enqueue('x', 1, async () => `v${++n}`)
    q.invalidate('x')
    const v = await q.enqueue('x', 1, async () => `v${++n}`)
    expect(v).toBe('v2')
  })

  it('coalesces concurrent requests for the same id', async () => {
    const q = new ThumbQueue(1)
    let n = 0
    const run = async () => {
      await new Promise((r) => setTimeout(r, 20))
      return `v${++n}`
    }
    const [a, b] = await Promise.all([q.enqueue('same', 1, run), q.enqueue('same', 1, run)])
    expect(a).toBe(b)
    expect(n).toBe(1)
  })

  it('bumps priority for queued duplicate id', async () => {
    const q = new ThumbQueue(1)
    const order: string[] = []
    const run = (id: string, ms: number) => async () => {
      await new Promise((r) => setTimeout(r, ms))
      order.push(id)
      return id
    }
    void q.enqueue('block', 50, run('block', 30))
    const lowWait = q.enqueue('low', 1, run('low', 5))
    void q.enqueue('low', 100, run('low', 5))
    const highWait = q.enqueue('high', 80, run('high', 5))
    await Promise.all([lowWait, highWait])
    expect(order.indexOf('low')).toBeLessThan(order.indexOf('high'))
  })

  it('invalidateMany clears multiple entries', async () => {
    const q = new ThumbQueue(2)
    await q.enqueue('a', 1, async () => 'a1')
    await q.enqueue('b', 1, async () => 'b1')
    q.invalidateMany(['a', 'b'])
    expect(q.peek('a')).toBeUndefined()
    expect(q.peek('b')).toBeUndefined()
  })

  it('peek returns undefined for stale ids', async () => {
    const q = new ThumbQueue(2)
    await q.enqueue('s', 1, async () => 'cached')
    q.invalidate('s')
    expect(q.peek('s')).toBeUndefined()
  })

  it('caps in-memory cache size for large documents (LRU eviction)', async () => {
    const q = new ThumbQueue(4)
    // Simulate a 1000-page document: enqueue + resolve far more than the cache cap.
    for (let i = 0; i < 250; i++) {
      await q.enqueue(`p${i}`, 1, async () => `data:image/jpeg;base64,${i}`)
    }
    expect(q.cacheSize).toBeLessThanOrEqual(200)
    // Oldest entries should have been evicted, most recent should remain.
    expect(q.peek('p0')).toBeUndefined()
    expect(q.peek('p249')).toBe('data:image/jpeg;base64,249')
  })
})
