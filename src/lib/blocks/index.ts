/**
 * Bibliothèque de blocs — API du catalogue (recherche, filtre, lookup).
 */
import { IMPERIAL_BLOCKS } from './catalog-imperial'
import { METRIC_BLOCKS } from './catalog-metric'
import { expandQueryTerms } from './synonyms'
import type { DrawingBlock, DrawingBlockCategory, DrawingBlockUnitSystem } from './types'

export * from './types'
export { METRIC_BLOCKS } from './catalog-metric'
export { IMPERIAL_BLOCKS } from './catalog-imperial'
export { expandQueryTerms } from './synonyms'

const ALL_BLOCKS: DrawingBlock[] = [...METRIC_BLOCKS, ...IMPERIAL_BLOCKS]
const BY_ID = new Map(ALL_BLOCKS.map((b) => [b.id, b]))

/** Blocs d'un système d'unités donné. */
export function blocksForUnit(unit: DrawingBlockUnitSystem): DrawingBlock[] {
  return unit === 'metric' ? METRIC_BLOCKS : IMPERIAL_BLOCKS
}

/** Recherche un bloc du catalogue statique par id. */
export function getBlock(id: string): DrawingBlock | undefined {
  return BY_ID.get(id)
}

/** Résout un bloc par id en incluant les blocs personnalisés fournis. */
export function resolveBlock(id: string, customBlocks: DrawingBlock[] = []): DrawingBlock | undefined {
  return BY_ID.get(id) ?? customBlocks.find((b) => b.id === id)
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
  /** Blocs personnalisés à inclure dans le résultat (depuis le store). */
  customBlocks?: DrawingBlock[]
}

/** Texte recherchable d'un bloc (nom, échelle, description, tags, catégorie). */
function blockHaystack(b: DrawingBlock): string {
  return normalize([b.name, b.scaleLabel ?? '', b.description ?? '', b.tags.join(' '), b.category].join(' '))
}

/**
 * Filtre les blocs d'un système (catalogue + customs) par catégorie puis par
 * recherche. La recherche est étendue avec les synonymes FR/EN : « toilet »
 * trouve le WC, « beam » trouve une poutre, etc. (au moins un terme doit
 * correspondre). Insensible à la casse et aux accents.
 */
export function queryBlocks({ unit, category = 'all', search = '', customBlocks = [] }: BlockQuery): DrawingBlock[] {
  let list = [...blocksForUnit(unit), ...customBlocks.filter((b) => b.unitSystem === unit)]
  if (category !== 'all') list = list.filter((b) => b.category === category)
  const q = search.trim()
  if (q !== '') {
    const terms = expandQueryTerms(q)
    list = list.filter((b) => {
      const hay = blockHaystack(b)
      return terms.some((t) => hay.includes(t))
    })
  }
  return list
}
