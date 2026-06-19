/**
 * Knowledge Core — point d'entrée public (V1).
 *
 * API stable et **en lecture seule** destinée aux lanes Study (C) et FormAI
 * (D). Tout ce qui est exporté ici est extractif et sourcé : aucune entrée
 * sans `source` ni `confidence`, jamais de fait inventé.
 *
 * @example
 *   import { answerKnowledge, type KnowledgeEntry } from '@/lib/knowledge'
 *   const res = answerKnowledge('linteau')
 *   if (res.found) console.log(res.entry.definition, res.entry.source)
 *   else console.log('Terme inconnu — aucune définition fabriquée')
 */

// Modèle
export type {
  KnowledgeEntry,
  KnowledgeConfidence,
} from './model'
export {
  KNOWLEDGE_CONFIDENCE_LEVELS,
  KNOWLEDGE_CONFIDENCE_LABEL,
  isKnowledgeConfidence,
  isValidKnowledgeEntry,
  validateKnowledgeEntry,
  makeKnowledgeEntry,
} from './model'

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

// Providers (extractifs, locaux)
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
