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
