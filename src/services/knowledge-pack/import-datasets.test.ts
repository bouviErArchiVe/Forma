import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../db'
import sampleEntries from './__fixtures__/sample_core_entries.json'
import sampleChunks from './__fixtures__/sample_core_chunks.json'
import {
  __resetEnsureImport,
  ensurePackDictionaryImported,
  ensurePackRagImported,
  importPackDataset,
  isPackDatasetImported,
} from './import'
import { isValidPackChunk, isValidPackEntry } from './validate'
import type { PackKnowledgeEntry, PackRagChunk } from './types'

const entries = sampleEntries as unknown as PackKnowledgeEntry[]
const chunks = sampleChunks as unknown as PackRagChunk[]
const validEntries = entries.filter(isValidPackEntry).length
const validChunks = chunks.filter(isValidPackChunk).length

const manifest = { pack: 'TEST_PACK', createdAt: '2026-06-21T00:00:00Z', recommendedLoadOrder: [], doNotLoadByDefault: [], storageRecommendation: '', counts: {} }

let fetchCalls: string[] = []
function stubFetch(overrides: Record<string, unknown> = {}) {
  const map: Record<string, unknown> = {
    'offline_manifest.json': manifest,
    'forma_dictionary_core.json': entries,
    'formai_rag_core_chunks.json': chunks,
    'formai_rag_review_chunks.json': [],
    'forma_search_index_light.json': { keywords: [{ keyword: 'poutre', count: 5 }], tags: [], documents: [], gates: {} },
    ...overrides,
  }
  fetchCalls = []
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    fetchCalls.push(String(url))
    const key = Object.keys(map).find((k) => String(url).endsWith(k))
    const payload = key ? map[key] : undefined
    if (payload === '__throw__') throw new TypeError('Failed to fetch')
    return { ok: payload !== undefined, status: payload !== undefined ? 200 : 404, json: async () => payload } as unknown as Response
  }))
}

async function resetDb(): Promise<void> { db.close(); await db.delete(); await db.open() }
beforeEach(async () => { await resetDb(); __resetEnsureImport() })
afterEach(() => vi.unstubAllGlobals())

describe('import paresseux par dataset (#22)', () => {
  it('dictionary : importe les entrées SANS charger les chunks RAG', async () => {
    stubFetch()
    const r = await importPackDataset('dictionary')
    expect(r.batch.status).toBe('completed')
    expect(await db.formaKnowledgeEntries.count()).toBe(validEntries)
    expect(await db.formaRagChunks.count()).toBe(0)
    // Aucun fichier de chunks n'a été fetch.
    expect(fetchCalls.some((u) => u.includes('rag_core') || u.includes('rag_review'))).toBe(false)
  })

  it('rag : importe les chunks SANS charger les entrées dictionnaire', async () => {
    stubFetch()
    await importPackDataset('rag')
    expect(await db.formaRagChunks.count()).toBe(validChunks)
    expect(await db.formaKnowledgeEntries.count()).toBe(0)
    expect(fetchCalls.some((u) => u.includes('dictionary_core'))).toBe(false)
  })

  it('idempotent par dataset : 2e import skipped, pas de re-fetch du JSON', async () => {
    stubFetch()
    await importPackDataset('dictionary')
    const callsAfterFirst = fetchCalls.filter((u) => u.includes('dictionary_core')).length
    const r2 = await importPackDataset('dictionary')
    expect(r2.skipped).toBe(true)
    expect(fetchCalls.filter((u) => u.includes('dictionary_core')).length).toBe(callsAfterFirst)
  })

  it('ensure* mémoïsé : pas de double-fetch sur appels concurrents', async () => {
    stubFetch()
    await Promise.all([ensurePackDictionaryImported(), ensurePackDictionaryImported()])
    expect(fetchCalls.filter((u) => u.includes('dictionary_core')).length).toBe(1)
  })

  it('un import GLOBAL préexistant court-circuite le dataset (rétro-compat)', async () => {
    stubFetch()
    await db.formaImportBatches.put({ packName: 'TEST_PACK', version: manifest.createdAt, status: 'completed', createdAt: 'seed' })
    const r = await importPackDataset('dictionary')
    expect(r.skipped).toBe(true)
    expect(fetchCalls.some((u) => u.includes('dictionary_core'))).toBe(false)
  })

  it('échec partiel d\'un dataset PRÉSERVE les autres', async () => {
    stubFetch()
    await importPackDataset('dictionary')
    const ok = await db.formaKnowledgeEntries.count()
    __resetEnsureImport()
    stubFetch({ 'formai_rag_core_chunks.json': '__throw__' })
    const r = await importPackDataset('rag')
    expect(r.batch.status).toBe('failed')
    expect(await db.formaKnowledgeEntries.count()).toBe(ok) // dictionary intact
  })

  it('checksum déclaré invalide → fail-safe : batch failed, dataset non écrit (#26)', async () => {
    stubFetch({ 'offline_manifest.json': { ...manifest, checksums: { 'forma_dictionary_core.json': 'deadbeef' } } })
    const r = await importPackDataset('dictionary')
    expect(r.batch.status).toBe('failed')
    expect(await db.formaKnowledgeEntries.count()).toBe(0) // rien écrit (pas de corruption)
  })

  it('isPackDatasetImported reflète chaque dataset', async () => {
    stubFetch()
    expect(await isPackDatasetImported('dictionary')).toBe(false)
    await importPackDataset('dictionary')
    expect(await isPackDatasetImported('dictionary')).toBe(true)
    expect(await isPackDatasetImported('rag')).toBe(false)
    await ensurePackRagImported()
    expect(await isPackDatasetImported('rag')).toBe(true)
  })
})
