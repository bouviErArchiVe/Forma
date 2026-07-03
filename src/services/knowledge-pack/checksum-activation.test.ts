/**
 * Activation des checksums réels (Sprint #28).
 *
 * Prouve, avec le VRAI manifeste et le VRAI petit fichier du pack
 * (`forma_search_index_light.json`, ≈247 Ko — jamais les 64 Mo en CI) :
 *  - les checksums du manifeste couvrent les fichiers utilisés par l'import ;
 *  - le hash « octets disque » (script) == hash « texte fetché » (import) —
 *    l'équivalence EOL/BOM sur laquelle repose la vérification ;
 *  - import réel avec checksum valide → OK ;
 *  - contenu altéré → PackChecksumError, AUCUNE écriture Dexie, dataset conservé ;
 *  - absence de checksum → comportement inchangé.
 */
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../db'
import { __resetEnsureImport, importPackDataset } from './import'
import { fetchPackJson, PackChecksumError, sha256Hex, __resetPackSource } from './pack-source'
import type { PackOfflineManifest } from './types'

const APP_DIR = 'public/knowledge-pack/part10/data/app'
const manifest = JSON.parse(readFileSync(`${APP_DIR}/offline_manifest.json`, 'utf8')) as PackOfflineManifest
const searchText = readFileSync(`${APP_DIR}/forma_search_index_light.json`, 'utf8')

/** Sert le vrai manifeste + le vrai index search ; datasets lourds → mini-fixtures. */
function stubFetch(overrides: Record<string, string> = {}) {
  const map: Record<string, string> = {
    'offline_manifest.json': JSON.stringify(manifest),
    'forma_search_index_light.json': searchText,
    ...overrides,
  }
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const key = Object.keys(map).find((k) => String(url).endsWith(k))
    if (key === undefined) return { ok: false, status: 404, text: async () => '' } as unknown as Response
    return { ok: true, status: 200, text: async () => map[key] } as unknown as Response
  }))
}

async function resetDb(): Promise<void> {
  db.close(); await db.delete(); await db.open()
}

beforeEach(async () => { await resetDb(); __resetEnsureImport(); __resetPackSource() })
afterEach(() => vi.unstubAllGlobals())

describe('checksums réels du manifeste', () => {
  it('couvre tous les fichiers utilisés par l import', () => {
    for (const f of [
      'forma_dictionary_core.json',
      'formai_rag_core_chunks.json',
      'formai_rag_review_chunks.json',
      'forma_search_index_light.json',
    ]) {
      expect(manifest.checksums?.[f], `checksum manquant pour ${f}`).toMatch(/^[0-9a-f]{64}$/)
    }
  })

  it('hash octets disque == hash texte fetché (équivalence EOL/BOM)', async () => {
    // Le script hashe les octets (Buffer) ; l'import hashe le texte re-encodé
    // UTF-8. Fichier LF sans BOM → identiques. C'est le contrat d'intégrité.
    expect(await sha256Hex(searchText)).toBe(manifest.checksums?.['forma_search_index_light.json'])
  })
})

describe('import réel avec checksums actifs', () => {
  it('dataset search : checksum valide → import completed', async () => {
    stubFetch()
    const r = await importPackDataset('search')
    expect(r.batch.status).toBe('completed')
    expect(await db.formaSearchKeywords.count()).toBeGreaterThan(0)
  })

  it('contenu altéré → PackChecksumError, rien en Dexie, batch failed', async () => {
    stubFetch({ 'forma_search_index_light.json': searchText.replace('dictionnaire', 'dictionnairX') })
    const r = await importPackDataset('search')
    expect(r.batch.status).toBe('failed')
    expect(r.batch.error).toMatch(/checksum/i)
    expect(await db.formaSearchKeywords.count()).toBe(0)
  })

  it('mismatch ne remplace pas un dataset déjà importé (conservé)', async () => {
    stubFetch()
    await importPackDataset('search')
    const before = await db.formaSearchKeywords.count()
    stubFetch({ 'forma_search_index_light.json': searchText + ' ' })
    const r = await importPackDataset('search', { force: true })
    expect(r.batch.status).toBe('failed')
    expect(await db.formaSearchKeywords.count()).toBe(before)
  })

  it('mismatch de checksum ne déclenche JAMAIS le repli same-origin', async () => {
    stubFetch()
    await expect(
      fetchPackJson('forma_search_index_light.json', {
        baseUrl: 'https://cdn.example.com/pack',
        expectedChecksum: 'deadbeef'.repeat(8),
      }),
    ).rejects.toBeInstanceOf(PackChecksumError)
  })

  it('absence de checksum → comportement inchangé (import OK)', async () => {
    const noSums = { ...manifest }
    delete (noSums as Partial<PackOfflineManifest>).checksums
    stubFetch({ 'offline_manifest.json': JSON.stringify(noSums) })
    const r = await importPackDataset('search')
    expect(r.batch.status).toBe('completed')
  })

  it('idempotence conservée : réimport skipped après succès', async () => {
    stubFetch()
    await importPackDataset('search')
    const r2 = await importPackDataset('search')
    expect(r2.skipped).toBe(true)
  })
})
