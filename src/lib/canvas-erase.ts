import { strokeIntersectsCircle } from './stroke-bounds'
import { pointNearStroke } from './stroke-render'
import { useEditorStore } from '../stores/editorStore'
import type { Page, Point } from '../types'

/** Efface traits/formes/rubans sous le curseur gomme. */
export function eraseAt(page: Page, pt: Point): Page {
  const store = useEditorStore.getState()
  const mode = store.eraserMode
  const r = store.eraserSize

  let strokes = page.strokes
  if (mode === 'all' || mode === 'pen' || mode === 'highlighter') {
    strokes = strokes.filter((s) => {
      if (mode === 'pen' && s.tool !== 'pen' && s.tool !== 'pencil') return true
      if (mode === 'highlighter' && s.tool !== 'highlighter') return true
      if (!strokeIntersectsCircle(s, pt.x, pt.y, r)) return true
      return !pointNearStroke(s, pt.x, pt.y, r)
    })
  }

  let shapes = page.shapes
  if (mode === 'all' || mode === 'shapes') {
    shapes = shapes.filter((s) => {
      const near =
        Math.hypot(s.x1 - pt.x, s.y1 - pt.y) < r || Math.hypot(s.x2 - pt.x, s.y2 - pt.y) < r
      return !near
    })
  }

  let tapes = page.tapes
  if (mode === 'all' || mode === 'tape') {
    tapes = tapes.filter((t) => {
      const inTape =
        pt.x >= t.x && pt.x <= t.x + t.width && pt.y >= t.y && pt.y <= t.y + t.height
      return !inTape
    })
  }

  return { ...page, strokes, shapes, tapes }
}
