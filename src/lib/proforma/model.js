/** PROFORMA — modèle document dessin de précision */

import { resolvePageDimensions } from '@/lib/pageFormats'
import { PF_PRESETS } from './constants'

export const PF_LAYER_TYPES = ['draw', 'text', 'image', 'annotation']

export const DEFAULT_PF_LAYERS = [
  { id: 'pf_base', n: 'Esquisse', type: 'draw', v: true, locked: false, opacity: 1, color: '#1a1a1a' },
  { id: 'pf_anno', n: 'Annotations', type: 'annotation', v: true, locked: false, opacity: 1, color: '#c8622a' },
  { id: 'pf_struct', n: 'Structure', type: 'draw', v: true, locked: false, opacity: 1, color: '#3d6b8c' },
]

function newLayer(index, type = 'draw') {
  const colors = ['#1a1a1a', '#3d6b8c', '#4a7c59', '#c8622a', '#7c5c3d']
  return {
    id: `pf_ly_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    n: `Calque ${index}`,
    type,
    v: true,
    locked: false,
    opacity: 1,
    color: colors[index % colors.length],
  }
}

export function defaultActiveLayerId(layers = DEFAULT_PF_LAYERS) {
  return layers.find((l) => !l.locked)?.id || layers[0]?.id
}

export function createProformaDoc({
  name = 'Sans titre',
  formatId = 'a4',
  customMm = null,
  rotation = 0,
  dpi = 96,
  bgColor = '#ffffff',
  transparent = false,
  presetId = 'sketch',
} = {}) {
  const preset = PF_PRESETS.find((p) => p.id === presetId) || PF_PRESETS[0]
  const fmt = formatId || preset.formatId
  const dims = resolvePageDimensions(fmt, customMm, rotation)
  const now = Date.now()
  const layers = DEFAULT_PF_LAYERS.map((l) => ({ ...l }))

  return {
    id: `pf_${now}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    formatId: fmt,
    customMm,
    rotation: dims.rotation ?? rotation,
    width: dims.w,
    height: dims.h,
    dpi,
    bgColor: preset.bgColor || bgColor,
    transparent,
    presetId: preset.id,
    grid: preset.grid || 'grid5',
    showGrid: true,
    snapGrid: true,
    snapGuides: true,
    createdAt: now,
    updatedAt: now,
    viewRotation: 0,
    zoom: 0.75,
    panX: 0,
    panY: 0,
    layers,
    activeLayerId: defaultActiveLayerId(layers),
    strokes: [],
    images: [],
    texts: [],
  }
}

export function cloneProformaDoc(doc, { name } = {}) {
  const now = Date.now()
  return {
    ...JSON.parse(JSON.stringify(doc)),
    id: `pf_${now}_${Math.random().toString(36).slice(2, 8)}`,
    name: name || `${doc.name} (copie)`,
    createdAt: now,
    updatedAt: now,
  }
}

export function addLayer(doc, type = 'draw') {
  const layer = newLayer(doc.layers.length + 1, type)
  return { ...doc, layers: [...doc.layers, layer], activeLayerId: layer.id, updatedAt: Date.now() }
}

export function deleteLayer(doc, layerId) {
  if (doc.layers.length <= 1) return doc
  const idx = doc.layers.findIndex((l) => l.id === layerId)
  if (idx < 0) return doc
  const fallback = doc.layers[idx - 1]?.id || doc.layers[idx + 1]?.id
  const layers = doc.layers.filter((l) => l.id !== layerId)
  const strokes = doc.strokes.map((s) => (s.layerId === layerId ? { ...s, layerId: fallback } : s))
  return {
    ...doc,
    layers,
    strokes,
    activeLayerId: doc.activeLayerId === layerId ? fallback : doc.activeLayerId,
    updatedAt: Date.now(),
  }
}

export function reorderLayers(doc, from, to) {
  if (from === to || from < 0 || to < 0 || from >= doc.layers.length || to >= doc.layers.length) return doc
  const layers = [...doc.layers]
  const [item] = layers.splice(from, 1)
  layers.splice(to, 0, item)
  return { ...doc, layers, updatedAt: Date.now() }
}

export function mergeLayers(doc, targetId, sourceId) {
  if (targetId === sourceId) return doc
  const strokes = doc.strokes.map((s) => (s.layerId === sourceId ? { ...s, layerId: targetId } : s))
  const layers = doc.layers.filter((l) => l.id !== sourceId)
  return {
    ...doc,
    layers,
    strokes,
    activeLayerId: doc.activeLayerId === sourceId ? targetId : doc.activeLayerId,
    updatedAt: Date.now(),
  }
}

export function normalizeProformaData(raw) {
  let data = raw
  if (typeof data === 'string') {
    try { data = JSON.parse(data) } catch { data = null }
  }
  if (!data || !data.layers) {
    return createProformaDoc({ name: 'Récupération' })
  }
  const layers = (data.layers?.length ? data.layers : DEFAULT_PF_LAYERS).map((l) => ({
    v: true,
    locked: false,
    opacity: 1,
    type: 'draw',
    ...l,
  }))
  const fallback = defaultActiveLayerId(layers)
  const strokes = (data.strokes || []).map((s) => ({ ...s, layerId: s.layerId || fallback }))
  return {
    ...data,
    layers,
    strokes,
    activeLayerId: layers.some((l) => l.id === data.activeLayerId) ? data.activeLayerId : fallback,
    images: data.images || [],
    texts: data.texts || [],
  }
}
