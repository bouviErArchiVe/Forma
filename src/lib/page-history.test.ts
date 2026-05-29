import { describe, expect, it } from 'vitest'
import { makeTestPage } from './forma-test-fixtures'
import { PageHistory, clonePageState } from './page-history'

describe('PageHistory', () => {
  it('undo restores prior state', () => {
    const h = new PageHistory()
    const nbId = 'nb-1'
    const a = makeTestPage(nbId, { id: 'p1' })
    const b = makeTestPage(nbId, { id: 'p1', template: 'grid' })
    h.push(a)
    const prev = h.undoState(b)
    expect(prev?.template).toBe('lined')
  })

  it('batch merges gesture into one undo step', () => {
    const h = new PageHistory()
    const nbId = 'nb-1'
    const start = makeTestPage(nbId, { id: 'p1' })
    const mid = makeTestPage(nbId, { id: 'p1', template: 'grid' })
    const end = makeTestPage(nbId, { id: 'p1', template: 'dotted' })

    h.beginBatch(start)
    h.push(mid)
    h.endBatch()

    expect(h.canUndo()).toBe(true)
    const restored = h.undoState(end)
    expect(restored?.template).toBe('lined')
    expect(h.canUndo()).toBe(false)
  })

  it('cancelBatch drops pending snapshot', () => {
    const h = new PageHistory()
    const page = makeTestPage('nb', { id: 'p1' })
    h.beginBatch(page)
    h.cancelBatch()
    h.endBatch()
    expect(h.canUndo()).toBe(false)
  })

  it('push is ignored while batching', () => {
    const h = new PageHistory()
    const start = makeTestPage('nb', { id: 'p1' })
    const mid = makeTestPage('nb', { id: 'p1', template: 'grid' })
    h.beginBatch(start)
    h.push(mid)
    h.endBatch()
    const end = makeTestPage('nb', { id: 'p1', template: 'dotted' })
    const restored = h.undoState(end)
    expect(restored?.template).toBe('lined')
  })

  it('redo restores undone state', () => {
    const h = new PageHistory()
    const a = makeTestPage('nb', { id: 'p1' })
    const b = makeTestPage('nb', { id: 'p1', template: 'grid' })
    h.push(a)
    const undone = h.undoState(b)
    expect(undone?.template).toBe('lined')
    const redone = h.redoState(undone!)
    expect(redone?.template).toBe('grid')
  })

  it('nested batches commit once', () => {
    const h = new PageHistory()
    const start = makeTestPage('nb', { id: 'p1' })
    h.beginBatch(start)
    h.beginBatch(start)
    h.endBatch()
    h.endBatch()
    expect(h.canUndo()).toBe(true)
    const end = makeTestPage('nb', { id: 'p1', template: 'grid' })
    expect(h.undoState(end)?.template).toBe('lined')
  })

  it('reset clears stacks and batch', () => {
    const h = new PageHistory()
    const page = makeTestPage('nb', { id: 'p1' })
    h.push(page)
    h.beginBatch(page)
    h.reset()
    expect(h.canUndo()).toBe(false)
    expect(h.canRedo()).toBe(false)
    expect(h.isBatching()).toBe(false)
  })

  it('clonePageState deep copies strokes', () => {
    const page = makeTestPage('nb', { id: 'p1' })
    const copy = clonePageState(page)
    copy.strokes[0].color = '#fff'
    expect(page.strokes[0].color).toBe('#111')
  })

  it('transform gesture pattern: one undo for batched move', () => {
    const h = new PageHistory()
    const start = makeTestPage('nb', {
      id: 'p1',
      strokes: [
        {
          id: 's0',
          tool: 'pen',
          color: '#111',
          width: 2,
          opacity: 1,
          pageId: 'p1',
          points: [{ x: 0, y: 0, pressure: 0.5, timestamp: 0 }],
        },
      ],
    })
    const moved = makeTestPage('nb', {
      id: 'p1',
      strokes: [
        {
          id: 's0',
          tool: 'pen',
          color: '#111',
          width: 2,
          opacity: 1,
          pageId: 'p1',
          points: [{ x: 10, y: 10, pressure: 0.5, timestamp: 0 }],
        },
      ],
    })

    h.beginBatch(start)
    h.endBatch()
    const restored = h.undoState(moved)
    expect(restored?.strokes[0].points[0]).toMatchObject({ x: 0, y: 0 })
    expect(h.canUndo()).toBe(false)
  })

  it('transform gesture pattern: resize batch ignores intermediate pushes', () => {
    const h = new PageHistory()
    const start = makeTestPage('nb', { id: 'p1' })
    const mid = makeTestPage('nb', { id: 'p1', template: 'grid' })
    const end = makeTestPage('nb', { id: 'p1', template: 'dotted' })

    h.beginBatch(start)
    h.push(mid)
    h.push(mid)
    h.endBatch()

    expect(h.canUndo()).toBe(true)
    expect(h.undoState(end)?.template).toBe('lined')
    expect(h.canUndo()).toBe(false)
    expect(h.canRedo()).toBe(true)
  })
})
