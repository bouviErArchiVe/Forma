import { pointInCircle, type CircleRegion } from './circle-lasso'
import type { Page } from '../types'

/** Supprime traits et formes dont des points tombent dans le cercle (geste gomme circulaire). */
export function eraseStrokesInCircle(page: Page, circle: CircleRegion): Page {
  const strokes = page.strokes.filter(
    (s) => !s.points.some((p) => pointInCircle(p.x, p.y, circle)),
  )
  const shapes = page.shapes.filter((s) => {
    const pts = [
      { x: s.x1, y: s.y1 },
      { x: s.x2, y: s.y2 },
      { x: (s.x1 + s.x2) / 2, y: (s.y1 + s.y2) / 2 },
    ]
    return !pts.some((p) => pointInCircle(p.x, p.y, circle))
  })
  return { ...page, strokes, shapes }
}
