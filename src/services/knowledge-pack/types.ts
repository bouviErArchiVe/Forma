/**
 * Types du pack de connaissance PDF (Part 10).
 *
 * Données importées depuis `public/knowledge-pack/part10/` vers Dexie — JAMAIS
 * embarquées dans le bundle JS (chargées par `fetch` à la demande). Trois
 * « gates » d'import gouvernent la visibilité et l'usage :
 *  - 'clean'      : affichable par défaut, citable, source visible.
 *  - 'review'     : affichable avec badge « À vérifier » + source obligatoire.
 *  - 'quarantine' : caché par défaut, jamais utilisé par FormAI/Search.
 */

export type ImportGate = 'clean' | 'review' | 'quarantine'

export const IMPORT_GATES: readonly ImportGate[] = ['clean', 'review', 'quarantine'] as const

export function isImportGate(v: unknown): v is ImportGate {
  return typeof v === 'string' && (IMPORT_GATES as readonly string[]).includes(v)
}

/** Source PDF (document + page) d'une entrée ou d'un chunk. */
export interface PackSource {
  document?: string
  page_start?: number
  page_end?: number
  section?: string
}

/** Entrée de dictionnaire/connaissance issue du pack PDF. */
export interface PackKnowledgeEntry {
  id: string
  title: string
  kind?: string
  summary?: string
  content?: string
  sourceDocument?: string
  sourcePage?: number
  source?: PackSource
  tags: string[]
  confidence?: number
  qualityStatus?: string
  importGate: ImportGate
  reviewFlags?: string[]
  formaWarnings?: string[]
  safeForDirectDictionaryDisplay?: boolean
  safeForDefaultRag?: boolean
  formaUsefulnessScore?: number
  formaUsefulnessLane?: string
}

/** Chunk de texte sourcé pour le RAG FormAI. */
export interface PackRagChunk {
  id: string
  document_name: string
  page_start?: number
  page_end?: number
  section?: string
  content: string
  source?: PackSource
  tags: string[]
  confidence?: number
  qualityStatus?: string
  importGate: ImportGate
  formaWarnings?: string[]
  safeForDefaultRag?: boolean
  formaUsefulnessScore?: number
}

/** Mot-clé pondéré de l'index de recherche léger. */
export interface PackSearchKeyword {
  keyword: string
  count: number
}

/** Index de recherche léger (forma_search_index_light.json). */
export interface PackSearchIndex {
  keywords: PackSearchKeyword[]
  tags: { tag: string; count: number }[]
  documents: string[]
  gates: Record<string, number>
}

/** Journal d'un import de pack (idempotence + traçabilité). */
export interface PackImportBatch {
  /** Clé d'idempotence = nom du pack. */
  packName: string
  /** Version (timestamp createdAt du manifeste). */
  version: string
  createdAt: string
  status: 'running' | 'completed' | 'failed'
  counts?: Record<string, number>
  checksum?: string
  error?: string
}

/** Manifeste offline du pack (public/knowledge-pack/part10/data/app/offline_manifest.json). */
export interface PackOfflineManifest {
  pack: string
  createdAt: string
  recommendedLoadOrder: string[]
  doNotLoadByDefault: string[]
  storageRecommendation: string
  counts: Record<string, number>
  /** Checksums SHA-256 par fichier (optionnel) — vérifiés à l'import si présents (#26). */
  checksums?: Record<string, string>
}
