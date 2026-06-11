/**
 * RAG — types de la base documentaire FormAI.
 *
 * Architecture prête pour de vrais embeddings (OpenAI, Voyage, BGE, Nomic…)
 * même si l'implémentation initiale est lexicale (mockée). Les interfaces
 * sont la source de vérité ; les implémentations vivent dans :
 *   - src/lib/rag/chunking.ts        (découpage en chunks)
 *   - src/lib/rag/embeddings.ts      (providers d'embeddings)
 *   - src/lib/rag/knowledge-base.ts  (API base documentaire, Dexie)
 */

// ─── Documents ───────────────────────────────────────────────────────────────

export type KnowledgeSourceType =
  | 'manual'      // texte saisi/collé par l'utilisateur
  | 'markdown'
  | 'txt'
  | 'pdf'         // futur : extraction via pdf-text existant
  | 'docx'        // futur
  | 'ocr'         // futur : images OCR via tesseract existant
  | 'notebook'    // futur : contenu d'un carnet Forma (Library)

/** Métadonnées d'origine d'un document. */
export interface Source {
  type: KnowledgeSourceType
  /** Nom de fichier, titre de carnet ou libellé saisi. */
  label: string
  /** Référence externe éventuelle (notebookId, URL…). */
  ref?: string
}

/** Document persisté dans la base documentaire (table aiKnowledgeDocs). */
export interface KnowledgeDocument {
  id: string
  title: string
  source: Source
  /** Texte intégral (les chunks sont stockés séparément). */
  content: string
  /** Métadonnées extraites (auteur, pages, langue…). */
  metadata: Record<string, string>
  addedAt: number
  updatedAt: number
  chunkCount: number
}

/** Alias sémantique — un Document au sens RAG est un KnowledgeDocument. */
export type Document = KnowledgeDocument

// ─── Chunks & embeddings ─────────────────────────────────────────────────────

/** Fragment indexable d'un document (table aiKnowledgeChunks). */
export interface KnowledgeChunk {
  id: string
  docId: string
  /** Position du chunk dans le document (0-based). */
  index: number
  text: string
  /** Vecteur d'embedding — absent tant que non calculé. */
  embedding?: Embedding
}

export type Chunk = KnowledgeChunk

/** Vecteur d'embedding + provenance du modèle. */
export interface Embedding {
  /** Identifiant du modèle ('mock-lexical', 'text-embedding-3-small'…). */
  model: string
  vector: number[]
}

/** Provider d'embeddings — interchangeable (mock lexical, OpenAI, Voyage…). */
export interface EmbeddingProvider {
  model: string
  embed(texts: string[]): Promise<Embedding[]>
}

// ─── Recherche & citations ───────────────────────────────────────────────────

export interface SearchResult {
  chunk: KnowledgeChunk
  doc: KnowledgeDocument
  /** Score de pertinence normalisé [0, 1]. */
  score: number
}

/** Citation prête à afficher / injecter dans un prompt. */
export interface Citation {
  docId: string
  docTitle: string
  chunkId: string
  snippet: string
  score: number
}
