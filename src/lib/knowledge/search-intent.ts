/**
 * Knowledge Core — search-intent.
 *
 * Aide à l'interprétation d'une requête de recherche de connaissance :
 * normalisation (accents, casse, ponctuation) et détection d'intention
 * (consultation d'un terme précis vs. recherche large). Purement local,
 * sans IA. Réutilisable par Study (C) et FormAI (D).
 */

export type KnowledgeIntentKind = 'lookup' | 'search' | 'empty'

export interface KnowledgeIntent {
  /** Requête d'origine, non modifiée. */
  raw: string
  /** Requête normalisée (minuscules, sans accents, espaces resserrés). */
  normalized: string
  /**
   * Type d'intention :
   *  - 'empty'  → requête vide après normalisation.
   *  - 'lookup' → terme unique court → consultation directe d'une fiche.
   *  - 'search' → plusieurs mots / requête longue → recherche large.
   */
  kind: KnowledgeIntentKind
  /** Mots-clés normalisés (sans mots vides), pour le scoring. */
  keywords: string[]
}

/** Mots vides français usuels, ignorés dans l'extraction de mots-clés. */
const STOP_WORDS = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'd', 'et', 'ou', 'que',
  'qui', 'quoi', 'est', 'ce', 'cette', 'ces', 'au', 'aux', 'en', 'dans', 'sur',
  'pour', 'par', 'avec', 'sans', 'a', 'l', 'definition', 'signifie', 'veut',
  'dire', 'quest', 'qu', 'cest', 'c',
])

// Apostrophes typographiques : U+2018 (') et U+2019 (').
const CURLY_APOSTROPHES = /[‘’]/g

/**
 * Normalise une requête : minuscules, suppression des accents, des apostrophes
 * typographiques et de la ponctuation parasite, espaces resserrés.
 */
export function normalizeKnowledgeQuery(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(CURLY_APOSTROPHES, "'")
    .replace(/[^\p{L}\p{N}'\- ]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Extrait les mots-clés signifiants. Les tokens sont éclatés sur apostrophes
 * et traits d'union pour écarter les amorces interrogatives (« qu'est-ce »),
 * puis filtrés des mots vides et des fragments < 2 caractères.
 */
export function extractKeywords(text: string): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const token of normalizeKnowledgeQuery(text).split(' ')) {
    for (const part of token.split(/['-]/)) {
      if (part.length >= 2 && !STOP_WORDS.has(part) && !seen.has(part)) {
        seen.add(part)
        out.push(part)
      }
    }
  }
  return out
}

/**
 * Interprète une requête de recherche de connaissance. Une requête d'un seul
 * mot (terme court) est traitée comme une consultation directe (`lookup`),
 * sinon comme une recherche large (`search`). Vide → `empty`.
 */
export function parseSearchIntent(query: string): KnowledgeIntent {
  const normalized = normalizeKnowledgeQuery(query)
  if (normalized === '') {
    return { raw: query, normalized: '', kind: 'empty', keywords: [] }
  }
  const keywords = extractKeywords(query)
  const wordCount = normalized.split(' ').filter(Boolean).length
  const kind: KnowledgeIntentKind = wordCount <= 1 ? 'lookup' : 'search'
  return { raw: query, normalized, kind, keywords }
}
