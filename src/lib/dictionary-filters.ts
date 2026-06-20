/**
 * Dictionary UI — logique de parcours en mémoire (filtre / tri / pagination).
 *
 * Fonctions PURES, sans React ni réseau : on opère uniquement sur le tableau
 * d'entrées déjà chargé via l'API lecture seule `@/lib/knowledge`
 * (`allKnowledgeEntries`). Aucune entrée n'est inventée ; on ne fait que
 * sélectionner / ordonner / paginer ce qui existe déjà.
 *
 * Réutilisé par `DictionaryPage` et testé isolément (`dictionary-filters.test.ts`).
 */
import {
  KNOWLEDGE_CONFIDENCE_LEVELS,
  type KnowledgeConfidence,
  type KnowledgeEntry,
  type KnowledgeEntryType,
} from './knowledge'

/** Libellés humains (fr) des 13 types d'entrée. */
export const KNOWLEDGE_TYPE_LABEL: Record<KnowledgeEntryType, string> = {
  word: 'Mot',
  concept: 'Concept',
  material: 'Matériau',
  construction_system: 'Système constructif',
  person: 'Personne',
  building: 'Bâtiment',
  date: 'Date',
  place: 'Lieu',
  norm: 'Norme',
  formula: 'Formule',
  method: 'Méthode',
  style: 'Style',
  tool: 'Outil',
}

/** Critères de tri exposés à l'UI. */
export type DictionarySort =
  | 'term-asc'
  | 'term-desc'
  | 'type'
  | 'confidence'
  | 'relevance'

/** Libellés humains des critères de tri. */
export const DICTIONARY_SORT_LABEL: Record<DictionarySort, string> = {
  'term-asc': 'A → Z',
  'term-desc': 'Z → A',
  type: 'Type',
  confidence: 'Confiance',
  relevance: 'Pertinence',
}

/** État de filtre combinable (tous optionnels, combinés en ET). */
export interface DictionaryFilter {
  type?: KnowledgeEntryType
  domain?: string
  confidence?: KnowledgeConfidence
  /** Restreint aux favoris (slugs fournis par l'appelant). */
  favoritesOnly?: boolean
  /** Restreint aux récents (slugs fournis par l'appelant). */
  recentsOnly?: boolean
}

/** Vrai si aucun filtre n'est actif. */
export function isFilterEmpty(f: DictionaryFilter): boolean {
  return (
    !f.type
    && !f.domain
    && !f.confidence
    && !f.favoritesOnly
    && !f.recentsOnly
  )
}

/** Domaines distincts présents dans la base, triés alphabétiquement (fr). */
export function distinctDomains(entries: readonly KnowledgeEntry[]): string[] {
  const set = new Set<string>()
  for (const e of entries) {
    const d = e.domain?.trim()
    if (d) set.add(d)
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'fr'))
}

/** Types distincts présents (sous-ensemble de KNOWLEDGE_ENTRY_TYPES), dans l'ordre canonique. */
export function distinctTypes(entries: readonly KnowledgeEntry[]): KnowledgeEntryType[] {
  const present = new Set<KnowledgeEntryType>()
  for (const e of entries) present.add(e.type)
  return (Object.keys(KNOWLEDGE_TYPE_LABEL) as KnowledgeEntryType[]).filter((t) =>
    present.has(t),
  )
}

/**
 * Applique un filtre combinable en mémoire. `favoriteSlugs` / `recentSlugs`
 * sont des ensembles fournis par l'appelant (issus du store localStorage).
 */
export function applyFilter(
  entries: readonly KnowledgeEntry[],
  filter: DictionaryFilter,
  favoriteSlugs?: ReadonlySet<string>,
  recentSlugs?: ReadonlySet<string>,
): KnowledgeEntry[] {
  return entries.filter((e) => {
    if (filter.type && e.type !== filter.type) return false
    if (filter.domain && e.domain !== filter.domain) return false
    if (filter.confidence && e.confidence !== filter.confidence) return false
    if (filter.favoritesOnly && !(favoriteSlugs?.has(e.slug) ?? false)) return false
    if (filter.recentsOnly && !(recentSlugs?.has(e.slug) ?? false)) return false
    return true
  })
}

/** Rang de confiance pour le tri (indicatif < concept < à-vérifier). */
function confidenceRank(c: KnowledgeConfidence): number {
  const i = KNOWLEDGE_CONFIDENCE_LEVELS.indexOf(c)
  return i === -1 ? KNOWLEDGE_CONFIDENCE_LEVELS.length : i
}

/**
 * Trie une COPIE des entrées selon le critère donné. Le tri `relevance`
 * n'a de sens que sur des résultats déjà ordonnés par pertinence : ici il
 * préserve l'ordre d'entrée (stable) — l'appelant passe déjà les hits classés.
 */
export function sortEntries(
  entries: readonly KnowledgeEntry[],
  sort: DictionarySort,
): KnowledgeEntry[] {
  const copy = entries.slice()
  switch (sort) {
    case 'term-asc':
      return copy.sort((a, b) => a.term.localeCompare(b.term, 'fr'))
    case 'term-desc':
      return copy.sort((a, b) => b.term.localeCompare(a.term, 'fr'))
    case 'type':
      return copy.sort(
        (a, b) =>
          (KNOWLEDGE_TYPE_LABEL[a.type] ?? a.type).localeCompare(
            KNOWLEDGE_TYPE_LABEL[b.type] ?? b.type,
            'fr',
          ) || a.term.localeCompare(b.term, 'fr'),
      )
    case 'confidence':
      return copy.sort(
        (a, b) =>
          confidenceRank(a.confidence) - confidenceRank(b.confidence)
          || a.term.localeCompare(b.term, 'fr'),
      )
    case 'relevance':
    default:
      return copy
  }
}

/** Taille de page par défaut du parcours en mémoire. */
export const DICTIONARY_PAGE_SIZE = 24

/** Résultat paginé (tranche + métadonnées). */
export interface Paged<T> {
  items: T[]
  total: number
  page: number
  pageCount: number
  hasMore: boolean
}

/**
 * Pagine en mémoire. `page` est 1-based ; `cumulative` (mode « charger plus »)
 * renvoie toutes les entrées jusqu'à la page courante incluse.
 */
export function paginate<T>(
  items: readonly T[],
  page: number,
  pageSize: number = DICTIONARY_PAGE_SIZE,
  cumulative = true,
): Paged<T> {
  const total = items.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const clamped = Math.min(Math.max(1, Math.floor(page) || 1), pageCount)
  const end = clamped * pageSize
  const start = cumulative ? 0 : (clamped - 1) * pageSize
  return {
    items: items.slice(start, end),
    total,
    page: clamped,
    pageCount,
    hasMore: clamped < pageCount,
  }
}

/**
 * Résout un terme libre (synonyme, terme lié, exemple…) vers une entrée de la
 * base, par slug normalisé OU par terme/synonyme exact (sans accent/casse).
 * Renvoie `undefined` si rien ne correspond — l'appelant bascule alors en
 * recherche pour ne JAMAIS produire de clic mort.
 */
export function resolveTerm(
  raw: string,
  entries: readonly KnowledgeEntry[],
): KnowledgeEntry | undefined {
  const norm = normalize(raw)
  if (!norm) return undefined
  // 1) slug exact
  for (const e of entries) {
    if (normalize(e.slug) === norm) return e
  }
  // 2) terme exact
  for (const e of entries) {
    if (normalize(e.term) === norm) return e
  }
  // 3) synonyme exact
  for (const e of entries) {
    if (e.synonyms.some((s) => normalize(s) === norm)) return e
  }
  return undefined
}

/** Plage des diacritiques combinants (U+0300–U+036F) pour le dépouillement d'accents. */
const COMBINING_MARKS = /[̀-ͯ]/g

/** Normalisation locale (minuscule, sans accents, espaces compactés). */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(/\s+/g, ' ')
    .trim()
}
