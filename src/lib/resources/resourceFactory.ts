/**
 * Resource Factory — façade unifiée des ressources graphiques insérables.
 *
 * Point d'entrée unique pour consommer TOUTES les familles de ressources
 * graphiques (hachures, symboles, détails, légendes) sous la forme commune
 * `GraphicResource`, sans réimporter chaque catalogue. Pensé pour :
 *   - le catalogue combiné de `ResourcesPage` (vue « Ressources graphiques »),
 *   - l'indexation par la recherche transverse (Lane E),
 *   - tout futur consommateur (génération de légendes, suggestions FormAI…).
 *
 * Additif et non destructif : ne modifie aucun catalogue existant ; chaque
 * famille reste maîtresse de son adaptateur `…ToResource()`. Pur et
 * déterministe (mêmes catalogues → même liste, même ordre).
 */
import { HATCHES, hatchToResource } from './hatches'
import { SYMBOLS, symbolToResource } from './symbols'
import { CONSTRUCTION_DETAILS, detailToResource } from './details'
import { LEGENDS, legendToResource } from './legends'
import {
  RESOURCE_TYPE_LABELS,
  RESOURCE_TYPE_ORDER,
  groupResourcesByType,
  searchResources,
  type GraphicResource,
  type ResourceType,
  type ResourceTypeGroup,
} from './resourceTypes'

/**
 * Toutes les ressources graphiques insérables, dans un ordre stable et
 * déterministe (ordre des types `RESOURCE_TYPE_ORDER`, puis ordre du catalogue
 * de chaque famille). Recalculé à chaque appel pour rester pur ; les
 * consommateurs React doivent le mémoïser.
 */
export function allGraphicResources(): GraphicResource[] {
  return [
    ...HATCHES.map(hatchToResource),
    ...SYMBOLS.map(symbolToResource),
    ...CONSTRUCTION_DETAILS.map(detailToResource),
    ...LEGENDS.map(legendToResource),
  ]
}

/** Nombre total de ressources graphiques exposées (toutes familles). */
export function graphicResourceCount(): number {
  return HATCHES.length + SYMBOLS.length + CONSTRUCTION_DETAILS.length + LEGENDS.length
}

/**
 * Recherche transverse sur toutes les ressources graphiques (sous-chaîne
 * normalisée, accents/casse ignorés). Délègue à `searchResources` pour rester
 * cohérent avec les catalogues mono-famille. Destiné à la recherche globale.
 */
export function searchGraphicResources(query: string): GraphicResource[] {
  return searchResources(allGraphicResources(), query)
}

/** Ressources d'un type donné uniquement (hachures, symboles, …). */
export function graphicResourcesByType(type: ResourceType): GraphicResource[] {
  return allGraphicResources().filter((r) => r.type === type)
}

/** Regroupe toutes les ressources par type (ordre `RESOURCE_TYPE_ORDER`). */
export function allGraphicResourceGroups(): ResourceTypeGroup[] {
  return groupResourcesByType(allGraphicResources())
}

/**
 * Clé de catégorie qualifiée par le type : `<type>:<category>`.
 *
 * Les clés de catégorie brutes ne sont PAS uniques entre familles (ex.
 * `isolation` existe pour les hachures ET les détails). Cette clé composée est
 * sûre pour un filtre/agrégat transverse (facettes de recherche, regroupements
 * mixtes) sans collision.
 */
export function qualifiedCategoryKey(resource: GraphicResource): string {
  return `${resource.type}:${resource.category}`
}

/** Une facette de catégorie transverse (clé qualifiée + libellés + compte). */
export interface ResourceCategoryFacet {
  /** Clé qualifiée unique `<type>:<category>`. */
  key: string
  type: ResourceType
  typeLabel: string
  /** Clé de catégorie brute (non unique entre types). */
  category: string
  categoryLabel: string
  count: number
}

/**
 * Construit les facettes de catégorie transverses pour une liste de ressources
 * (par défaut toutes). Triées par ordre de type stable, puis par libellé de
 * catégorie. Sans collision grâce à la clé qualifiée — utilisable pour des
 * filtres de recherche groupés par famille.
 */
export function graphicResourceCategoryFacets(
  resources: GraphicResource[] = allGraphicResources(),
): ResourceCategoryFacet[] {
  const byKey = new Map<string, ResourceCategoryFacet>()
  for (const r of resources) {
    const key = qualifiedCategoryKey(r)
    const existing = byKey.get(key)
    if (existing) {
      existing.count += 1
      continue
    }
    byKey.set(key, {
      key,
      type: r.type,
      typeLabel: RESOURCE_TYPE_LABELS[r.type],
      category: r.category,
      categoryLabel: r.categoryLabel,
      count: 1,
    })
  }
  const typeRank = (t: ResourceType) => {
    const i = RESOURCE_TYPE_ORDER.indexOf(t)
    return i === -1 ? RESOURCE_TYPE_ORDER.length : i
  }
  return [...byKey.values()].sort(
    (a, b) => typeRank(a.type) - typeRank(b.type) || a.categoryLabel.localeCompare(b.categoryLabel),
  )
}
