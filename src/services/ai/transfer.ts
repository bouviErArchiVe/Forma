/**
 * FormAI — export / import JSON des données IA.
 *
 * Couvre les 4 tables FormAI : conversations, mémoire locale, base
 * documentaire (documents + chunks). L'import est défensif : version et
 * structure vérifiées, entrées invalides ignorées silencieusement (jamais
 * de throw sur un JSON malformé), upsert via `db.put`.
 */

import { db } from '../../db'
import type { KnowledgeChunk, KnowledgeDocument } from '../../lib/rag/types'
import type {
  AIConversation,
  AIMemoryEntry,
  AIMemorySource,
  StoredChatMessage,
} from './types'

/** Version du format d'export FormAI. */
export const FORMAI_EXPORT_VERSION = 1

/** Structure du fichier d'export FormAI. */
export interface FormAIExport {
  version: number
  exportedAt: number
  conversations: AIConversation[]
  memories: AIMemoryEntry[]
  knowledgeDocs: KnowledgeDocument[]
  knowledgeChunks: KnowledgeChunk[]
}

export interface ImportFormAIResult {
  conversations: number
  memories: number
  /** Documents de la base documentaire importés. */
  documents: number
}

// ─── Export ──────────────────────────────────────────────────────────────────

/** Exporte les 4 tables FormAI dans un Blob JSON. */
export async function exportFormAIData(): Promise<Blob> {
  const payload: FormAIExport = {
    version: FORMAI_EXPORT_VERSION,
    exportedAt: Date.now(),
    conversations: await db.aiConversations.toArray(),
    memories: await db.aiMemory.toArray(),
    knowledgeDocs: await db.aiKnowledgeDocs.toArray(),
    knowledgeChunks: await db.aiKnowledgeChunks.toArray(),
  }
  return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
}

/** Déclenche le téléchargement de l'export FormAI (formai-export-YYYY-MM-DD.json). */
export async function downloadFormAIExport(): Promise<void> {
  const blob = await exportFormAIData()
  const filename = `formai-export-${new Date().toISOString().slice(0, 10)}.json`
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Validation défensive ────────────────────────────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

/** Valide et normalise un message persisté ; null si invalide. */
function sanitizeMessage(value: unknown): StoredChatMessage | null {
  if (!isRecord(value)) return null
  const { id, role, content, ts } = value
  if (!isString(id) || !id) return null
  if (role !== 'user' && role !== 'assistant') return null
  if (!isString(content)) return null
  if (!isNumber(ts)) return null
  const message: StoredChatMessage = { id, role, content, ts }
  if (isString(value.agentId)) message.agentId = value.agentId
  if (isString(value.providerId)) message.providerId = value.providerId
  if (isString(value.error)) message.error = value.error
  if (Array.isArray(value.memoryUsed) && value.memoryUsed.every(isString)) {
    message.memoryUsed = value.memoryUsed
  }
  return message
}

/** Valide et normalise une conversation ; null si invalide. */
function sanitizeConversation(value: unknown): AIConversation | null {
  if (!isRecord(value)) return null
  const { id, title, createdAt, updatedAt } = value
  if (!isString(id) || !id) return null
  if (!isString(title)) return null
  if (!isNumber(createdAt) || !isNumber(updatedAt)) return null
  if (!Array.isArray(value.messages)) return null
  // Les messages invalides sont écartés sans invalider la conversation.
  const messages = value.messages
    .map(sanitizeMessage)
    .filter((m): m is StoredChatMessage => m !== null)
  return {
    id,
    title,
    agentId: isString(value.agentId) && value.agentId ? value.agentId : 'general',
    messages,
    createdAt,
    updatedAt,
    favorite: value.favorite === true,
    archived: value.archived === true,
  }
}

const MEMORY_SOURCES: AIMemorySource[] = ['manual', 'message', 'auto']

/** Valide et normalise une entrée mémoire ; null si invalide. */
function sanitizeMemory(value: unknown): AIMemoryEntry | null {
  if (!isRecord(value)) return null
  const { id, content, createdAt } = value
  if (!isString(id) || !id) return null
  if (!isString(content) || !content) return null
  if (!isNumber(createdAt)) return null
  const tags =
    Array.isArray(value.tags) && value.tags.every(isString) ? value.tags : []
  const source = MEMORY_SOURCES.includes(value.source as AIMemorySource)
    ? (value.source as AIMemorySource)
    : 'manual'
  return {
    id,
    content,
    tags,
    createdAt,
    importance: isNumber(value.importance) ? value.importance : 1,
    source,
  }
}

/** Valide et normalise un document de la base documentaire ; null si invalide. */
function sanitizeKnowledgeDoc(value: unknown): KnowledgeDocument | null {
  if (!isRecord(value)) return null
  const { id, title, content } = value
  if (!isString(id) || !id) return null
  if (!isString(title)) return null
  if (!isString(content)) return null
  const rawSource = isRecord(value.source) ? value.source : null
  if (!rawSource || !isString(rawSource.type) || !isString(rawSource.label)) return null
  const source: KnowledgeDocument['source'] = {
    type: rawSource.type as KnowledgeDocument['source']['type'],
    label: rawSource.label,
    ...(isString(rawSource.ref) ? { ref: rawSource.ref } : {}),
  }
  const metadata: Record<string, string> = {}
  if (isRecord(value.metadata)) {
    for (const [k, v] of Object.entries(value.metadata)) {
      if (isString(v)) metadata[k] = v
    }
  }
  return {
    id,
    title,
    content,
    source,
    metadata,
    addedAt: isNumber(value.addedAt) ? value.addedAt : Date.now(),
    updatedAt: isNumber(value.updatedAt) ? value.updatedAt : Date.now(),
    chunkCount: isNumber(value.chunkCount) ? value.chunkCount : 0,
  }
}

/** Valide et normalise un chunk documentaire ; null si invalide. */
function sanitizeKnowledgeChunk(value: unknown): KnowledgeChunk | null {
  if (!isRecord(value)) return null
  const { id, docId, text, index } = value
  if (!isString(id) || !id) return null
  if (!isString(docId) || !docId) return null
  if (!isString(text)) return null
  if (!isNumber(index)) return null
  const chunk: KnowledgeChunk = { id, docId, index, text }
  if (
    isRecord(value.embedding) &&
    isString(value.embedding.model) &&
    Array.isArray(value.embedding.vector) &&
    value.embedding.vector.every(isNumber)
  ) {
    chunk.embedding = { model: value.embedding.model, vector: value.embedding.vector }
  }
  return chunk
}

// ─── Import ──────────────────────────────────────────────────────────────────

/**
 * Importe un export FormAI (upsert via `db.put`).
 * Ne throw jamais : JSON invalide, version inconnue ou structure inattendue
 * produisent simplement des comptes à zéro ; les entrées invalides sont
 * ignorées individuellement.
 */
export async function importFormAIData(json: string): Promise<ImportFormAIResult> {
  const result: ImportFormAIResult = { conversations: 0, memories: 0, documents: 0 }

  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return result
  }
  if (!isRecord(parsed)) return result
  if (parsed.version !== FORMAI_EXPORT_VERSION) return result

  const conversations = asArray(parsed.conversations)
    .map(sanitizeConversation)
    .filter((c): c is AIConversation => c !== null)
  const memories = asArray(parsed.memories)
    .map(sanitizeMemory)
    .filter((m): m is AIMemoryEntry => m !== null)
  const docs = asArray(parsed.knowledgeDocs)
    .map(sanitizeKnowledgeDoc)
    .filter((d): d is KnowledgeDocument => d !== null)
  const chunks = asArray(parsed.knowledgeChunks)
    .map(sanitizeKnowledgeChunk)
    .filter((c): c is KnowledgeChunk => c !== null)

  await db.transaction(
    'rw',
    [db.aiConversations, db.aiMemory, db.aiKnowledgeDocs, db.aiKnowledgeChunks],
    async () => {
      if (conversations.length) await db.aiConversations.bulkPut(conversations)
      if (memories.length) await db.aiMemory.bulkPut(memories)
      if (docs.length) await db.aiKnowledgeDocs.bulkPut(docs)
      if (chunks.length) await db.aiKnowledgeChunks.bulkPut(chunks)
    },
  )

  result.conversations = conversations.length
  result.memories = memories.length
  result.documents = docs.length
  return result
}
