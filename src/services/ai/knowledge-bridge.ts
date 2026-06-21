/**
 * Pont FormAI ↔ Knowledge (Sprint #11).
 *
 * Consulte la base Knowledge LOCALE pour répondre à une question de
 * connaissance AVANT que le mode local n'abandonne. La réponse est ANCRÉE :
 * définition + source + niveau de confiance + lien `/dictionary?slug=`, avec un
 * avertissement explicite si la confiance est « à-vérifier ».
 *
 * Honnêteté : renvoie `null` si aucune fiche fiable ne correspond (jamais de
 * réponse inventée, jamais de prétention d'IA cloud). Les ~919 seeds sont
 * chargés par IMPORT DYNAMIQUE → hors du bundle principal/FormAI tant qu'aucune
 * question de connaissance n'est posée.
 */
import {
  entryDefinition,
  entrySourceLabel,
  KNOWLEDGE_CONFIDENCE_LABEL,
  type KnowledgeConfidence,
  type KnowledgeEntry,
} from '../../lib/knowledge/model'
import { extractKeywords } from '../../lib/knowledge/search-intent'

const COMBINING = /[̀-ͯ]/g

function norm(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(COMBINING, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

function termTokens(value: string): string[] {
  return norm(value).split(' ').filter((t) => t.length > 1)
}

/**
 * Garde de pertinence prudente : on n'accepte une fiche que si la question
 * « porte sur » son terme — soit la requête contient tout le terme, soit le
 * terme couvre toute la requête, soit un synonyme est entièrement présent. Cela
 * évite de répondre avec une fiche faiblement liée (anti-faux-positif).
 */
function isRelevant(entry: KnowledgeEntry, keywords: ReadonlySet<string>): boolean {
  const tt = termTokens(entry.term)
  if (tt.length === 0) return false
  const queryContainsTerm = tt.every((t) => keywords.has(t))
  const termCoversQuery = [...keywords].every((k) => tt.includes(k))
  if (queryContainsTerm || termCoversQuery) return true
  for (const syn of entry.synonyms ?? []) {
    const st = termTokens(syn)
    if (st.length > 0 && st.every((t) => keywords.has(t))) return true
  }
  return false
}

export interface KnowledgeBridgeAnswer {
  text: string
  slug: string
  term: string
  confidence: KnowledgeConfidence
}

/** Formate une réponse locale ancrée à partir d'une fiche. */
function formatAnswer(entry: KnowledgeEntry): string {
  const lines: string[] = []
  lines.push(`**${entry.term}** — ${entry.shortDefinition}`)
  const long = entryDefinition(entry).trim()
  if (long && long !== entry.shortDefinition.trim()) lines.push(long)
  lines.push(`Source : ${entrySourceLabel(entry)} · Confiance : ${KNOWLEDGE_CONFIDENCE_LABEL[entry.confidence]}`)
  if (entry.confidence === 'à-vérifier') {
    lines.push('⚠ Information à vérifier auprès d’une source officielle (fiche marquée « à vérifier »).')
  }
  lines.push(`Fiche : /dictionary?slug=${entry.slug}`)
  lines.push('(Mode local — réponse issue de la base Knowledge Forma, pas d’une IA générative.)')
  return lines.join('\n\n')
}

/**
 * Tente de répondre à une question de connaissance à partir de la base locale.
 * `null` si aucune fiche pertinente (le mode local enchaînera son message
 * honnête « non trouvé »).
 */
/**
 * Trouve la fiche Knowledge la plus pertinente pour une question, ou `null`
 * (honnête). Logique partagée par la réponse extractive (#11) et le grounding
 * du modèle local (#12). Import dynamique des seeds.
 */
export async function findRelevantEntry(question: string): Promise<KnowledgeEntry | null> {
  const keywords = extractKeywords(question)
  if (keywords.length === 0) return null
  const kwSet = new Set(keywords)
  const sameTokens = (term: string): boolean => {
    const tt = termTokens(term)
    return tt.length === kwSet.size && tt.every((t) => kwSet.has(t))
  }

  // Import dynamique : la base (seeds) n'est chargée qu'au besoin.
  const { searchKnowledgeBase, lookupBySlug } = await import('../../lib/knowledge/query')

  // 1) Tentative directe par slug (kebab des mots-clés) → couvre les termes à
  //    trait d'union comme « garde-corps » que l'index ne scinde pas.
  const direct = await lookupBySlug(keywords.join('-'))
  if (direct && isRelevant(direct, kwSet)) return direct

  // 2) Recherche large : plusieurs formes de requête (phrase, kebab, mots) —
  //    on prend la première qui produit au moins une fiche pertinente.
  const queries = [keywords.join(' '), keywords.join('-'), ...keywords]
  let relevant: { entry: KnowledgeEntry }[] = []
  for (const q of queries) {
    const hits = await searchKnowledgeBase(q, { limit: 5 })
    relevant = hits.filter((h) => isRelevant(h.entry, kwSet))
    if (relevant.length > 0) break
  }
  if (relevant.length === 0) return null

  // Préférence à la correspondance EXACTE (mêmes tokens que la requête) pour ne
  // pas répondre par une fiche plus longue mieux classée (ex. « hauteur de
  // garde-corps » au lieu de « garde-corps »).
  const exact = relevant.find((h) => sameTokens(h.entry.term))
  return (exact ?? relevant[0]).entry
}

export async function knowledgeAnswer(question: string): Promise<KnowledgeBridgeAnswer | null> {
  const e = await findRelevantEntry(question)
  if (!e) return null
  return { text: formatAnswer(e), slug: e.slug, term: e.term, confidence: e.confidence }
}
