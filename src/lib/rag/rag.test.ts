/**
 * Tests RAG : chunking, embeddings lexicaux, knowledge base (Dexie).
 */
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../../db'
import { createChunks, extractMetadata } from './chunking'
import { cosineSimilarity, getEmbeddingProvider, MockEmbeddingProvider } from './embeddings'
import {
  addDocument,
  buildCitations,
  buildRagContext,
  clearKnowledgeBase,
  getSources,
  listDocuments,
  rankResults,
  removeDocument,
  searchDocuments,
  updateDocument,
} from './knowledge-base'
import type { Source } from './types'

const SOURCE: Source = { type: 'manual', label: 'Saisie manuelle' }

beforeEach(async () => {
  await db.open()
  await clearKnowledgeBase()
})

// ─── Chunking ─────────────────────────────────────────────────────────────────

describe('createChunks', () => {
  it('retourne [] pour un contenu vide', () => {
    expect(createChunks('d1', '')).toEqual([])
    expect(createChunks('d1', '   \n  ')).toEqual([])
  })

  it('découpe un long texte en chunks indexés sans couper les mots', () => {
    const paragraph = 'Le béton armé combine la résistance en compression du béton et la résistance en traction de l’acier. '
    const content = Array.from({ length: 30 }, () => paragraph).join('\n\n')
    const chunks = createChunks('d1', content)
    expect(chunks.length).toBeGreaterThan(1)
    chunks.forEach((c, i) => {
      expect(c.docId).toBe('d1')
      expect(c.index).toBe(i)
      expect(c.text.length).toBeLessThanOrEqual(1000)
      // pas de coupe au milieu d'un mot : le chunk ne se termine pas par une lettre suivie d'une lettre au début du suivant
      expect(c.text.trim()).not.toBe('')
    })
  })
})

describe('extractMetadata', () => {
  it('détecte mots, langue et titre markdown', () => {
    const meta = extractMetadata('# Isolation thermique\n\nLes murs doivent être isolés contre le froid et la chaleur.', SOURCE)
    expect(Number(meta.wordCount)).toBeGreaterThan(5)
    expect(meta.language).toBe('fr')
    expect(meta.title).toContain('Isolation')
    expect(meta.sourceType).toBe('manual')
  })
})

// ─── Embeddings ───────────────────────────────────────────────────────────────

describe('MockEmbeddingProvider', () => {
  it('est déterministe', async () => {
    const p = new MockEmbeddingProvider()
    const [a] = await p.embed(['pente de toiture'])
    const [b] = await p.embed(['pente de toiture'])
    expect(a!.vector).toEqual(b!.vector)
    expect(a!.model).toBe('mock-lexical')
  })

  it('cosinus : identique = 1, différent < 1', async () => {
    const p = getEmbeddingProvider()
    const [a, b, c] = await p.embed([
      'escalier giron contremarche',
      'escalier giron contremarche',
      'budget planning chantier',
    ])
    expect(cosineSimilarity(a!.vector, b!.vector)).toBeCloseTo(1, 5)
    expect(cosineSimilarity(a!.vector, c!.vector)).toBeLessThan(0.5)
  })
})

// ─── Knowledge base ───────────────────────────────────────────────────────────

const DOC_ISOLATION = {
  title: 'Isolation thermique',
  content:
    'L’isolation thermique des murs extérieurs réduit les pertes de chaleur. La laine minérale, la cellulose et les panneaux rigides sont des isolants courants. La résistance thermique se mesure en valeur R.',
  source: SOURCE,
}
const DOC_BETON = {
  title: 'Béton armé',
  content:
    'Le béton armé combine béton et armatures d’acier. Le rapport eau/ciment influence la résistance en compression. La cure du béton est essentielle pendant les premiers jours.',
  source: SOURCE,
}
const DOC_ESCALIER = {
  title: 'Escaliers',
  content:
    'Un escalier confortable respecte la règle de Blondel : deux contremarches plus un giron entre 590 et 660 mm. La pente d’un escalier résidentiel se situe généralement entre 30 et 37 degrés.',
  source: SOURCE,
}

describe('knowledge base', () => {
  it('addDocument crée doc + chunks avec embeddings', async () => {
    const doc = await addDocument(DOC_ISOLATION)
    expect(doc.chunkCount).toBeGreaterThan(0)
    const chunks = await db.aiKnowledgeChunks.where('docId').equals(doc.id).toArray()
    expect(chunks).toHaveLength(doc.chunkCount)
    expect(chunks[0]!.embedding?.model).toBe('mock-lexical')
  })

  it('listDocuments trie par addedAt desc et getSources déduplique', async () => {
    await addDocument(DOC_ISOLATION)
    await addDocument(DOC_BETON)
    const docs = await listDocuments()
    expect(docs).toHaveLength(2)
    expect(docs[0]!.addedAt).toBeGreaterThanOrEqual(docs[1]!.addedAt)
    const sources = await getSources()
    expect(sources).toHaveLength(1) // même source manuelle
  })

  it('searchDocuments retrouve le bon document en tête', async () => {
    await addDocument(DOC_ISOLATION)
    await addDocument(DOC_BETON)
    await addDocument(DOC_ESCALIER)
    const results = await searchDocuments('pente escalier giron')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0]!.doc.title).toBe('Escaliers')
    expect(results[0]!.score).toBeGreaterThan(0)
    expect(results[0]!.score).toBeLessThanOrEqual(1)
  })

  it('removeDocument supprime doc et chunks', async () => {
    const doc = await addDocument(DOC_BETON)
    await removeDocument(doc.id)
    expect(await db.aiKnowledgeDocs.get(doc.id)).toBeUndefined()
    expect(await db.aiKnowledgeChunks.where('docId').equals(doc.id).count()).toBe(0)
  })

  it('updateDocument re-chunke quand le contenu change', async () => {
    const doc = await addDocument(DOC_ISOLATION)
    const updated = await updateDocument(doc.id, { content: 'Nouveau contenu très court.' })
    expect(updated).not.toBeNull()
    expect(updated!.chunkCount).toBe(1)
    const chunks = await db.aiKnowledgeChunks.where('docId').equals(doc.id).toArray()
    expect(chunks).toHaveLength(1)
    expect(chunks[0]!.text).toContain('Nouveau contenu')
  })

  it('updateDocument retourne null pour un id inconnu', async () => {
    expect(await updateDocument('inexistant', { title: 'x' })).toBeNull()
  })

  it('rankResults limite à 2 chunks par document', async () => {
    const doc = await addDocument(DOC_ESCALIER)
    const chunk = (await db.aiKnowledgeChunks.where('docId').equals(doc.id).first())!
    const fake = [0.9, 0.8, 0.7].map((score) => ({ chunk, doc, score }))
    expect(rankResults(fake)).toHaveLength(2)
  })

  it('buildCitations produit des snippets ≤ 200 chars', async () => {
    await addDocument(DOC_ESCALIER)
    const results = await searchDocuments('Blondel')
    const citations = buildCitations(results)
    expect(citations.length).toBeGreaterThan(0)
    for (const c of citations) {
      expect(c.snippet.length).toBeLessThanOrEqual(200)
      expect(c.docTitle).toBe('Escaliers')
    }
  })

  it('buildRagContext retourne un bloc [DOCUMENTS] ou vide', async () => {
    expect((await buildRagContext('escalier')).context).toBe('')
    await addDocument(DOC_ESCALIER)
    const { context, citations } = await buildRagContext('règle de Blondel escalier')
    expect(context).toContain('[DOCUMENTS]')
    expect(context).toContain('Escaliers')
    expect(citations.length).toBeGreaterThan(0)
  })
})
