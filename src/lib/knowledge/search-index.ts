/**
 * Knowledge Core — index de recherche.
 *
 * Construit un index normalisé (minuscules, sans accents) au-dessus d'un
 * ensemble d'entrées : `term`, `slug`, `synonyms`, `tags`, `relatedTerms`,
 * `domain`, `type`. L'index permet une recherche rapide, insensible aux accents
 * et à la casse, avec un score de pertinence pondéré par le champ touché.
 *
 * Purement local et extractif : aucune entrée n'est inventée, aucun appel
 * réseau. Un terme inconnu ne renvoie simplement aucun résultat.
 */
import { normalizeKnowledgeQuery } from './search-intent'
import type { KnowledgeEntry } from './model'

/** Champ indexé d'une entrée (sert au calcul du score). */
export type IndexedField =
  | 'term'
  | 'slug'
  | 'synonym'
  | 'tag'
  | 'related'
  | 'domain'
  | 'type'

/** Poids de pertinence par champ (term/slug priment sur les métadonnées). */
const FIELD_WEIGHT: Record<IndexedField, number> = {
  term: 10,
  slug: 9,
  synonym: 6,
  tag: 4,
  related: 3,
  domain: 2,
  type: 1,
}

interface IndexedToken {
  /** Valeur normalisée du champ. */
  value: string
  /** Champ d'origine (pour le poids). */
  field: IndexedField
}

interface IndexedEntry {
  entry: KnowledgeEntry
  tokens: IndexedToken[]
}

export interface KnowledgeSearchIndex {
  /** Entrées indexées (ordre d'insertion). */
  readonly entries: readonly KnowledgeEntry[]
  /** Recherche pondérée. Requête vide → []. */
  search(query: string, opts?: KnowledgeSearchOptions): KnowledgeSearchHit[]
  /** Consultation directe par slug normalisé. */
  bySlug(slug: string): KnowledgeEntry | undefined
  /** Consultation directe par id. */
  byId(id: string): KnowledgeEntry | undefined
}

export interface KnowledgeSearchOptions {
  /** Nombre maximum de résultats (défaut : tous). */
  limit?: number
  /** Restreint aux entrées de ce domaine (normalisé). */
  domain?: string
  /** Restreint aux entrées de ce type. */
  type?: KnowledgeEntry['type']
}

export interface KnowledgeSearchHit {
  entry: KnowledgeEntry
  score: number
}

/** Construit la liste des tokens indexés d'une entrée. */
function tokensFor(entry: KnowledgeEntry): IndexedToken[] {
  const tokens: IndexedToken[] = []
  const push = (value: string, field: IndexedField) => {
    const v = normalizeKnowledgeQuery(value)
    if (v !== '') tokens.push({ value: v, field })
  }
  push(entry.term, 'term')
  push(entry.slug, 'slug')
  for (const s of entry.synonyms) push(s, 'synonym')
  for (const t of entry.tags) push(t, 'tag')
  for (const r of entry.relatedTerms) push(r, 'related')
  push(entry.domain, 'domain')
  push(entry.type, 'type')
  return tokens
}

/**
 * Score d'un token contre une requête normalisée :
 * exact (×3) > préfixe (×2) > inclus (×1) > 0. Multiplié par le poids du champ.
 */
function tokenScore(token: IndexedToken, q: string): number {
  let factor = 0
  if (token.value === q) factor = 3
  else if (token.value.startsWith(q)) factor = 2
  else if (token.value.includes(q)) factor = 1
  return factor * FIELD_WEIGHT[token.field]
}

/**
 * Construit un index de recherche sur un ensemble d'entrées. L'index est
 * immuable une fois construit.
 */
export function buildSearchIndex(entries: readonly KnowledgeEntry[]): KnowledgeSearchIndex {
  const indexed: IndexedEntry[] = entries.map((entry) => ({
    entry,
    tokens: tokensFor(entry),
  }))
  const bySlugMap = new Map<string, KnowledgeEntry>()
  const byIdMap = new Map<string, KnowledgeEntry>()
  for (const entry of entries) {
    const slugKey = normalizeKnowledgeQuery(entry.slug)
    if (slugKey !== '' && !bySlugMap.has(slugKey)) bySlugMap.set(slugKey, entry)
    if (!byIdMap.has(entry.id)) byIdMap.set(entry.id, entry)
  }

  return {
    entries,
    search(query: string, opts: KnowledgeSearchOptions = {}): KnowledgeSearchHit[] {
      const q = normalizeKnowledgeQuery(query)
      if (q === '') return []
      const domainFilter = opts.domain ? normalizeKnowledgeQuery(opts.domain) : undefined

      const hits: KnowledgeSearchHit[] = []
      for (const { entry, tokens } of indexed) {
        if (opts.type && entry.type !== opts.type) continue
        if (domainFilter && normalizeKnowledgeQuery(entry.domain) !== domainFilter) continue
        let best = 0
        for (const token of tokens) {
          const s = tokenScore(token, q)
          if (s > best) best = s
        }
        if (best > 0) hits.push({ entry, score: best })
      }

      hits.sort(
        (a, b) => b.score - a.score || a.entry.term.localeCompare(b.entry.term, 'fr'),
      )
      return opts.limit !== undefined ? hits.slice(0, opts.limit) : hits
    },
    bySlug(slug: string): KnowledgeEntry | undefined {
      return bySlugMap.get(normalizeKnowledgeQuery(slug))
    },
    byId(id: string): KnowledgeEntry | undefined {
      return byIdMap.get(id)
    },
  }
}
