/** Croquis intégrés dans Forma Docs. */

export function createSketchId() {
  return `sk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function createEmptySketch(w = 520, h = 280) {
  return { id: createSketchId(), width: w, height: h, strokes: [], preview: '' }
}

export function strokesToDataUrl(strokes, w, h) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)
  ;(strokes || []).forEach((s) => {
    if (!s.pts?.length) return
    ctx.strokeStyle = s.color || '#1c1c24'
    ctx.lineWidth = s.size || 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    s.pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
    ctx.stroke()
  })
  return canvas.toDataURL('image/png')
}

export function insertSketchEmbed(sketch) {
  const preview = sketch.preview || strokesToDataUrl(sketch.strokes, sketch.width, sketch.height)
  return `<div contenteditable="false" data-forma-embed="sketch" data-sketch-id="${sketch.id}" class="forma-sketch-embed" style="margin:12px 0;border:1px solid #ccd3dc;border-radius:8px;padding:6px;background:#fff"><img src="${preview}" alt="Croquis" style="max-width:100%;display:block;border-radius:4px" data-sketch-img="1"/></div><p></p>`
}

export function upsertDocSketch(doc, sketch) {
  const preview = strokesToDataUrl(sketch.strokes, sketch.width, sketch.height)
  const next = { ...sketch, preview }
  return {
    ...doc,
    sketches: { ...(doc.sketches || {}), [sketch.id]: next },
    updatedAt: Date.now(),
  }
}

export function getDocSketch(doc, sketchId) {
  return doc?.sketches?.[sketchId] || null
}
