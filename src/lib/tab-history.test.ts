import { describe, it, expect } from 'vitest'
import { TabHistory } from './tab-history'

describe('TabHistory', () => {
  const makeTable = (v: string) => ({
    rows: 1,
    cols: 1,
    cells: { A1: { value: v } },
    colWidths: {},
    rowHeights: {},
  })

  it('undo returns previous state', () => {
    const h = new TabHistory()
    const t0 = makeTable('a')
    const t1 = makeTable('b')
    h.snapshot(t0)
    const result = h.undo(t1)
    expect(result?.cells.A1.value).toBe('a')
  })

  it('redo after undo', () => {
    const h = new TabHistory()
    const t0 = makeTable('a')
    const t1 = makeTable('b')
    h.snapshot(t0)
    h.undo(t1)
    const result = h.redo(t0)
    expect(result?.cells.A1.value).toBe('b')
  })

  it('snapshot clears redo', () => {
    const h = new TabHistory()
    h.snapshot(makeTable('a'))
    h.undo(makeTable('b'))
    h.snapshot(makeTable('c'))
    expect(h.canRedo).toBe(false)
  })

  it('respects MAX_HISTORY', () => {
    const h = new TabHistory()
    for (let i = 0; i < 60; i++) h.snapshot(makeTable(String(i)))
    // undoStack doit être plafonné à 50
    let count = 0
    const t = makeTable('x')
    while (h.canUndo) { h.undo(t); count++ }
    expect(count).toBeLessThanOrEqual(50)
  })

  it('returns null when stack is empty', () => {
    const h = new TabHistory()
    expect(h.undo(makeTable('a'))).toBeNull()
    expect(h.redo(makeTable('a'))).toBeNull()
  })

  it('clear resets both stacks', () => {
    const h = new TabHistory()
    h.snapshot(makeTable('a'))
    h.clear()
    expect(h.canUndo).toBe(false)
    expect(h.canRedo).toBe(false)
  })
})
