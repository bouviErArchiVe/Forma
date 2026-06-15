/**
 * Resource Usage — détecte les ressources de la Resource Factory réellement
 * insérées dans une page/document, à partir des métadonnées des ImageElements
 * (`blockId` = `<type>-<resourceId>`). Sert de base à la génération
 * automatique de légendes.
 *
 * Lecture seule : ne modifie ni le canvas, ni Dexie. Les blocs « génériques »
 * (hors catalogues Factory) sont ignorés proprement.
 */
import { getHatch, hatchToResource } from './hatches'
import { getSymbol, symbolToResource } from './symbols'
import { getDetail, detailToResource } from './details'
import { getLegend, legendToResource } from './legends'
import { resourceCategories, type GraphicResource, type ResourceType } from './resourceTypes'

const KNOWN_TYPES: ResourceType[] = ['hatch', 'symbol', 'detail', 'legend']

/** Découpe un id de bloc `<type>-<resourceId>` en ressource Factory connue. */
export function parseResourceBlockId(blockId: string): { type: ResourceType; resourceId: string } | null {
  const i = blockId.indexOf('-')
  if (i <= 0) return null
  const type = blockId.slice(0, i) as ResourceType
  const resourceId = blockId.slice(i + 1)
  if (!KNOWN_TYPES.includes(type) || resourceId === '') return null
  return { type, resourceId }
}

/** Résout un blockId vers la `GraphicResource` correspondante (ou undefined). */
export function resolveUsedResource(blockId: string): GraphicResource | undefined {
  const parsed = parseResourceBlockId(blockId)
  if (!parsed) return undefined
  switch (parsed.type) {
    case 'hatch': {
      const h = getHatch(parsed.resourceId)
      return h ? hatchToResource(h) : undefined
    }
    case 'symbol': {
      const s = getSymbol(parsed.resourceId)
      return s ? symbolToResource(s) : undefined
    }
    case 'detail': {
      const d = getDetail(parsed.resourceId)
      return d ? detailToResource(d) : undefined
    }
    case 'legend': {
      const l = getLegend(parsed.resourceId)
      return l ? legendToResource(l) : undefined
    }
    default:
      return undefined
  }
}

export interface ResourceUsageEntry {
  resource: GraphicResource
  count: number
}

export interface ResourceUsage {
  /** Ressources uniques utilisées, avec nombre d'occurrences (triées). */
  entries: ResourceUsageEntry[]
  /** Total d'occurrences (somme des counts). */
  total: number
  /** Nombre de ressources uniques. */
  uniqueCount: number
  /** Types de ressources présents. */
  typesUsed: ResourceType[]
  /** Catégories présentes (clé + libellé). */
  categories: { key: string; label: string }[]
}

/**
 * Collecte l'usage des ressources Factory parmi des éléments porteurs d'un
 * `blockId`. Déduplique par ressource et compte les occurrences.
 */
export function collectResourceUsage(elements: { blockId?: string }[]): ResourceUsage {
  const byId = new Map<string, ResourceUsageEntry>()
  let total = 0
  for (const el of elements) {
    if (!el.blockId) continue
    const resource = resolveUsedResource(el.blockId)
    if (!resource) continue
    total += 1
    const key = `${resource.type}-${resource.id}`
    const existing = byId.get(key)
    if (existing) existing.count += 1
    else byId.set(key, { resource, count: 1 })
  }

  const entries = [...byId.values()].sort(
    (a, b) => b.count - a.count || a.resource.name.localeCompare(b.resource.name),
  )
  const typesUsed = [...new Set(entries.map((e) => e.resource.type))]
  const categories = resourceCategories(entries.map((e) => e.resource))

  return { entries, total, uniqueCount: entries.length, typesUsed, categories }
}
