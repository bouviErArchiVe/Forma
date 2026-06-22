import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../db'
import sampleEntries from './__fixtures__/sample_core_entries.json'
import sampleChunks from './__fixtures__/sample_core_chunks.json'
import { __resetEnsureImport, importKnowledgePack, isPackImported } from './import'
import { isValidPackChunk, isValidPackEntry } from './validate'
import type { PackKnowledgeEntry, PackRagChunk } from './types'

const entries = sampleEntries as unknown as PackKnowledgeEntry[]
const chunks = sampleChunks as unknown as PackRagChunk[]
const validEntries = entries.filter(isValidPackEntry).length
const validChunks = chunks.filter(isValidPackChunk).length

const manifest = {
  pack: 'TEST_PACK', createdAt: '2026-06-21T00:00:00Z',
  recommendedLoadOrder: [], doNotLoadByDefault: [], storageRecommendation: '', counts: {},
}

function stubFetch(overrides: Record<string, unknown> = {}) {
  const map: Record<string, unknown> = {
    'offline_manifest.json': manifest,
    'forma_dictionary_core.json': entries,
    'formai_rag_core_chunks.json': chunks,
    'formai_rag_review_chunks.json': [],
    'forma_search_index_light.json': { keywords: [{ keyword: 'poutre', count: 5 }, { keyword: 'acier', count: 3 }], tags: [], documents: [], gates: {} },
    ...overrides,
  }
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const key = Object.keys(map).find((k) => String(url).endsWith(k))
    const payload = key ? map[key] : undefined
    if (payload === '__throw__') throw new TypeError('Failed to fetch')
    return { ok: payload !== undefined, status: payload !== undefined ? 200 : 404, json: async () => payload } as unknown as Response
  }))
}

async function resetDb(): Promise<void> {
  db.close(); await db.delete(); await db.open()
}

beforeEach(async () => { await resetDb(); __resetEnsureImport() })
afterEach(() => vi.unstubAllGlobals())

describe('importKnowledgePack', () => {
  it('importe entrées, chunks et mots-clés dans Dexie', async () => {
    stubFetch()
    const r = await importKnowledgePack()
    expect(r.skipped).toBe(false)
    expect(r.batch.status).toBe('completed')
    expect(await db.formaKnowledgeEntries.count()).toBe(validEntries)
    expect(await db.formaRagChunks.count()).toBe(validChunks)
    expect(await db.formaSearchKeywords.count()).toBe(2)
    expect(await isPackImported('TEST_PACK')).toBe(true)
  })

  it('réimport du même pack/version : skipped, aucune duplication', async () => {
    stubFetch()
    await importKnowledgePack()
    const before = await db.formaKnowledgeEntries.count()
    const r2 = await importKnowledgePack()
    expect(r2.skipped).toBe(true)
    expect(await db.formaKnowledgeEntries.count()).toBe(before)
  })

  it('force réimporte (clear + bulkPut) sans gonfler les tables', async () => {
    stubFetch()
    await importKnowledgePack()
    const before = await db.formaKnowledgeEntries.count()
    const r = await importKnowledgePack({ force: true })
    expect(r.skipped).toBe(false)
    expect(await db.formaKnowledgeEntries.count()).toBe(before)
  })

  it('exclut les items quarantine des tables par défaut', async () => {
    const withQuar = [...entries, { ...entries[0], id: 'q1', importGate: 'quarantine' as const }]
    stubFetch({ 'forma_dictionary_core.json': withQuar })
    await importKnowledgePack()
    const got = await db.formaKnowledgeEntries.get('q1')
    expect(got).toBeUndefined()
  })

  it('échec réseau : batch failed, données préservées', async () => {
    stubFetch()
    await importKnowledgePack()
    const ok = await db.formaKnowledgeEntries.count()
    // Réimport forcé qui échoue sur un fichier
    stubFetch({ 'forma_dictionary_core.json': '__throw__' })
    const r = await importKnowledgePack({ force: true })
    expect(r.batch.status).toBe('failed')
    // Les données précédentes sont toujours là (clear est dans la transaction qui rollback).
    expect(await db.formaKnowledgeEntries.count()).toBe(ok)
  })
})
