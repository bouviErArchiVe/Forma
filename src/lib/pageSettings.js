import { getFormatById } from '@/lib/pageFormats'

export const GRID_STYLES = [
  { id: 'blank', label: 'Vierge', desc: 'Fond uni' },
  { id: 'lined', label: 'Lignes', desc: 'Feuille lignée' },
  { id: 'dotted', label: 'Points', desc: 'Pointillés' },
  { id: 'grid5', label: 'Quadrillage 5 mm', desc: 'Grille fine' },
  { id: 'grid10', label: 'Quadrillage 10 mm', desc: 'Grille standard' },
  { id: 'isometric', label: 'Isométrique', desc: 'Grille 30°' },
  { id: 'blueprint', label: 'Blueprint', desc: 'Plan technique bleu' },
  { id: 'sketch', label: 'Papier sketch', desc: 'Texture croquis' },
]

export const PAGE_COLORS = [
  { id: 'white', c: '#ffffff', l: 'Blanc' },
  { id: 'cream', c: '#fdf6ed', l: 'Crème' },
  { id: 'yellow', c: '#fffff0', l: 'Jaune' },
  { id: 'blue', c: '#f0f8ff', l: 'Bleu ciel' },
  { id: 'green', c: '#f0fff4', l: 'Menthe' },
  { id: 'pink', c: '#fff0f5', l: 'Rose' },
  { id: 'gray', c: '#f5f5f5', l: 'Gris' },
  { id: 'kraft', c: '#f4ede0', l: 'Kraft' },
  { id: 'bp', c: '#dceefb', l: 'Blueprint' },
  { id: 'dark', c: '#1c2128', l: 'Ardoise' },
  { id: 'navy', c: '#0d1b2a', l: 'Marine' },
  { id: 'black', c: '#000000', l: 'Noir' },
]

export const GRID_COLORS = [
  { id: 'gray', c: 'rgba(0,0,0,.08)', l: 'Gris' },
  { id: 'blue', c: 'rgba(61,107,140,.12)', l: 'Bleu' },
  { id: 'red', c: 'rgba(200,50,50,.1)', l: 'Rouge' },
  { id: 'green', c: 'rgba(50,150,50,.1)', l: 'Vert' },
  { id: 'orange', c: 'rgba(200,98,42,.1)', l: 'Orange' },
  { id: 'purple', c: 'rgba(124,58,237,.1)', l: 'Violet' },
  { id: 'white', c: 'rgba(255,255,255,.15)', l: 'Blanc' },
  { id: 'bp', c: 'rgba(0,80,160,.35)', l: 'Blueprint' },
]

const TEMPLATE_TO_GRID = {
  blank: 'blank',
  lined: 'lined',
  dotted: 'dotted',
  grid5: 'grid5',
  grid10: 'grid10',
  isometric: 'isometric',
  plan: 'grid10',
  elevation: 'grid10',
  section: 'grid10',
  detail: 'grid10',
  cornell: 'lined',
  math: 'grid5',
  music: 'lined',
}

export function defaultGridStyle(notebookTemplate) {
  return TEMPLATE_TO_GRID[notebookTemplate] || 'grid10'
}

export function defaultPageMeta(notebookTemplate) {
  return {
    format: 'a4p',
    customMm: { w: 210, h: 297 },
    items: [],
    pageColor: null,
    gridColor: null,
    gridStyle: defaultGridStyle(notebookTemplate),
    infinite: false,
    name: '',
  }
}

/** Parse elements JSON (legacy array ou objet meta) */
export function parsePageElements(raw, notebookTemplate) {
  const base = defaultPageMeta(notebookTemplate)
  if (!raw) return base
  try {
    const el = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (Array.isArray(el)) return { ...base, items: el }
    return {
      ...base,
      format: el.format || base.format,
      customMm: el.customMm || el.custom || base.customMm,
      items: el.items || [],
      pageColor: el.pageColor ?? null,
      gridColor: el.gridColor ?? null,
      gridStyle: el.gridStyle || base.gridStyle,
      infinite: !!el.infinite,
      name: el.name || '',
    }
  } catch {
    return base
  }
}

export function serializePageElements(meta) {
  return {
    format: meta.format || 'a4p',
    customMm: meta.customMm || { w: 210, h: 297 },
    items: meta.items || [],
    pageColor: meta.pageColor ?? null,
    gridColor: meta.gridColor ?? null,
    gridStyle: meta.gridStyle || 'grid10',
    infinite: !!meta.infinite,
    name: meta.name || '',
  }
}

export function mergePageMeta(current, partial) {
  return serializePageElements({ ...parsePageElements(current), ...partial })
}

export function pageDisplayName(pageNum, meta) {
  const name = meta?.name?.trim()
  return name || `Page ${pageNum}`
}

export function orientationFromFormat(formatId, customMm) {
  if (formatId === 'custom' && customMm?.w && customMm?.h) {
    return customMm.w > customMm.h ? 'landscape' : 'portrait'
  }
  const f = getFormatById(formatId)
  return f.w > f.h ? 'landscape' : 'portrait'
}
