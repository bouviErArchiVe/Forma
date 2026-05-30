/** FormaLibrary — catégories, presets, filtres, tri. */

import type { LibraryCategoryId } from './model'

export interface LibraryCategoryDef {
  id: LibraryCategoryId
  label: string
  icon: string
}

export const LIBRARY_CATEGORIES: Record<LibraryCategoryId, LibraryCategoryDef> = {
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

export interface LibraryPreset {
  id: string
  label: string
  icon: string
  tags: string[]
}

export const LIBRARY_PRESETS: LibraryPreset[] = [
  { id: 'cnb', label: 'CNB', icon: '📜', tags: ['CNB', 'norme', 'code'] },
  { id: 'ccq', label: 'CCQ', icon: '🏗', tags: ['CCQ', 'construction'] },
  { id: 'details', label: 'Détails constructifs', icon: '🔩', tags: ['détail', 'constructif'] },
  { id: 'materials', label: 'Matériaux', icon: '🧱', tags: ['matériau', 'fiche'] },
  { id: 'textures', label: 'Textures', icon: '🖼', tags: ['texture'] },
  { id: 'refs', label: 'Références archi/design', icon: '📚', tags: ['référence', 'architecture'] },
]

export interface TypeFilter {
  id: string
  label: string
}

export const TYPE_FILTERS: TypeFilter[] = [
  { id: 'all', label: 'Tout' },
  { id: 'favorites', label: 'Favoris' },
  ...Object.values(LIBRARY_CATEGORIES)
    .slice(0, 8)
    .map((c) => ({ id: c.id, label: c.label })),
]

export type SortOption = 'updated' | 'created' | 'name' | 'type'

export const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'updated', label: 'Modifié' },
  { id: 'created', label: 'Créé' },
  { id: 'name', label: 'Nom' },
  { id: 'type', label: 'Type' },
]

export function categoryLabel(id: string): string {
  return LIBRARY_CATEGORIES[id as LibraryCategoryId]?.label || id
}

export function categoryIcon(id: string): string {
  return LIBRARY_CATEGORIES[id as LibraryCategoryId]?.icon || '📦'
}
