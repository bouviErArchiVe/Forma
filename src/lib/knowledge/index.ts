/**
 * Knowledge Core — point d'entrée public (V1).
 *
 * API stable et **en lecture seule** destinée aux lanes Study (C), FormAI (D)
 * et Search (E). Tout ce qui est exporté ici est extractif et sourcé : aucune
 * entrée sans `sources` ni `confidence`, jamais de fait inventé.
 *
 * @example
 *   import { answerKnowledgeBase, entryDefinition } from '@/lib/knowledge'
 *   const res = await answerKnowledgeBase('linteau')
 *   if (res.found) console.log(entryDefinition(res.entry), res.entry.sources[0]?.label)
 *   else console.log('Terme inconnu — aucune définition fabriquée')
 */

// Modèle
export type {
  KnowledgeEntry,
  KnowledgeConfidence,
  KnowledgeEntryType,
  KnowledgeLanguage,
  KnowledgeSource,
  KnowledgeSourceType,
} from './model'
export {
  KNOWLEDGE_CONFIDENCE_LEVELS,
  KNOWLEDGE_CONFIDENCE_LABEL,
  KNOWLEDGE_ENTRY_TYPES,
  isKnowledgeConfidence,
  isKnowledgeEntryType,
  hasUsableSource,
  isValidKnowledgeEntry,
  validateKnowledgeEntry,
  normalizeKnowledgeEntry,
  makeKnowledgeEntry,
  entryDefinition,
  entrySourceLabel,
} from './model'

// Loader paresseux des seeds (≈ 920 entrées, hors bundle principal)
export {
  loadKnowledgeBase,
  __resetKnowledgeCache,
} from './load'

// Index de recherche
export type {
  KnowledgeSearchIndex,
  KnowledgeSearchHit,
  KnowledgeSearchOptions,
  IndexedField,
} from './search-index'
export { buildSearchIndex } from './search-index'

// Requêtes de haut niveau sur la base chargée
export type { KnowledgeBaseAnswer } from './query'
export {
  getKnowledgeIndex,
  __resetKnowledgeIndex,
  allKnowledgeEntries,
  lookupBySlug,
  lookupById,
  searchKnowledgeBase,
  answerKnowledgeBase,
} from './query'

// Search-intent
export type {
  KnowledgeIntent,
  KnowledgeIntentKind,
} from './search-intent'
export {
  parseSearchIntent,
  normalizeKnowledgeQuery,
  extractKeywords,
} from './search-intent'

// Providers (extractifs, locaux — glossaire d'architecture)
export type {
  KnowledgeProvider,
  KnowledgeAnswer,
} from './providers'
export {
  KNOWLEDGE_PROVIDERS,
  architectureGlossaryProvider,
  glossaryEntryToKnowledge,
  scoreEntries,
  lookupKnowledge,
  searchKnowledge,
  allKnowledge,
  answerKnowledge,
} from './providers'
