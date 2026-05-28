/** FormaLibrary — bibliothèque centralisée ressources */

import { FORMA_THEME_VARS } from '@/lib/formaShell'

export const FLB_DARK = {
  ...FORMA_THEME_VARS,
}

export const LIBRARY_CATEGORIES = {
  texture: { id: 'texture', label: 'Texture', icon: '🧱' },
  material: { id: 'material', label: 'Matériau', icon: '🪵' },
  detail: { id: 'detail', label: 'Détail technique', icon: '🔩' },
  block: { id: 'block', label: 'Bloc', icon: '▣' },
  image: { id: 'image', label: 'Image', icon: '🖼' },
  reference: { id: 'reference', label: 'Référence', icon: '📚' },
  pdf: { id: 'pdf', label: 'PDF', icon: '📕' },
  norm: { id: 'norm', label: 'Norme', icon: '📜' },
  palette: { id: 'palette', label: 'Palette', icon: '🎨' },
  object: { id: 'object', label: 'Objet récurrent', icon: '🪑' },
  doc: { id: 'doc', label: 'FormaDoc', icon: '📄' },
  sheet: { id: 'sheet', label: 'FormaTab', icon: '📊' },
  svg: { id: 'svg', label: 'SVG', icon: '◇' },
  dwg: { id: 'dwg', label: 'DWG', icon: '📐' },
  note: { id: 'note', label: 'Note de cours', icon: '📝' },
}

export const LIBRARY_PRESETS = [
  { id: 'cnb', label: 'CNB', icon: '📜', tags: ['CNB', 'norme', 'code'] },
  { id: 'ccq', label: 'CCQ', icon: '🏗', tags: ['CCQ', 'construction'] },
  { id: 'details', label: 'Détails constructifs', icon: '🔩', tags: ['détail', 'constructif'] },
  { id: 'materials', label: 'Matériaux', icon: '🧱', tags: ['matériau', 'fiche'] },
  { id: 'textures', label: 'Textures', icon: '🖼', tags: ['texture'] },
  { id: 'refs', label: 'Références archi/design', icon: '📚', tags: ['référence', 'architecture'] },
]

export const TYPE_FILTERS = [
  { id: 'all', label: 'Tout' },
  { id: 'favorites', label: 'Favoris' },
  ...Object.values(LIBRARY_CATEGORIES).slice(0, 8).map((c) => ({ id: c.id, label: c.label })),
]

export const SORT_OPTIONS = [
  { id: 'updated', label: 'Modifié' },
  { id: 'created', label: 'Créé' },
  { id: 'name', label: 'Nom' },
  { id: 'type', label: 'Type' },
]

export function categoryLabel(id) {
  return LIBRARY_CATEGORIES[id]?.label || id
}

export function categoryIcon(id) {
  return LIBRARY_CATEGORIES[id]?.icon || '📦'
}
