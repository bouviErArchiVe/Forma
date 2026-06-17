/**
 * Resource Factory — couche commune des ressources graphiques d'architecture
 * (hachures, symboles, détails, et futures : matériaux graphiques, légendes).
 *
 * Objectif : une forme de données unique (`GraphicResource`) et des helpers
 * partagés (recherche, catégories) pour que chaque nouvelle famille de
 * ressources réutilise la même UI et le même pipeline d'insertion, sans
 * recréer la même logique. Ne remplace pas les catalogues existants : ils
 * exposent un adaptateur `…ToResource()` vers cette forme commune.
 */
import type { DrawingBlockCategory } from '../blocks/types'

export type ResourceType = 'hatch' | 'symbol' | 'detail' | 'material' | 'legend'

/** Libellés affichables des types de ressources (sous-en-têtes, regroupements). */
export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  hatch: 'Hachures',
  symbol: 'Symboles',
  detail: 'Détails',
  material: 'Matériaux',
  legend: 'Légendes',
}

/** Ordre d'affichage stable des types (regroupements déterministes). */
export const RESOURCE_TYPE_ORDER: ResourceType[] = ['hatch', 'symbol', 'detail', 'material', 'legend']

/** Comment la ressource est consommée. */
export type ResourceSourceType = 'svg-block' | 'document-template'

export interface GraphicResource {
  id: string
  type: ResourceType
  name: string
  /** Clé de catégorie (pour le filtrage). */
  category: string
  /** Libellé affichable de la catégorie. */
  categoryLabel: string
  description: string
  /** Notes techniques complémentaires (ressources « riches » : détails…). */
  notes?: string
  tags: string[]
  /** Corps SVG (géométrie, sans balise <svg>) dessiné dans `viewBox`. */
  svg: string
  /** viewBox du dessin (« 0 0 W H »). */
  viewBox: string
  /** Dimensions d'insertion par défaut (px canvas). */
  defaultWidth: number
  defaultHeight: number
  /** Texte normalisé pré-calculé pour la recherche. */
  searchText: string
  /** Insérable dans un dessin via le pipeline bloc ? */
  insertable: boolean
  /** Avertissement à afficher (indicatif). */
  disclaimer?: string
  sourceType: ResourceSourceType
  /** Catégorie de bloc à l'insertion (pipeline existant). */
  blockCategory: DrawingBlockCategory
  /** Préfixe de tag ajouté au bloc (« hachure », « symbole », « détail »). */
  blockTagPrefix: string
}

export function normalizeText(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

/** Construit le blob de recherche normalisé d'une ressource. */
export function buildSearchText(parts: (string | string[] | undefined)[]): string {
  return normalizeText(
    parts
      .flatMap((p) => (Array.isArray(p) ? p : [p ?? '']))
      .filter(Boolean)
      .join(' '),
  )
}

/** Recherche générique (sous-chaîne) dans une liste de ressources. */
export function searchResources<T extends GraphicResource>(
  resources: T[],
  query: string,
  category?: string | 'all',
): T[] {
  let list = resources
  if (category && category !== 'all') list = list.filter((r) => r.category === category)
  const q = normalizeText(query)
  if (q === '') return list
  return list.filter((r) => r.searchText.includes(q))
}

/** Catégories (clé + libellé) présentes dans une liste de ressources, sans doublon. */
export function resourceCategories<T extends GraphicResource>(resources: T[]): { key: string; label: string }[] {
  const seen = new Map<string, string>()
  for (const r of resources) if (!seen.has(r.category)) seen.set(r.category, r.categoryLabel)
  return [...seen].map(([key, label]) => ({ key, label }))
}

/** Un groupe de ressources partageant le même type (avec son libellé). */
export interface ResourceTypeGroup<T extends GraphicResource = GraphicResource> {
  type: ResourceType
  label: string
  resources: T[]
}

/**
 * Regroupe des ressources par TYPE (hachures / symboles / détails…), en
 * conservant l'ordre stable `RESOURCE_TYPE_ORDER`. Pur et déterministe : ne
 * crée que les groupes non vides, et préserve l'ordre des ressources dans
 * chaque groupe. Utilisé par le catalogue (vue groupée) et la génération de
 * légendes par type.
 */
export function groupResourcesByType<T extends GraphicResource>(resources: T[]): ResourceTypeGroup<T>[] {
  const byType = new Map<ResourceType, T[]>()
  for (const r of resources) {
    const list = byType.get(r.type)
    if (list) list.push(r)
    else byType.set(r.type, [r])
  }
  return RESOURCE_TYPE_ORDER
    .filter((type) => byType.has(type))
    .map((type) => ({ type, label: RESOURCE_TYPE_LABELS[type], resources: byType.get(type)! }))
}

/** Un sous-groupe de ressources partageant la même catégorie (avec son libellé). */
export interface ResourceCategoryGroup<T extends GraphicResource = GraphicResource> {
  /** Clé de catégorie brute (unique au sein d'un type donné). */
  category: string
  label: string
  resources: T[]
}

/**
 * Regroupe des ressources par CATÉGORIE (sol, isolation, plomberie…), en
 * conservant l'ordre de première apparition des catégories ET l'ordre des
 * ressources dans chaque sous-groupe. Pur et déterministe : ne crée que les
 * sous-groupes non vides.
 *
 * Destiné au sous-regroupement par catégorie À L'INTÉRIEUR d'un type dans le
 * catalogue groupé : on appelle d'abord `groupResourcesByType`, puis ceci sur
 * chaque groupe (où toutes les ressources partagent le même type, donc les
 * clés de catégorie ne se chevauchent pas entre familles).
 */
export function groupResourcesByCategory<T extends GraphicResource>(resources: T[]): ResourceCategoryGroup<T>[] {
  const byCategory = new Map<string, ResourceCategoryGroup<T>>()
  for (const r of resources) {
    const existing = byCategory.get(r.category)
    if (existing) existing.resources.push(r)
    else byCategory.set(r.category, { category: r.category, label: r.categoryLabel, resources: [r] })
  }
  return [...byCategory.values()]
}
