/** Journal d'actions canvas — libellés, icônes, miniatures */

export const ACTION_META = {
  stroke_pen: { icon: '✏', label: 'Trait crayon' },
  stroke_highlight: { icon: '▌', label: 'Surlignage' },
  stroke_shape: { icon: '◇', label: 'Forme' },
  stroke_text: { icon: 'T', label: 'Texte ajouté' },
  erase_draw: { icon: '◻', label: 'Gomme (trait)' },
  erase_strokes: { icon: '🧹', label: 'Traits effacés' },
  move_selection: { icon: '↔', label: 'Déplacement sélection' },
  delete_selection: { icon: '🗑', label: 'Suppression sélection' },
  duplicate_selection: { icon: '⧉', label: 'Duplication sélection' },
  selection_color: { icon: '🎨', label: 'Couleur sélection' },
  selection_size: { icon: '↕', label: 'Épaisseur sélection' },
  selection_opacity: { icon: '◐', label: 'Opacité sélection' },
  select_strokes: { icon: '⬡', label: 'Sélection lasso' },
  clear_canvas: { icon: '⚠', label: 'Canvas effacé' },
  undo: { icon: '↩', label: 'Annulation' },
  version_restore: { icon: '⏪', label: 'Version restaurée' },
  page_bg: { icon: '🎨', label: 'Fond de page' },
  page_grid: { icon: '⊞', label: 'Couleur grille' },
  image_import: { icon: '📎', label: 'Image importée' },
  element_placed: { icon: '🏗', label: 'Élément placé' },
  element_removed: { icon: '✕', label: 'Élément supprimé' },
}

const SHAPE_LABELS = {
  line: 'Ligne',
  rect: 'Rectangle',
  circle: 'Cercle',
  arrow: 'Flèche',
  cloud: 'Bulle',
  dimline: 'Cotation',
}

export function formatActionTime(ts) {
  const d = new Date(ts)
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function compactStroke(stroke) {
  if (!stroke) return null
  return {
    color: stroke.color,
    size: stroke.size,
    tool: stroke.tool,
    shapeType: stroke.shapeType,
    text: stroke.text?.slice?.(0, 40),
    pts: (stroke.pts || []).slice(0, 24).map((p) => ({ x: p.x, y: p.y })),
  }
}

export function buildActionEntry({ type, detail, stroke, count, color }) {
  const meta = ACTION_META[type] || { icon: '•', label: type }
  let label = meta.label
  if (type === 'stroke_shape' && detail) label = `${SHAPE_LABELS[detail] || detail}`
  if (type === 'stroke_text' && stroke?.text) label = `Texte : « ${stroke.text.slice(0, 24)}${stroke.text.length > 24 ? '…' : ''} »`
  if (count != null && count > 1) label = `${label} (×${count})`

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ts: Date.now(),
    type,
    icon: meta.icon,
    label,
    detail: detail || (stroke?.color ? stroke.color : color) || '',
    count: count || 1,
    preview: compactStroke(stroke),
  }
}

export function renderStrokeThumb(preview, w = 72, h = 52) {
  if (!preview?.pts?.length || typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fafafa'
  ctx.fillRect(0, 0, w, h)

  let x1 = Infinity
  let y1 = Infinity
  let x2 = -Infinity
  let y2 = -Infinity
  preview.pts.forEach((p) => {
    x1 = Math.min(x1, p.x)
    y1 = Math.min(y1, p.y)
    x2 = Math.max(x2, p.x)
    y2 = Math.max(y2, p.y)
  })
  const bw = Math.max(x2 - x1, 1)
  const bh = Math.max(y2 - y1, 1)
  const pad = 4
  const sc = Math.min((w - pad * 2) / bw, (h - pad * 2) / bh)

  ctx.strokeStyle = preview.color || '#333'
  ctx.lineWidth = Math.max(0.8, (preview.size || 2) * sc * 0.4)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.globalAlpha = preview.tool === 'highlight' ? 0.45 : 0.9

  const tx = (x) => pad + (x - x1) * sc
  const ty = (y) => pad + (y - y1) * sc

  if (preview.shapeType === 'rect') {
    ctx.strokeRect(tx(preview.pts[0].x), ty(preview.pts[0].y), bw * sc, bh * sc)
  } else if (preview.shapeType === 'circle') {
    ctx.beginPath()
    ctx.ellipse(tx((x1 + x2) / 2), ty((y1 + y2) / 2), (bw * sc) / 2, (bh * sc) / 2, 0, 0, Math.PI * 2)
    ctx.stroke()
  } else if (preview.shapeType === 'text') {
    ctx.globalAlpha = 1
    ctx.font = `${Math.max(8, (preview.size || 4) * sc)}px sans-serif`
    ctx.fillStyle = preview.color || '#333'
    ctx.fillText(preview.text || 'T', tx(preview.pts[0].x), ty(preview.pts[0].y))
  } else {
    ctx.beginPath()
    ctx.moveTo(tx(preview.pts[0].x), ty(preview.pts[0].y))
    for (let i = 1; i < preview.pts.length; i++) ctx.lineTo(tx(preview.pts[i].x), ty(preview.pts[i].y))
    ctx.stroke()
  }

  return canvas.toDataURL('image/png')
}
