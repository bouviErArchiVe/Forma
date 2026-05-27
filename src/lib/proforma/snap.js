/** PROFORMA — magnétisme grille */

export function snapPoint(x, y, { enabled = true, step = 18.9 } = {}) {
  if (!enabled || !step) return { x, y }
  return {
    x: Math.round(x / step) * step,
    y: Math.round(y / step) * step,
  }
}

export function gridStepForType(grid) {
  if (grid === 'grid10') return 37.8
  if (grid === 'grid5') return 18.9
  if (grid === 'arch') return 50
  if (grid === 'dotted') return 15
  return 18.9
}

export function snapDocPoint(x, y, doc) {
  if (!doc?.snapGrid) return { x, y }
  return snapPoint(x, y, { enabled: true, step: gridStepForType(doc.grid) })
}
