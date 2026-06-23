/**
 * Import du pack de connaissance PDF (Part 10) vers Dexie.
 *
 * LAZY & IDEMPOTENT : les JSON volumineux vivent sous `public/knowledge-pack/
 * part10/` et sont chargés par `fetch` UNIQUEMENT à la demande (jamais dans le
 * bundle JS). L'import est journalisé dans `formaImportBatches` et ne se rejoue
 * pas si le même pack/version est déjà « completed » (sauf `force`).
 *
 * Gates respectés : on importe `clean` et `review` (avec leur gate) ; on
 * n'importe JAMAIS de `quarantine` dans les tables par défaut.
 */
import { db } from '../../db'
import {
  type PackImportBatch,
  type PackKnowledgeEntry,
  type PackOfflineManifest,
  type PackRagChunk,
  type PackSearchIndex,
} from './types'
import { isValidPackChunk, isValidPackEntry } from './validate'

export const PACK_BASE_URL = '/knowledge-pack/part10/data/app'

/** Le pack lui-même n'est pas quarantine ; on écarte tout item quarantine par sécurité. */
function keepNonQuarantine<T extends { importGate?: string }>(items: T[]): T[] {
  return items.filter((i) => i.importGate !== 'quarantine')
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} sur ${url}`)
  return (await res.json()) as T
}

/** Charge le manifeste offline du pack (léger). */
export async function fetchOfflineManifest(baseUrl = PACK_BASE_URL): Promise<PackOfflineManifest> {
  return fetchJson<PackOfflineManifest>(`${baseUrl}/offline_manifest.json`)
}

/** Statut d'import courant (journal) pour un pack donné. */
export async function getImportBatch(packName: string): Promise<PackImportBatch | undefined> {
  return db.formaImportBatches.get(packName)
}

/** Vrai si un pack a été importé avec succès. */
export async function isPackImported(packName?: string): Promise<boolean> {
  const batch = packName
    ? await db.formaImportBatches.get(packName)
    : (await db.formaImportBatches.toArray()).find((b) => b.status === 'completed')
  return batch?.status === 'completed'
}

export interface ImportResult {
  skipped: boolean
  batch: PackImportBatch
}

/**
 * Importe (ou réimporte) le pack dans Dexie. Idempotent : si le pack/version est
 * déjà `completed` et `force` est faux, ne fait rien. En cas d'échec, le batch
 * est marqué `failed` et les données existantes sont préservées.
 */
export async function importKnowledgePack(options: { force?: boolean; baseUrl?: string } = {}): Promise<ImportResult> {
  const baseUrl = options.baseUrl ?? PACK_BASE_URL
  const manifest = await fetchOfflineManifest(baseUrl)
  const packName = manifest.pack
  const version = manifest.createdAt

  const existing = await db.formaImportBatches.get(packName)
  if (!options.force && existing?.status === 'completed' && existing.version === version) {
    return { skipped: true, batch: existing }
  }

  const running: PackImportBatch = {
    packName, version, createdAt: new Date().toISOString(), status: 'running', counts: manifest.counts,
  }
  await db.formaImportBatches.put(running)

  try {
    // Chargement à la demande des fichiers app (ordre recommandé du manifeste).
    const [entriesRaw, ragCoreRaw, ragReviewRaw, searchIdx] = await Promise.all([
      fetchJson<PackKnowledgeEntry[]>(`${baseUrl}/forma_dictionary_core.json`),
      fetchJson<PackRagChunk[]>(`${baseUrl}/formai_rag_core_chunks.json`),
      fetchJson<PackRagChunk[]>(`${baseUrl}/formai_rag_review_chunks.json`),
      fetchJson<PackSearchIndex>(`${baseUrl}/forma_search_index_light.json`),
    ])

    // Validation défensive + exclusion quarantine (on ne répare ni n'invente).
    const entries = keepNonQuarantine(entriesRaw).filter(isValidPackEntry)
    const chunks = keepNonQuarantine([...ragCoreRaw, ...ragReviewRaw]).filter(isValidPackChunk)
    const keywords = (searchIdx.keywords ?? []).filter((k) => typeof k.keyword === 'string' && k.keyword !== '')

    await db.transaction('rw', db.formaKnowledgeEntries, db.formaRagChunks, db.formaSearchKeywords, async () => {
      // Réimport : on vide d'abord pour ne pas laisser d'orphelins d'une version antérieure.
      await Promise.all([
        db.formaKnowledgeEntries.clear(),
        db.formaRagChunks.clear(),
        db.formaSearchKeywords.clear(),
      ])
      await db.formaKnowledgeEntries.bulkPut(entries)
      await db.formaRagChunks.bulkPut(chunks)
      await db.formaSearchKeywords.bulkPut(keywords)
    })

    const completed: PackImportBatch = {
      packName,
      version,
      createdAt: new Date().toISOString(),
      status: 'completed',
      counts: {
        entries: entries.length,
        chunks: chunks.length,
        keywords: keywords.length,
        rejectedEntries: entriesRaw.length - entries.length,
        rejectedChunks: ragCoreRaw.length + ragReviewRaw.length - chunks.length,
      },
      checksum: version,
    }
    await db.formaImportBatches.put(completed)
    return { skipped: false, batch: completed }
  } catch (err) {
    const failed: PackImportBatch = {
      ...running,
      status: 'failed',
      error: err instanceof Error ? err.message : String(err),
    }
    await db.formaImportBatches.put(failed)
    return { skipped: false, batch: failed }
  }
}

// ─── Import PARESSEUX PAR DATASET (Sprint #22) ──────────────────────────────
//
// Le pack se découpe en datasets logiques chargés SÉPARÉMENT, pour ne plus tirer
// 64 MB d'un coup : Documents/Dictionnaire ⇒ `dictionary` (entrées) ;
// FormAI RAG ⇒ `rag` (chunks) ; Search ⇒ `search` (mots-clés légers).
// Chaque dataset est idempotent (ligne `${pack}::<dataset>` dans
// `formaImportBatches`) ET respecte un import GLOBAL préexistant (rétro-compat :
// un `importKnowledgePack` complet, ou une amorce e2e, court-circuite tout).

export type PackDataset = 'dictionary' | 'rag' | 'search'

export interface ImportProgress {
  dataset: PackDataset
  phase: 'fetching' | 'storing' | 'done'
  count?: number
}

function datasetKey(pack: string, dataset: PackDataset): string {
  return `${pack}::${dataset}`
}

function isDone(batch: PackImportBatch | undefined, version: string): boolean {
  return batch?.status === 'completed' && batch.version === version
}

/** Vrai si un dataset est disponible (sa ligne OU un import global est `completed`). */
export async function isPackDatasetImported(dataset: PackDataset): Promise<boolean> {
  const all = await db.formaImportBatches.toArray()
  return all.some(
    (b) => b.status === 'completed'
      && (b.packName.endsWith(`::${dataset}`) || !b.packName.includes('::')),
  )
}

/**
 * Importe UN dataset à la demande. Idempotent par dataset ; respecte un import
 * global préexistant. En cas d'échec, marque la ligne `failed` et PRÉSERVE les
 * autres datasets (transaction limitée à la table concernée).
 */
export async function importPackDataset(
  dataset: PackDataset,
  options: { force?: boolean; baseUrl?: string; onProgress?: (p: ImportProgress) => void } = {},
): Promise<ImportResult> {
  const baseUrl = options.baseUrl ?? PACK_BASE_URL
  const manifest = await fetchOfflineManifest(baseUrl)
  const pack = manifest.pack
  const version = manifest.createdAt
  const key = datasetKey(pack, dataset)

  const [dsRow, globalRow] = await Promise.all([
    db.formaImportBatches.get(key),
    db.formaImportBatches.get(pack),
  ])
  if (!options.force && (isDone(dsRow, version) || isDone(globalRow, version))) {
    return { skipped: true, batch: (isDone(dsRow, version) ? dsRow : globalRow) as PackImportBatch }
  }

  const running: PackImportBatch = { packName: key, version, createdAt: new Date().toISOString(), status: 'running' }
  await db.formaImportBatches.put(running)

  try {
    options.onProgress?.({ dataset, phase: 'fetching' })
    let count = 0
    if (dataset === 'dictionary') {
      const raw = await fetchJson<PackKnowledgeEntry[]>(`${baseUrl}/forma_dictionary_core.json`)
      const entries = keepNonQuarantine(raw).filter(isValidPackEntry)
      options.onProgress?.({ dataset, phase: 'storing' })
      await db.transaction('rw', db.formaKnowledgeEntries, async () => {
        await db.formaKnowledgeEntries.clear()
        await db.formaKnowledgeEntries.bulkPut(entries)
      })
      count = entries.length
    } else if (dataset === 'rag') {
      const [coreRaw, reviewRaw] = await Promise.all([
        fetchJson<PackRagChunk[]>(`${baseUrl}/formai_rag_core_chunks.json`),
        fetchJson<PackRagChunk[]>(`${baseUrl}/formai_rag_review_chunks.json`),
      ])
      const chunks = keepNonQuarantine([...coreRaw, ...reviewRaw]).filter(isValidPackChunk)
      options.onProgress?.({ dataset, phase: 'storing' })
      await db.transaction('rw', db.formaRagChunks, async () => {
        await db.formaRagChunks.clear()
        await db.formaRagChunks.bulkPut(chunks)
      })
      count = chunks.length
    } else {
      const idx = await fetchJson<PackSearchIndex>(`${baseUrl}/forma_search_index_light.json`)
      const keywords = (idx.keywords ?? []).filter((k) => typeof k.keyword === 'string' && k.keyword !== '')
      options.onProgress?.({ dataset, phase: 'storing' })
      await db.transaction('rw', db.formaSearchKeywords, async () => {
        await db.formaSearchKeywords.clear()
        await db.formaSearchKeywords.bulkPut(keywords)
      })
      count = keywords.length
    }

    const completed: PackImportBatch = {
      packName: key, version, createdAt: new Date().toISOString(),
      status: 'completed', counts: { [dataset]: count }, checksum: version,
    }
    await db.formaImportBatches.put(completed)
    options.onProgress?.({ dataset, phase: 'done', count })
    return { skipped: false, batch: completed }
  } catch (err) {
    const failed: PackImportBatch = { ...running, status: 'failed', error: err instanceof Error ? err.message : String(err) }
    await db.formaImportBatches.put(failed)
    return { skipped: false, batch: failed }
  }
}

const datasetMemo = new Map<PackDataset, Promise<ImportResult>>()

function ensureDataset(dataset: PackDataset): Promise<ImportResult> {
  let p = datasetMemo.get(dataset)
  if (!p) {
    p = importPackDataset(dataset).catch((err): ImportResult => ({
      skipped: false,
      batch: { packName: `unknown::${dataset}`, version: '', createdAt: new Date().toISOString(), status: 'failed', error: err instanceof Error ? err.message : String(err) },
    }))
    datasetMemo.set(dataset, p)
  }
  return p
}

/** Dictionnaire/Documents : entrées seulement (≈23 MB), pas les chunks RAG. */
export function ensurePackDictionaryImported(): Promise<ImportResult> { return ensureDataset('dictionary') }
/** FormAI RAG : chunks seulement (≈41 MB), à la demande d'une question. */
export function ensurePackRagImported(): Promise<ImportResult> { return ensureDataset('rag') }
/** Search : index de mots-clés léger (≈0,25 MB). */
export function ensurePackSearchImported(): Promise<ImportResult> { return ensureDataset('search') }

let ensurePromise: Promise<ImportResult> | null = null

/**
 * Garantit l'import du pack une seule fois par session (mémoïsé). Appelé à la
 * demande par /dictionary, Search ou le RAG FormAI — JAMAIS au chargement de
 * l'app. Ne throw jamais (renvoie un batch `failed` le cas échéant).
 */
export async function ensureKnowledgePackImported(): Promise<ImportResult> {
  if (ensurePromise) return ensurePromise
  ensurePromise = importKnowledgePack().catch((err): ImportResult => ({
    skipped: false,
    batch: {
      packName: 'unknown', version: '', createdAt: new Date().toISOString(),
      status: 'failed', error: err instanceof Error ? err.message : String(err),
    },
  }))
  return ensurePromise
}

/** Réinitialise les mémos d'import (tests). */
export function __resetEnsureImport(): void {
  ensurePromise = null
  datasetMemo.clear()
}
