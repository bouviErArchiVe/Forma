/**
 * Knowledge base FormAI — base documentaire persistée dans Dexie.
 *
 * Tables : db.aiKnowledgeDocs (documents) + db.aiKnowledgeChunks (fragments).
 * Recherche hybride : similarité cosinus sur embeddings (mock lexical
 * aujourd'hui, vrais modèles plus tard) + score lexical d'appoint sur les
 * termes de la requête. Conçue pour accueillir plus tard PDF, DOCX, TXT,
 * Markdown et OCR (Source.type), ainsi que le contenu des carnets Forma.
 */
import { db } from '../../db'
import { createId } from '../id'
import { createChunks, extractMetadata } from './chunking'
import { cosineSimilarity, getEmbeddingProvider, tokenize } from './embeddings'
import type {
  Citation,
  KnowledgeChunk,
  KnowledgeDocument,
  SearchResult,
  Source,
} from './types'

// ─── CRUD documents ──────────────────────────────────────────────────────────

export interface AddDocumentInput {
  title: string
  content: string
  source: Source
  metadata?: Record<string, string>
}

/** Découpe le contenu en chunks et calcule leurs embeddings. */
async function buildChunks(docId: string, content: string): Promise<KnowledgeChunk[]> {
  const chunks = createChunks(docId, content)
  if (chunks.length === 0) return chunks
  const provider = getEmbeddingProvider()
  const embeddings = await provider.embed(chunks.map((c) => c.text))
  return chunks.map((chunk, i) => ({ ...chunk, embedding: embeddings[i] }))
}

/** Ajoute un document : persiste doc + chunks (avec embeddings) en transaction. */
export async function addDocument(input: AddDocumentInput): Promise<KnowledgeDocument> {
  const now = Date.now()
  const id = createId()
  const chunks = await buildChunks(id, input.content)
  const doc: KnowledgeDocument = {
    id,
    title: input.title.trim() || 'Document sans titre',
    source: input.source,
    content: input.content,
    metadata: {
      ...extractMetadata(input.content, input.source),
      ...(input.metadata ?? {}),
    },
    addedAt: now,
    updatedAt: now,
    chunkCount: chunks.length,
  }
  await db.transaction('rw', db.aiKnowledgeDocs, db.aiKnowledgeChunks, async () => {
    await db.aiKnowledgeDocs.add(doc)
    if (chunks.length > 0) await db.aiKnowledgeChunks.bulkAdd(chunks)
  })
  return doc
}

/** Supprime un document et tous ses chunks. */
export async function removeDocument(id: string): Promise<void> {
  await db.transaction('rw', db.aiKnowledgeDocs, db.aiKnowledgeChunks, async () => {
    await db.aiKnowledgeChunks.where('docId').equals(id).delete()
    await db.aiKnowledgeDocs.delete(id)
  })
}

/** Met à jour un document ; si le contenu change, re-chunke et re-embedde. */
export async function updateDocument(
  id: string,
  patch: { title?: string; content?: string; metadata?: Record<string, string> },
): Promise<KnowledgeDocument | null> {
  const existing = await db.aiKnowledgeDocs.get(id)
  if (!existing) return null

  const contentChanged = patch.content !== undefined && patch.content !== existing.content
  const updated: KnowledgeDocument = {
    ...existing,
    title: patch.title !== undefined ? patch.title : existing.title,
    content: patch.content !== undefined ? patch.content : existing.content,
    metadata: patch.metadata !== undefined ? { ...existing.metadata, ...patch.metadata } : existing.metadata,
    updatedAt: Date.now(),
  }

  const newChunks = contentChanged ? await buildChunks(id, updated.content) : null
  if (newChunks) {
    updated.chunkCount = newChunks.length
    updated.metadata = {
      ...extractMetadata(updated.content, updated.source),
      ...(patch.metadata ?? {}),
    }
  }

  await db.transaction('rw', db.aiKnowledgeDocs, db.aiKnowledgeChunks, async () => {
    await db.aiKnowledgeDocs.put(updated)
    if (newChunks) {
      await db.aiKnowledgeChunks.where('docId').equals(id).delete()
      if (newChunks.length > 0) await db.aiKnowledgeChunks.bulkAdd(newChunks)
    }
  })
  return updated
}

/** Documents triés du plus récent au plus ancien. */
export async function listDocuments(): Promise<KnowledgeDocument[]> {
  return db.aiKnowledgeDocs.orderBy('addedAt').reverse().toArray()
}

/** Sources distinctes (type + label) présentes dans la base. */
export async function getSources(): Promise<Source[]> {
  const docs = await listDocuments()
  const seen = new Set<string>()
  const sources: Source[] = []
  for (const doc of docs) {
    const key = `${doc.source.type}::${doc.source.label}`
    if (!seen.has(key)) {
      seen.add(key)
      sources.push(doc.source)
    }
  }
  return sources
}

/** Vide entièrement la base documentaire (tests / réinitialisation). */
export async function clearKnowledgeBase(): Promise<void> {
  await db.transaction('rw', db.aiKnowledgeDocs, db.aiKnowledgeChunks, async () => {
    await db.aiKnowledgeChunks.clear()
    await db.aiKnowledgeDocs.clear()
  })
}

// ─── Recherche ───────────────────────────────────────────────────────────────

/** Score lexical d'appoint : proportion de termes de la requête présents. */
function lexicalScore(queryTerms: string[], text: string): number {
  if (queryTerms.length === 0) return 0
  const lower = text.toLowerCase()
  let hits = 0
  for (const term of queryTerms) {
    if (lower.includes(term)) hits++
  }
  return hits / queryTerms.length
}

/**
 * Recherche dans la base : embedding de la requête + cosinus sur chaque chunk,
 * combiné à un score lexical (60 % sémantique / 40 % lexical). Retourne les
 * meilleurs résultats avec leur document joint, score dans [0, 1].
 */
export async function searchDocuments(
  query: string,
  opts: { limit?: number } = {},
): Promise<SearchResult[]> {
  const trimmed = query.trim()
  if (trimmed === '') return []
  const limit = opts.limit ?? 6

  const [chunks, docs] = await Promise.all([
    db.aiKnowledgeChunks.toArray(),
    db.aiKnowledgeDocs.toArray(),
  ])
  if (chunks.length === 0) return []
  const docById = new Map(docs.map((d) => [d.id, d]))

  const provider = getEmbeddingProvider()
  const [queryEmbedding] = await provider.embed([trimmed])
  const queryVector = queryEmbedding?.vector ?? []
  const queryTerms = tokenize(trimmed)

  const results: SearchResult[] = []
  for (const chunk of chunks) {
    const doc = docById.get(chunk.docId)
    if (!doc) continue
    const semantic = chunk.embedding ? cosineSimilarity(queryVector, chunk.embedding.vector) : 0
    const lexical = lexicalScore(queryTerms, chunk.text)
    const score = Math.max(0, Math.min(1, 0.6 * semantic + 0.4 * lexical))
    if (score > 0) results.push({ chunk, doc, score })
  }

  return rankResults(results).slice(0, limit)
}

/**
 * Trie par score décroissant et limite la sur-représentation d'un même
 * document (au plus 2 chunks par doc, le meilleur d'abord).
 */
export function rankResults(results: SearchResult[]): SearchResult[] {
  const sorted = [...results].sort((a, b) => b.score - a.score)
  const perDoc = new Map<string, number>()
  const ranked: SearchResult[] = []
  for (const r of sorted) {
    const count = perDoc.get(r.doc.id) ?? 0
    if (count >= 2) continue
    perDoc.set(r.doc.id, count + 1)
    ranked.push(r)
  }
  return ranked
}

/** Construit des citations affichables (snippet ≤ 200 chars). */
export function buildCitations(results: SearchResult[]): Citation[] {
  return results.map((r) => {
    const text = r.chunk.text.replace(/\s+/g, ' ').trim()
    const snippet = text.length > 200 ? `${text.slice(0, 197)}…` : text
    return {
      docId: r.doc.id,
      docTitle: r.doc.title,
      chunkId: r.chunk.id,
      snippet,
      score: r.score,
    }
  })
}

/**
 * Bloc de contexte documentaire prêt à injecter dans un prompt système.
 * Retourne '' si la base est vide ou si rien n'est pertinent.
 */
export async function buildRagContext(
  query: string,
  opts: { limit?: number } = {},
): Promise<{ context: string; citations: Citation[] }> {
  const results = await searchDocuments(query, opts)
  if (results.length === 0) return { context: '', citations: [] }
  const citations = buildCitations(results)
  const lines = citations.map((c) => `— [${c.docTitle}] ${c.snippet}`)
  return {
    context: `[DOCUMENTS]\nExtraits de la base documentaire de l'utilisateur (cite le titre du document quand tu t'en sers) :\n${lines.join('\n')}`,
    citations,
  }
}
