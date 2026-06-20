/**
 * Knowledge Core — requêtes de haut niveau sur la base chargée.
 *
 * Combine le loader paresseux (`load.ts`) et l'index de recherche
 * (`search-index.ts`) pour offrir une API simple et honnête :
 *  - `lookupBySlug` / `lookupById` : consultation directe.
 *  - `searchKnowledgeBase` : recherche large, classée par pertinence.
 *  - `allKnowledgeEntries` : toutes les entrées (déjà validées/triées).
 *  - `answerKnowledgeBase` : réponse honnête — `{found:false, reason:'unknown'}`
 *    quand le terme est inconnu (jamais de définition fabriquée).
 *
 * L'index est construit une seule fois (mémoïsé) après le premier chargement.
 */
import { loadKnowledgeBase } from './load'
import {
  buildSearchIndex,
  type KnowledgeSearchHit,
  type KnowledgeSearchIndex,
  type KnowledgeSearchOptions,
} from './search-index'
import type { KnowledgeEntry } from './model'

let indexPromise: Promise<KnowledgeSearchIndex> | null = null

/** Obtient l'index de recherche (construit une fois après le chargement). */
export async function getKnowledgeIndex(): Promise<KnowledgeSearchIndex> {
  if (indexPromise === null) {
    indexPromise = loadKnowledgeBase().then((entries) => buildSearchIndex(entries))
  }
  return indexPromise
}

/** Réinitialise l'index mémoïsé (tests uniquement). */
export function __resetKnowledgeIndex(): void {
  indexPromise = null
}

/** Toutes les entrées de la base (validées, dédoublonnées, triées). */
export async function allKnowledgeEntries(): Promise<readonly KnowledgeEntry[]> {
  return (await getKnowledgeIndex()).entries
}

/** Consultation par slug. `undefined` si inconnu (honnête). */
export async function lookupBySlug(slug: string): Promise<KnowledgeEntry | undefined> {
  return (await getKnowledgeIndex()).bySlug(slug)
}

/** Consultation par id. `undefined` si inconnu (honnête). */
export async function lookupById(id: string): Promise<KnowledgeEntry | undefined> {
  return (await getKnowledgeIndex()).byId(id)
}

/** Recherche large classée par pertinence. Requête vide → []. */
export async function searchKnowledgeBase(
  query: string,
  opts?: KnowledgeSearchOptions,
): Promise<KnowledgeSearchHit[]> {
  return (await getKnowledgeIndex()).search(query, opts)
}

/**
 * Réponse honnête à une demande de connaissance issue de la base chargée.
 *
 * Tente d'abord un lookup exact (slug ou terme normalisé), puis le meilleur
 * résultat de recherche. Si rien ne correspond, renvoie explicitement
 * `{ found: false, reason: 'unknown' }` — JAMAIS de définition fabriquée.
 */
export type KnowledgeBaseAnswer =
  | { found: true; entry: KnowledgeEntry }
  | { found: false; term: string; reason: 'unknown' }

export async function answerKnowledgeBase(term: string): Promise<KnowledgeBaseAnswer> {
  const index = await getKnowledgeIndex()
  const direct = index.bySlug(term)
  if (direct) return { found: true, entry: direct }

  const hits = index.search(term, { limit: 1 })
  if (hits.length > 0) return { found: true, entry: hits[0].entry }

  return { found: false, term, reason: 'unknown' }
}
