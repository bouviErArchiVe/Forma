export const SNAP_THRESHOLD = 8
export const GRID_FINE = 18.9   // ~5 mm @ 3.78 px/mm
export const GRID_COARSE = 37.8  // ~10 mm

export function strokeBounds(s) {
  if (!s?.pts?.length) return null
  const xs = s.pts.map(p => p.x)
  const ys = s.pts.map(p => p.y)
  const x1 = Math.min(...xs)
  const x2 = Math.max(...xs)
  const y1 = Math.min(...ys)
  const y2 = Math.max(...ys)
  return { x1, y1, x2, y2, cx: (x1 + x2) / 2, cy: (y1 + y2) / 2 }
}

export function collectSnapLines(strokes, excludeIndices = new Set()) {
  const xs = new Set()
  const ys = new Set()
  strokes.forEach((s, i) => {
    if (excludeIndices.has(i)) return
    const b = strokeBounds(s)
    if (!b) return
    xs.add(b.x1)
    xs.add(b.x2)
    xs.add(b.cx)
    ys.add(b.y1)
    ys.add(b.y2)
    ys.add(b.cy)
  })
  return { xLines: [...xs], yLines: [...ys] }
}

function nearestSnap(value, lines, threshold) {
  let best = null
  for (const line of lines) {
    const d = Math.abs(value - line)
    if (d <= threshold && (!best || d < best.dist)) best = { dist: d, line }
  }
  return best
}

function gridLinesFor(values) {
  const out = []
  values.forEach(v => {
    out.push(Math.round(v / GRID_FINE) * GRID_FINE)
    out.push(Math.round(v / GRID_COARSE) * GRID_COARSE)
  })
  return out
}

/** Snap déplacement groupé (bbox sélection) */
export function snapDelta(rawDx, rawDy, origBounds, xLines, yLines, opts = {}) {
  const threshold = opts.threshold ?? SNAP_THRESHOLD
  const useGrid = opts.grid !== false
  if (!origBounds) return { dx: rawDx, dy: rawDy, guides: [] }

  const moved = {
    x1: origBounds.x1 + rawDx,
    x2: origBounds.x2 + rawDx,
    y1: origBounds.y1 + rawDy,
    y2: origBounds.y2 + rawDy,
  }
  moved.cx = (moved.x1 + moved.x2) / 2
  moved.cy = (moved.y1 + moved.y2) / 2

  const xProbes = [
    { key: 'x1', val: moved.x1 },
    { key: 'x2', val: moved.x2 },
    { key: 'cx', val: moved.cx },
  ]
  const yProbes = [
    { key: 'y1', val: moved.y1 },
    { key: 'y2', val: moved.y2 },
    { key: 'cy', val: moved.cy },
  ]

  const allX = [...xLines]
  const allY = [...yLines]
  if (useGrid) {
    allX.push(...gridLinesFor(xProbes.map(p => p.val)))
    allY.push(...gridLinesFor(yProbes.map(p => p.val)))
  }

  let dx = rawDx
  let dy = rawDy
  const guides = []

  let bestX = null
  for (const probe of xProbes) {
    const hit = nearestSnap(probe.val, allX, threshold)
    if (hit && (!bestX || hit.dist < bestX.dist)) {
      bestX = { ...hit, offset: hit.line - probe.val }
    }
  }
  if (bestX) {
    dx += bestX.offset
    guides.push({ type: 'v', pos: bestX.line })
  }

  let bestY = null
  for (const probe of yProbes) {
    const hit = nearestSnap(probe.val, allY, threshold)
    if (hit && (!bestY || hit.dist < bestY.dist)) {
      bestY = { ...hit, offset: hit.line - probe.val }
    }
  }
  if (bestY) {
    dy += bestY.offset
    guides.push({ type: 'h', pos: bestY.line })
  }

  return { dx, dy, guides }
}

/** Snap un point (formes, extrémités) */
export function snapPoint(p, strokes, excludeIndices = new Set(), opts = {}) {
  const threshold = opts.threshold ?? SNAP_THRESHOLD
  const useGrid = opts.grid !== false
  const { xLines, yLines } = collectSnapLines(strokes, excludeIndices)

  const allX = [...xLines]
  const allY = [...yLines]
  if (useGrid) {
    allX.push(...gridLinesFor([p.x]))
    allY.push(...gridLinesFor([p.y]))
  }

  let x = p.x
  let y = p.y
  const guides = []

  const hitX = nearestSnap(p.x, allX, threshold)
  if (hitX) {
    x = hitX.line
    guides.push({ type: 'v', pos: hitX.line })
  }
  const hitY = nearestSnap(p.y, allY, threshold)
  if (hitY) {
    y = hitY.line
    guides.push({ type: 'h', pos: hitY.line })
  }

  return { x, y, guides }
}

export function drawSnapGuides(ctx, guides, W = 794, H = 1123) {
  if (!guides?.length) return
  ctx.save()
  ctx.strokeStyle = '#e94560'
  ctx.lineWidth = 1
  ctx.globalAlpha = 0.85
  ctx.setLineDash([5, 5])
  ctx.globalCompositeOperation = 'source-over'
  guides.forEach(g => {
    ctx.beginPath()
    if (g.type === 'v') {
      ctx.moveTo(g.pos, 0)
      ctx.lineTo(g.pos, H)
    } else {
      ctx.moveTo(0, g.pos)
      ctx.lineTo(W, g.pos)
    }
    ctx.stroke()
  })
  ctx.restore()
}
