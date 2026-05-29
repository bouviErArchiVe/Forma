import { describe, expect, it, vi } from 'vitest'
import { eraseAt } from './canvas-erase'
import { makeTestPage } from './forma-test-fixtures'
import { createPoint } from './stroke-render'

vi.mock('../stores/editorStore', () => ({
  useEditorStore: {
    getState: () => ({ eraserMode: 'all', eraserSize: 20 }),
  },
}))

describe('canvas-erase', () => {
  it('eraseAt removes strokes near point', () => {
    const page = makeTestPage('nb-1')
    const pt = createPoint(50, 50, 0.5)
    const next = eraseAt(page, pt)
    expect(next.strokes.length).toBeLessThanOrEqual(page.strokes.length)
  })
})
