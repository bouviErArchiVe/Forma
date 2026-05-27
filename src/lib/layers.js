export const LAYER_COLORS = ["#c8622a", "#3d6b8c", "#4a7c59", "#a855f7", "#e94560", "#f5a623", "#2196f3", "#00bcd4"]

export const DEFAULT_LAYERS = [
  { id: "base", n: "Esquisse", v: true, locked: false, opacity: 1, color: "#c8622a" },
  { id: "anno", n: "Annotations", v: true, locked: false, opacity: 1, color: "#3d6b8c" },
  { id: "struct", n: "Structure", v: true, locked: false, opacity: 1, color: "#4a7c59" },
]

export function defaultActiveLayerId(layers = DEFAULT_LAYERS) {
  return layers[layers.length - 1]?.id || layers[0]?.id || "base"
}

/** Migre ancien format (array de traits) vers v2 */
export function normalizeCanvasData(raw) {
  let data = raw
  if (typeof data === "string") {
    try { data = JSON.parse(data) } catch { data = null }
  }
  if (Array.isArray(data)) {
    const layers = DEFAULT_LAYERS.map(l => ({ ...l }))
    const strokes = data.map(s => ({ ...s, layerId: s.layerId || defaultActiveLayerId(layers) }))
    return { strokes, layers, activeLayerId: defaultActiveLayerId(layers) }
  }
  if (data && Array.isArray(data.strokes)) {
    const layers = (data.layers?.length ? data.layers : DEFAULT_LAYERS).map(l => ({
      v: true,
      locked: false,
      opacity: 1,
      ...l,
    }))
    const fallback = defaultActiveLayerId(layers)
    const strokes = data.strokes.map(s => ({ ...s, layerId: s.layerId || fallback }))
    return {
      strokes,
      layers,
      activeLayerId: data.activeLayerId && layers.some(l => l.id === data.activeLayerId)
        ? data.activeLayerId
        : fallback,
    }
  }
  const layers = DEFAULT_LAYERS.map(l => ({ ...l }))
  return { strokes: [], layers, activeLayerId: defaultActiveLayerId(layers) }
}

export function serializeCanvasData(strokes, layers, activeLayerId) {
  return JSON.stringify({ v: 2, strokes, layers, activeLayerId })
}

export function createLayer(index, existing = []) {
  return {
    id: `ly_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    n: `Calque ${existing.length + 1}`,
    v: true,
    locked: false,
    opacity: 1,
    color: LAYER_COLORS[existing.length % LAYER_COLORS.length],
  }
}

export function reorderLayers(list, from, to) {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export function deleteLayer(list, id, strokes) {
  if (list.length <= 1) return { layers: list, strokes, removed: false }
  const idx = list.findIndex(l => l.id === id)
  if (idx < 0) return { layers: list, strokes, removed: false }
  const target = list[idx - 1]?.id || list[idx + 1]?.id
  const layers = list.filter(l => l.id !== id)
  const nextStrokes = strokes.map(s => (s.layerId === id ? { ...s, layerId: target } : s))
  return { layers, strokes: nextStrokes, removed: true, activeFallback: target }
}
