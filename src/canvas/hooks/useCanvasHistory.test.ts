import { describe, expect, it } from 'vitest'
import { PageHistory } from '../../lib/page-history'
import type { Page } from '../../types'
import { emptyPageFields } from '../../types'

function page(): Page {
  return { id: 'p1', notebookId: 'nb', order: 0, template: 'blank', ...emptyPageFields() }
}

/** Contrat batch utilisé par useCanvasHistory / PageCanvas. */
describe('canvas history batch contract', () => {
  it('beginBatch endBatch records undo step', () => {
    const h = new PageHistory()
    const a = page()
    const b = { ...page(), strokes: [{ id: 's1', tool: 'pen' as const, color: '#000', width: 2, opacity: 1, pageId: 'p1', points: [] }] }
    h.push(a)
    h.beginBatch(b)
    h.endBatch()
    expect(h.canUndo()).toBe(true)
  })

  it('cancelBatch discards gesture', () => {
    const h = new PageHistory()
    h.beginBatch(page())
    h.cancelBatch()
    expect(h.isBatching()).toBe(false)
    expect(h.canUndo()).toBe(false)
  })
})
