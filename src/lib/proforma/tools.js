/** PROFORMA — définitions outils et réglages pinceau */

export const PF_TOOL_GROUPS = [
  { id: 'nav', label: 'Navigation' },
  { id: 'pencil', label: 'Crayons' },
  { id: 'brush', label: 'Pinceaux' },
  { id: 'pen', label: 'Stylos' },
  { id: 'other', label: 'Autres' },
  { id: 'shape', label: 'Formes' },
  { id: 'eraser', label: 'Gommes' },
  { id: 'select', label: 'Sélection' },
]

const base = {
  size: 3,
  opacity: 1,
  hardness: 0.8,
  smoothing: 0.35,
  spacing: 0.15,
  flow: 1,
  pressure: true,
}

export const PF_TOOLS = {
  hand: { id: 'hand', group: 'nav', label: 'Déplacer', icon: '✋', cursor: 'grab' },
  zoom: { id: 'zoom', group: 'nav', label: 'Zoom', icon: '🔍', cursor: 'zoom-in' },

  pencil_hb: { id: 'pencil_hb', group: 'pencil', label: 'HB', icon: '✏', ...base, size: 2.5, hardness: 0.65, smoothing: 0.4 },
  pencil_technical: { id: 'pencil_technical', group: 'pencil', label: 'Technique', icon: '✎', ...base, size: 1.8, hardness: 0.95, smoothing: 0.15 },
  pencil_arch: { id: 'pencil_arch', group: 'pencil', label: 'Architectural', icon: '📐', ...base, size: 2, hardness: 0.85, smoothing: 0.25 },
  pencil_fine: { id: 'pencil_fine', group: 'pencil', label: 'Fin', icon: '·', ...base, size: 1, hardness: 1, smoothing: 0.1 },
  pencil_pixel: { id: 'pencil_pixel', group: 'pencil', label: 'Pixel', icon: '▦', ...base, size: 1, hardness: 1, smoothing: 0, spacing: 1 },

  brush_simple: { id: 'brush_simple', group: 'brush', label: 'Simple', icon: '🖌', ...base, size: 8, hardness: 0.5, smoothing: 0.5 },
  brush_dry: { id: 'brush_dry', group: 'brush', label: 'Sec', icon: '🖍', ...base, size: 10, hardness: 0.35, opacity: 0.75, spacing: 0.35 },
  brush_soft: { id: 'brush_soft', group: 'brush', label: 'Doux', icon: '☁', ...base, size: 14, hardness: 0.15, smoothing: 0.6 },
  brush_calligraphy: { id: 'brush_calligraphy', group: 'brush', label: 'Calligraphie', icon: '✒', ...base, size: 6, hardness: 0.7, spacing: 0.08 },
  brush_texture: { id: 'brush_texture', group: 'brush', label: 'Texture', icon: '≋', ...base, size: 12, hardness: 0.4, spacing: 0.45, opacity: 0.85 },

  pen_technical: { id: 'pen_technical', group: 'pen', label: 'Stylo tech.', icon: '🖊', ...base, size: 1.5, hardness: 1, smoothing: 0.05 },
  pen_ink: { id: 'pen_ink', group: 'pen', label: 'Encre', icon: '🖋', ...base, size: 2.5, hardness: 0.9, smoothing: 0.2 },
  pen_precision: { id: 'pen_precision', group: 'pen', label: 'Précision', icon: '⎯', ...base, size: 0.8, hardness: 1, smoothing: 0 },

  highlighter: { id: 'highlighter', group: 'other', label: 'Surligneur', icon: '🖍', ...base, size: 16, opacity: 0.35, hardness: 0.2, smoothing: 0.5 },
  airbrush: { id: 'airbrush', group: 'other', label: 'Aérographe', icon: '💨', ...base, size: 20, opacity: 0.25, hardness: 0.05, spacing: 0.05 },
  fill: { id: 'fill', group: 'other', label: 'Remplissage', icon: '🪣', cursor: 'cell' },
  eyedropper: { id: 'eyedropper', group: 'other', label: 'Pipette', icon: '💧', cursor: 'crosshair' },
  text: { id: 'text', group: 'other', label: 'Texte', icon: 'T', cursor: 'text' },

  line: { id: 'line', group: 'shape', label: 'Ligne', icon: '╱', shapeType: 'line' },
  polyline: { id: 'polyline', group: 'shape', label: 'Polyligne', icon: '⌇', shapeType: 'polyline' },
  rect: { id: 'rect', group: 'shape', label: 'Rectangle', icon: '▭', shapeType: 'rect' },
  circle: { id: 'circle', group: 'shape', label: 'Cercle', icon: '○', shapeType: 'circle' },
  arc: { id: 'arc', group: 'shape', label: 'Arc', icon: '◠', shapeType: 'arc' },
  polygon: { id: 'polygon', group: 'shape', label: 'Polygone', icon: '⬡', shapeType: 'polygon' },
  arrow: { id: 'arrow', group: 'shape', label: 'Flèche', icon: '→', shapeType: 'arrow' },
  dimension: { id: 'dimension', group: 'shape', label: 'Cotation', icon: '↔', shapeType: 'dimension' },

  eraser_precision: { id: 'eraser_precision', group: 'eraser', label: 'Précision', icon: '◯', eraserMode: 'precision', size: 12, hardness: 0.9, cursor: 'none' },
  eraser_auto: { id: 'eraser_auto', group: 'eraser', label: 'Auto', icon: '⌫', eraserMode: 'auto', size: 18, hardness: 0.6 },
  eraser_zone: { id: 'eraser_zone', group: 'eraser', label: 'Zone', icon: '▢', eraserMode: 'zone', size: 24 },

  select_rect: { id: 'select_rect', group: 'select', label: 'Rectangle', icon: '⬚', selectMode: 'rect' },
  select_free: { id: 'select_free', group: 'select', label: 'Libre', icon: '✂', selectMode: 'free' },
  select_poly: { id: 'select_poly', group: 'select', label: 'Polygone', icon: '⬠', selectMode: 'poly' },
}

export const PF_DEFAULT_TOOL = 'pencil_arch'
export const PF_DEFAULT_COLOR = '#1a1a1a'

export function getToolDef(toolId) {
  return PF_TOOLS[toolId] || PF_TOOLS[PF_DEFAULT_TOOL]
}

export function isDrawTool(toolId) {
  const t = getToolDef(toolId)
  if (!t) return false
  if (t.group === 'nav' || t.group === 'select' || t.group === 'eraser') return false
  if (t.group === 'shape') return true
  return ['pencil', 'brush', 'pen', 'other'].includes(t.group) && toolId !== 'fill' && toolId !== 'eyedropper' && toolId !== 'text'
}

export function isEraserTool(toolId) {
  return getToolDef(toolId)?.group === 'eraser'
}

export function isShapeTool(toolId) {
  return getToolDef(toolId)?.group === 'shape'
}

export function isSelectTool(toolId) {
  return getToolDef(toolId)?.group === 'select'
}

export function toolBrushSettings(toolId, overrides = {}) {
  const t = getToolDef(toolId)
  return {
    size: overrides.size ?? t.size ?? 3,
    opacity: overrides.opacity ?? t.opacity ?? 1,
    hardness: overrides.hardness ?? t.hardness ?? 0.8,
    smoothing: overrides.smoothing ?? t.smoothing ?? 0.3,
    spacing: overrides.spacing ?? t.spacing ?? 0.15,
    flow: overrides.flow ?? t.flow ?? 1,
    pressure: overrides.pressure ?? t.pressure ?? true,
  }
}

export const PF_PALETTE = [
  '#1a1a1a', '#ffffff', '#c8622a', '#3d6b8c', '#4a7c59',
  '#e94560', '#f5a623', '#2196f3', '#7c5c3d', '#6b3d8c',
  '#888888', '#cccccc', '#ff6b6b', '#51cf66', '#ffd43b',
]
