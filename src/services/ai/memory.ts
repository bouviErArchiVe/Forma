/**
 * FormAI — mémoire locale (table Dexie `aiMemory`).
 *
 * Petite mémoire persistante inspirée des systèmes à scoring lexical :
 * chaque entrée a un contenu, des tags et un poids d'importance. La
 * récupération (`getRelevantMemories`) score les entrées contre la requête
 * et ne retourne que celles ayant au moins un recoupement lexical.
 */

import { db } from '../../db'
import { createId } from '../../lib/id'
import type { AIMemoryEntry, AIMemorySource } from './types'

/** Longueur max du contenu d'une entrée mémoire. */
export const MEMORY_CONTENT_MAX_LENGTH = 500

/** Score ajouté par terme de la requête trouvé dans le contenu. */
const SCORE_PER_TERM = 2

/** Plafond du score lexical contenu (3 termes max comptabilisés). */
const MAX_TERM_SCORE = 6

/** Score ajouté par tag présent dans la requête. */
const SCORE_PER_TAG = 1

/** Longueur minimale d'un terme de requête (écarte articles/liaisons). */
const MIN_TERM_LENGTH = 3

export interface AddMemoryOptions {
  tags?: string[]
  /** Poids de pertinence (1 = normal). */
  importance?: number
  source?: AIMemorySource
}

/** Ajoute une entrée mémoire (contenu tronqué à 500 caractères). */
export async function addMemory(
  content: string,
  opts: AddMemoryOptions = {},
): Promise<AIMemoryEntry> {
  const entry: AIMemoryEntry = {
    id: createId(),
    content: content.trim().slice(0, MEMORY_CONTENT_MAX_LENGTH),
    tags: opts.tags ?? [],
    createdAt: Date.now(),
    importance: opts.importance ?? 1,
    source: opts.source ?? 'manual',
  }
  await db.aiMemory.add(entry)
  return entry
}

/** Liste toutes les entrées mémoire, plus récentes en premier. */
export async function listMemories(): Promise<AIMemoryEntry[]> {
  return db.aiMemory.orderBy('createdAt').reverse().toArray()
}

/** Supprime une entrée mémoire. */
export async function deleteMemory(id: string): Promise<void> {
  await db.aiMemory.delete(id)
}

/** Vide entièrement la mémoire locale. */
export async function clearMemories(): Promise<void> {
  await db.aiMemory.clear()
}

/** Découpe la requête en termes lexicaux exploitables (minuscules, ≥ 3 chars). */
function extractTerms(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length >= MIN_TERM_LENGTH)
}

/**
 * Score d'une entrée contre la requête :
 *   +2 par terme de la requête présent dans le contenu (plafonné à +6),
 *   +1 par tag de l'entrée présent dans la requête,
 *   + importance de l'entrée.
 * Retourne aussi le score lexical seul pour exclure les entrées sans match.
 */
function scoreMemory(
  entry: AIMemoryEntry,
  queryLower: string,
  terms: string[],
): { score: number; lexicalScore: number } {
  const contentLower = entry.content.toLowerCase()

  let termScore = 0
  for (const term of terms) {
    if (contentLower.includes(term)) termScore += SCORE_PER_TERM
    if (termScore >= MAX_TERM_SCORE) {
      termScore = MAX_TERM_SCORE
      break
    }
  }

  let tagScore = 0
  for (const tag of entry.tags) {
    const tagLower = tag.trim().toLowerCase()
    if (tagLower && queryLower.includes(tagLower)) tagScore += SCORE_PER_TAG
  }

  const lexicalScore = termScore + tagScore
  return { score: lexicalScore + entry.importance, lexicalScore }
}

/** Formate une entrée pour injection dans un prompt : `[MEM:tag1,tag2] contenu`. */
function formatMemory(entry: AIMemoryEntry): string {
  const prefix = entry.tags.length ? `[MEM:${entry.tags.join(',')}]` : '[MEM]'
  return `${prefix} ${entry.content}`
}

/**
 * Retourne les entrées mémoire pertinentes pour la requête, formatées et
 * triées par score décroissant. Seules les entrées avec au moins un match
 * lexical (terme ou tag) sont retenues — l'importance seule ne suffit pas.
 */
export async function getRelevantMemories(query: string, limit = 5): Promise<string[]> {
  const queryLower = query.toLowerCase()
  const terms = extractTerms(query)
  const entries = await db.aiMemory.toArray()

  return entries
    .map((entry) => ({ entry, ...scoreMemory(entry, queryLower, terms) }))
    .filter((scored) => scored.lexicalScore > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((scored) => formatMemory(scored.entry))
}

/**
 * Construit le bloc mémoire prêt à injecter dans un prompt système.
 * Retourne '' si aucune entrée pertinente.
 */
export async function buildMemoryContext(query: string, limit?: number): Promise<string> {
  const memories = await getRelevantMemories(query, limit)
  if (!memories.length) return ''
  return `[MÉMOIRE LOCALE]\n${memories.join('\n')}`
}
