/**
 * RAG — providers d'embeddings.
 *
 * Implémentation initiale 100 % locale : MockEmbeddingProvider produit un
 * embedding lexical déterministe (bag-of-words hashé dans un vecteur de
 * dimension fixe, normalisé L2). Suffisant pour une similarité cosinus
 * crédible sans appel réseau ; interchangeable avec un vrai provider
 * (OpenAI, Voyage, BGE, Nomic…) via getEmbeddingProvider().
 */

import type { Embedding, EmbeddingProvider } from './types'

/** Dimension des vecteurs du provider mock (compromis précision/poids Dexie). */
export const EMBEDDING_DIMENSION = 256

/**
 * Tokenise un texte : minuscules, accents retirés, tokens alphanumériques.
 * Les tokens d'un seul caractère sont ignorés (bruit : « l' », « d' »…).
 */
export function tokenize(text: string): string[] {
  const matches = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // retire les diacritiques (é → e)
    .match(/[a-z0-9]+/g)
  return (matches ?? []).filter((t) => t.length >= 2)
}

/** Hash FNV-1a 32 bits — déterministe et bien réparti pour des tokens courts. */
function hashToken(token: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/**
 * Embedding lexical : chaque token est hashé vers une composante du vecteur
 * (hashing trick). Les fréquences sont amorties en racine carrée pour limiter
 * le poids des mots très répétés, puis le vecteur est normalisé L2.
 * Texte vide → vecteur nul.
 */
function embedText(text: string): number[] {
  const vector = new Array<number>(EMBEDDING_DIMENSION).fill(0)
  const counts = new Map<string, number>()
  for (const token of tokenize(text)) {
    counts.set(token, (counts.get(token) ?? 0) + 1)
  }
  for (const [token, count] of counts) {
    const slot = hashToken(token) % EMBEDDING_DIMENSION
    vector[slot] = (vector[slot] ?? 0) + Math.sqrt(count)
  }
  // Normalisation L2 — la similarité cosinus devient un simple produit scalaire.
  let normSq = 0
  for (const v of vector) normSq += v * v
  const norm = Math.sqrt(normSq)
  if (norm > 0) {
    for (let i = 0; i < vector.length; i++) vector[i] = (vector[i] ?? 0) / norm
  }
  return vector
}

/**
 * Provider mock : embeddings lexicaux déterministes, sans réseau.
 * Deux textes identiques produisent toujours le même vecteur.
 */
export class MockEmbeddingProvider implements EmbeddingProvider {
  readonly model: string = 'mock-lexical'

  embed(texts: string[]): Promise<Embedding[]> {
    return Promise.resolve(
      texts.map((text) => ({ model: this.model, vector: embedText(text) })),
    )
  }
}

/**
 * Similarité cosinus entre deux vecteurs. Retourne 0 si l'un des vecteurs
 * est nul. Si les dimensions diffèrent, seul le préfixe commun est comparé.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length)
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < len; i++) {
    const ai = a[i] ?? 0
    const bi = b[i] ?? 0
    dot += ai * bi
    normA += ai * ai
    normB += bi * bi
  }
  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

/** Identifiants de providers connus (un seul implémenté aujourd'hui). */
export type EmbeddingProviderId = 'mock-lexical'
// | 'openai-text-embedding-3-small'
// | 'voyage-3-lite'
// | 'bge-m3'
// | 'nomic-embed-text'

/** Instance partagée du mock (stateless, réutilisable). */
let mockInstance: MockEmbeddingProvider | null = null

/**
 * Retourne le provider d'embeddings actif.
 *
 * TODO(FormAI v2) : brancher de vrais providers distants ou locaux —
 * OpenAI text-embedding-3-small, Voyage, BGE, Nomic (ONNX/WebGPU) — en
 * ajoutant leurs cas au switch ci-dessous et en lisant l'id depuis les
 * réglages utilisateur (db.settings). Les chunks stockent le `model` de
 * leur embedding : une migration de re-embedding sera nécessaire au
 * changement de provider.
 */
export function getEmbeddingProvider(id: EmbeddingProviderId = 'mock-lexical'): EmbeddingProvider {
  switch (id) {
    case 'mock-lexical':
    default:
      if (!mockInstance) mockInstance = new MockEmbeddingProvider()
      return mockInstance
  }
}
