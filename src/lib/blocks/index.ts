/**
 * Bibliothèque de blocs — API du catalogue (recherche, filtre, lookup).
 */
import { IMPERIAL_BLOCKS } from './catalog-imperial'
import { METRIC_BLOCKS } from './catalog-metric'
import type { DrawingBlock, DrawingBlockCategory, DrawingBlockUnitSystem } from './types'

export * from './types'
export { METRIC_BLOCKS } from './catalog-metric'
export { IMPERIAL_BLOCKS } from './catalog-imperial'

const ALL_BLOCKS: DrawingBlock[] = [...METRIC_BLOCKS, ...IMPERIAL_BLOCKS]
const BY_ID = new Map(ALL_BLOCKS.map((b) => [b.id, b]))

/** Blocs d'un système d'unités donné. */
export function blocksForUnit(unit: DrawingBlockUnitSystem): DrawingBlock[] {
  return unit === 'metric' ? METRIC_BLOCKS : IMPERIAL_BLOCKS
}

/** Recherche un bloc par id (tous systèmes confondus). */
export function getBlock(id: string): DrawingBlock | undefined {
  return BY_ID.get(id)
}

/** Catégories non vides présentes pour un système, dans l'ordre du registre. */
export function categoriesForUnit(unit: DrawingBlockUnitSystem): DrawingBlockCategory[] {
  const seen = new Set<DrawingBlockCategory>()
  for (const b of blocksForUnit(unit)) seen.add(b.category)
  return [...seen]
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

export interface BlockQuery {
  unit: DrawingBlockUnitSystem
  category?: DrawingBlockCategory | 'all'
  search?: string
}

/**
 * Filtre les blocs d'un système par catégorie puis par recherche (nom,
 * tags, libellé d'échelle, description), insensible à la casse/accents.
 */
export function queryBlocks({ unit, category = 'all', search = '' }: BlockQuery): DrawingBlock[] {
  let list = blocksForUnit(unit)
  if (category !== 'all') list = list.filter((b) => b.category === category)
  const q = normalize(search)
  if (q !== '') {
    list = list.filter((b) => {
      const hay = normalize(
        [b.name, b.scaleLabel ?? '', b.description ?? '', b.tags.join(' '), b.category].join(' '),
      )
      return hay.includes(q)
    })
  }
  return list
}
