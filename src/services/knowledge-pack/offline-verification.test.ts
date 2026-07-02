import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../db'
import { __resetEnsureImport } from './import'
import { __resetPackSource } from './pack-source'
import { __resetPackQueryCache, searchPackEntries } from './query'
import { __resetRagCache, ragAnswer } from './rag'
import type { PackKnowledgeEntry, PackRagChunk } from './types'

async function resetDb(): Promise<void> { db.close(); await db.delete(); await db.open() }

beforeEach(async () => {
  await resetDb()
  __resetEnsureImport(); __resetPackQueryCache(); __resetRagCache(); __resetPackSource()
})
afterEach(() => vi.unstubAllGlobals())

const entry = (id: string): PackKnowledgeEntry => ({
  id, title: `Fiche ${id}`, kind: 'source_chunk', summary: 'résumé', content: 'contenu documentaire sourcé et suffisamment long pour être utile.',
  sourceDocument: 'CCQ.pdf', sourcePage: 10, tags: ['construction'], confidence: 0.9, qualityStatus: 'ok', importGate: 'clean', formaUsefulnessScore: 50,
})
const chunk = (id: string): PackRagChunk => ({
  id, document_name: 'CCQ.pdf', page_start: 10, page_end: 10, content: 'Extrait documentaire sourcé, suffisamment long pour dépasser le seuil de contenu utile du RAG local Forma.',
  source: { document: 'CCQ.pdf', page_start: 10 }, tags: ['construction'], confidence: 0.9, qualityStatus: 'ok', importGate: 'clean', safeForDefaultRag: true, formaUsefulnessScore: 50,
})

// ─── Hygiène service worker : le pack N'EST JAMAIS précaché ──────────────────

describe('service worker — le pack n\'est pas précaché', () => {
  const sw = readFileSync(resolve('public/sw.js'), 'utf8')

  it('aucune référence au pack dans le service worker', () => {
    expect(sw).not.toMatch(/knowledge-pack/)
    expect(sw).not.toMatch(/forma_dictionary/)
    expect(sw).not.toMatch(/formai_rag/)
  })
  it('le precache (SHELL_URLS) ne contient que l\'app-shell (manifest PWA ok, pas de JSON pack)', () => {
    const block = sw.slice(sw.indexOf('SHELL_URLS'), sw.indexOf(']', sw.indexOf('SHELL_URLS')))
    expect(block).toMatch(/index\.html/)
    expect(block).toMatch(/manifest\.json/) // le seul .json précaché = le manifeste PWA (léger)
    expect(block).not.toMatch(/knowledge-pack/) // aucun gros JSON pack en precache
    expect(block).not.toMatch(/forma_dictionary|formai_rag|forma_search/)
  })
  it('les .json (pack) ne sont pas traités comme des assets cache-first', () => {
    // isStaticAsset ne matche PAS le .json → le pack n'est pas mis en cache asset.
    expect(sw).toMatch(/isStaticAsset/)
    expect(sw).not.toMatch(/json\|[^)]*wasm/) // le regex d'assets n'inclut pas json
  })
})

// ─── Offline : le pack déjà en Dexie se lit SANS réseau ─────────────────────

describe('offline — lecture du pack depuis Dexie sans réseau', () => {
  it('searchPackEntries renvoie les entrées Dexie même si fetch échoue (offline)', async () => {
    await db.formaKnowledgeEntries.bulkPut([entry('a'), entry('b')])
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
    const res = await searchPackEntries({})
    expect(res.total).toBe(2)
    expect(res.items.map((e) => e.id).sort()).toEqual(['a', 'b'])
  })

  it('ragAnswer répond depuis les chunks Dexie même offline', async () => {
    await db.formaRagChunks.bulkPut([chunk('c1')])
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
    const r = await ragAnswer('construction')
    expect(r.found).toBe(true)
    expect(r.citations[0].document).toBe('CCQ.pdf')
  })
})

// ─── Offline : pack NON importé + réseau absent → pas de crash ───────────────

describe('offline — pack non importé, réseau absent', () => {
  it('searchPackEntries renvoie vide sans planter', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
    const res = await searchPackEntries({})
    expect(res.total).toBe(0)
    expect(res.items).toEqual([])
  })
  it('ragAnswer renvoie found=false honnête sans planter', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
    const r = await ragAnswer('construction')
    expect(r.found).toBe(false)
  })
})
