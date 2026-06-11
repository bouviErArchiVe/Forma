/**
 * Tests for FMoodboard v2 (PACK 5).
 * Covers: item factories, board mutations, layer order,
 *         groups, serialization, snap.
 */
import { describe, expect, it } from 'vitest'
import {
  addItem,
  bringForward,
  bringToFront,
  createDefaultBoard,
  createImageItem,
  createShapeItem,
  createTextItem,
  deserializeBoard,
  expandGroupSelection,
  groupItems,
  MB_DEFAULT_CANVAS_HEIGHT,
  MB_DEFAULT_CANVAS_WIDTH,
  nextZIndex,
  removeItems,
  sendBackward,
  sendToBack,
  serializeBoard,
  snapToGrid,
  ungroupItems,
  updateItem,
  updateItems,
  type MoodBoard,
} from './fmoodboard'

// ─── Factories ────────────────────────────────────────────────────────────────

describe('createDefaultBoard', () => {
  it('creates empty board with default dimensions', () => {
    const b = createDefaultBoard()
    expect(b.items).toEqual([])
    expect(b.groups).toEqual([])
    expect(b.canvasWidth).toBe(MB_DEFAULT_CANVAS_WIDTH)
    expect(b.canvasHeight).toBe(MB_DEFAULT_CANVAS_HEIGHT)
  })
})

describe('createImageItem', () => {
  it('creates item with correct kind and position', () => {
    const item = createImageItem('data:image/png;base64,abc', 10, 20, 300, 200, 1)
    expect(item.kind).toBe('image')
    expect(item.x).toBe(10)
    expect(item.y).toBe(20)
    expect(item.width).toBe(300)
    expect(item.height).toBe(200)
    expect(item.zIndex).toBe(1)
    expect(item.dataUrl).toBe('data:image/png;base64,abc')
    expect(item.id).toBeTruthy()
  })
})

describe('createTextItem', () => {
  it('creates text item with default text', () => {
    const item = createTextItem(50, 60, 2)
    expect(item.kind).toBe('text')
    expect(item.x).toBe(50)
    expect(item.y).toBe(60)
    expect(item.zIndex).toBe(2)
    expect(item.text).toBeTruthy()
    expect(item.fontSize).toBeGreaterThan(0)
  })
})

describe('createShapeItem', () => {
  it('creates rect shape', () => {
    const item = createShapeItem('rect', 0, 0, 1)
    expect(item.kind).toBe('shape')
    expect(item.shapeKind).toBe('rect')
  })
  it('creates ellipse shape', () => {
    const item = createShapeItem('ellipse', 0, 0, 1)
    expect(item.shapeKind).toBe('ellipse')
  })
})

// ─── nextZIndex ───────────────────────────────────────────────────────────────

describe('nextZIndex', () => {
  it('returns 1 for empty board', () => {
    expect(nextZIndex(createDefaultBoard())).toBe(1)
  })

  it('returns max + 1', () => {
    const b = createDefaultBoard()
    const b2 = addItem(b, createImageItem('', 0, 0, 10, 10, 5))
    expect(nextZIndex(b2)).toBe(6)
  })
})

// ─── Board mutations ──────────────────────────────────────────────────────────

describe('addItem / removeItems', () => {
  it('adds item to board', () => {
    const b = createDefaultBoard()
    const item = createTextItem(0, 0, 1)
    const b2 = addItem(b, item)
    expect(b2.items).toHaveLength(1)
    expect(b2.items[0].id).toBe(item.id)
  })

  it('removes items by ids', () => {
    const b = createDefaultBoard()
    const a = createTextItem(0, 0, 1)
    const c = createShapeItem('rect', 10, 10, 2)
    const b2 = addItem(addItem(b, a), c)
    const b3 = removeItems(b2, new Set([a.id]))
    expect(b3.items).toHaveLength(1)
    expect(b3.items[0].id).toBe(c.id)
  })
})

describe('updateItem / updateItems', () => {
  it('patches a single item', () => {
    const b = createDefaultBoard()
    const item = createTextItem(10, 20, 1)
    const b2 = addItem(b, item)
    const b3 = updateItem(b2, item.id, { x: 99, text: 'hello' })
    expect(b3.items[0].x).toBe(99)
    expect(b3.items[0].text).toBe('hello')
    expect(b3.items[0].y).toBe(20) // unchanged
  })

  it('patches multiple items', () => {
    const b = createDefaultBoard()
    const a = createTextItem(0, 0, 1)
    const c = createShapeItem('rect', 10, 10, 2)
    const b2 = addItem(addItem(b, a), c)
    const b3 = updateItems(b2, new Set([a.id, c.id]), { opacity: 0.5 })
    expect(b3.items.every((it) => it.opacity === 0.5)).toBe(true)
  })
})

// ─── Layer order ──────────────────────────────────────────────────────────────

describe('bringToFront / sendToBack', () => {
  function makeBoard(): MoodBoard {
    let b = createDefaultBoard()
    b = addItem(b, createTextItem(0, 0, 1))   // z=1 (bottom)
    b = addItem(b, createShapeItem('rect', 0, 0, 2)) // z=2
    b = addItem(b, createImageItem('', 0, 0, 10, 10, 3)) // z=3 (top)
    return b
  }

  it('bringToFront puts item above all others', () => {
    const b = makeBoard()
    const bottom = b.items[0]
    const b2 = bringToFront(b, bottom.id)
    const moved = b2.items.find((it) => it.id === bottom.id)!
    expect(moved.zIndex).toBeGreaterThan(3)
  })

  it('sendToBack puts item below all others', () => {
    const b = makeBoard()
    const top = b.items[2]
    const b2 = sendToBack(b, top.id)
    const moved = b2.items.find((it) => it.id === top.id)!
    expect(moved.zIndex).toBeLessThan(1)
  })
})

describe('bringForward / sendBackward', () => {
  it('bringForward swaps with next item above', () => {
    let b = createDefaultBoard()
    const a = createTextItem(0, 0, 1)
    const c = createShapeItem('rect', 0, 0, 2)
    b = addItem(addItem(b, a), c)

    const b2 = bringForward(b, a.id)
    const aAfter = b2.items.find((it) => it.id === a.id)!
    const cAfter = b2.items.find((it) => it.id === c.id)!
    expect(aAfter.zIndex).toBe(2)
    expect(cAfter.zIndex).toBe(1)
  })

  it('sendBackward swaps with item below', () => {
    let b = createDefaultBoard()
    const a = createTextItem(0, 0, 1)
    const c = createShapeItem('rect', 0, 0, 2)
    b = addItem(addItem(b, a), c)

    const b2 = sendBackward(b, c.id)
    const aAfter = b2.items.find((it) => it.id === a.id)!
    const cAfter = b2.items.find((it) => it.id === c.id)!
    expect(cAfter.zIndex).toBe(1)
    expect(aAfter.zIndex).toBe(2)
  })

  it('bringForward is no-op for topmost item', () => {
    let b = createDefaultBoard()
    const top = createTextItem(0, 0, 5)
    b = addItem(b, top)
    const b2 = bringForward(b, top.id)
    expect(b2.items[0].zIndex).toBe(5)
  })
})

// ─── Groups ───────────────────────────────────────────────────────────────────

describe('groupItems / ungroupItems', () => {
  it('groups two items', () => {
    let b = createDefaultBoard()
    const a = createTextItem(0, 0, 1)
    const c = createShapeItem('rect', 0, 0, 2)
    b = addItem(addItem(b, a), c)

    const b2 = groupItems(b, new Set([a.id, c.id]))
    expect(b2.groups).toHaveLength(1)
    const gid = b2.groups[0].id
    expect(b2.items.find((it) => it.id === a.id)?.groupId).toBe(gid)
    expect(b2.items.find((it) => it.id === c.id)?.groupId).toBe(gid)
  })

  it('ungroups items', () => {
    let b = createDefaultBoard()
    const a = createTextItem(0, 0, 1)
    const c = createShapeItem('rect', 0, 0, 2)
    b = addItem(addItem(b, a), c)
    b = groupItems(b, new Set([a.id, c.id]))

    const b2 = ungroupItems(b, new Set([a.id, c.id]))
    expect(b2.groups).toHaveLength(0)
    expect(b2.items.every((it) => !it.groupId)).toBe(true)
  })

  it('does not group single item', () => {
    let b = createDefaultBoard()
    const a = createTextItem(0, 0, 1)
    b = addItem(b, a)
    const b2 = groupItems(b, new Set([a.id]))
    expect(b2.groups).toHaveLength(0)
  })
})

describe('expandGroupSelection', () => {
  it('expands selection to full group', () => {
    let b = createDefaultBoard()
    const a = createTextItem(0, 0, 1)
    const c = createShapeItem('rect', 0, 0, 2)
    const d = createImageItem('', 0, 0, 10, 10, 3)
    b = addItem(addItem(addItem(b, a), c), d)
    b = groupItems(b, new Set([a.id, c.id]))

    // Select only 'a', should expand to 'a' + 'c'
    const expanded = expandGroupSelection(b, new Set([a.id]))
    expect(expanded.has(a.id)).toBe(true)
    expect(expanded.has(c.id)).toBe(true)
    expect(expanded.has(d.id)).toBe(false) // not in group
  })
})

// ─── Snap ────────────────────────────────────────────────────────────────────

describe('snapToGrid', () => {
  it('returns value unchanged when snap disabled', () => {
    expect(snapToGrid(37, false)).toBe(37)
  })

  it('snaps to nearest grid point when enabled', () => {
    expect(snapToGrid(37, true)).toBe(40)   // nearest 20
    expect(snapToGrid(8, true)).toBe(0)     // nearest 20
    expect(snapToGrid(50, true)).toBe(60)   // nearest 20 → actually 40 or 60?
    // 50 / 20 = 2.5 → round to 3 → 60
    expect(snapToGrid(50, true)).toBe(60)
  })
})

// ─── Serialization ────────────────────────────────────────────────────────────

describe('serializeBoard / deserializeBoard', () => {
  it('round-trips a board', () => {
    let b = createDefaultBoard()
    b = addItem(b, createTextItem(10, 20, 1))
    b = addItem(b, createImageItem('data:image/png;base64,test', 50, 60, 100, 80, 2))

    const json = serializeBoard(b)
    const b2 = deserializeBoard(json)
    expect(b2.items).toHaveLength(2)
    expect(b2.items[0].x).toBe(10)
    expect(b2.items[1].dataUrl).toBe('data:image/png;base64,test')
  })

  it('returns default board for undefined', () => {
    const b = deserializeBoard(undefined)
    expect(b.items).toEqual([])
  })

  it('returns default board for invalid JSON', () => {
    const b = deserializeBoard('not valid json{{{')
    expect(b.items).toEqual([])
  })

  it('handles empty items array', () => {
    const json = JSON.stringify({ items: [], groups: [], canvasWidth: 800, canvasHeight: 600, background: '#fff' })
    const b = deserializeBoard(json)
    expect(b.canvasWidth).toBe(800)
    expect(b.canvasHeight).toBe(600)
  })
})
