/**
 * FormaCloud local — instantanés (snapshots) stockés dans IndexedDB.
 *
 * Remplace l'ancien « slot cloud » localStorage (plafonné à 5 Mo et tronqué
 * silencieusement). Chaque instantané regroupe la sauvegarde carnets (.forma)
 * ET le bundle modules (.formamods), sans limite de taille, avec un historique
 * local des dernières copies. 100 % local : rien ne quitte l'appareil.
 */
import { db } from '../db'
import { createId } from './id'
import { exportFullBackup, importBackupFile } from './backup'
import { readBlobBytes } from './assets'
import type { ImportBackupMode, ImportBackupResult } from './backup'
import {
  exportModulesBundle,
  importModulesBundle,
  type ModulesBackupCounts,
} from './modules-backup'

/** Nombre d'instantanés conservés (les plus anciens sont purgés). */
export const MAX_CLOUD_SNAPSHOTS = 8

const LEGACY_SLOT_KEY = 'forma-cloud-slot'

/** Décode une data URL base64 en octets (sans dépendre de fetch). */
function dataUrlToBytes(dataUrl: string): ArrayBuffer {
  const comma = dataUrl.indexOf(',')
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl
  const binary = atob(b64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out.buffer
}

export interface CloudSnapshotRow {
  id: string
  createdAt: number
  label: string
  notebooks: number
  pages: number
  hasModules: boolean
  /** Taille cumulée des deux archives (octets). */
  size: number
  /** Archive .forma (carnets) sérialisée en octets — fiable en IndexedDB. */
  libraryBytes: ArrayBuffer
  /** Archive .formamods (modules) sérialisée en octets. */
  modulesBytes?: ArrayBuffer
}

/** Métadonnées d'un instantané (sans les octets) pour l'affichage. */
export type CloudSnapshotMeta = Omit<CloudSnapshotRow, 'libraryBytes' | 'modulesBytes'>

function toMeta(row: CloudSnapshotRow): CloudSnapshotMeta {
  const { libraryBytes: _l, modulesBytes: _m, ...meta } = row
  return meta
}

async function countModuleRows(): Promise<number> {
  const counts = await Promise.all([
    db.formaDocuments.count(),
    db.formaSheets.count(),
    db.formaDecks.count(),
    db.formaCalEvents.count(),
    db.formaReviewSessions.count(),
    db.formaCombineProjects.count(),
    db.moodboardBoards.count(),
    db.libraryItems.count(),
  ])
  return counts.reduce((a, b) => a + b, 0)
}

/** Crée un instantané (carnets + modules) et purge l'historique au-delà de la limite. */
export async function saveCloudSnapshot(label?: string): Promise<CloudSnapshotMeta> {
  const [libraryBlob, modulesBlob, notebooks, pages, moduleRows] = await Promise.all([
    exportFullBackup(),
    exportModulesBundle(),
    db.notebooks.count(),
    db.pages.count(),
    countModuleRows(),
  ])

  const libraryBytes = await readBlobBytes(libraryBlob)
  const modulesBytes = await readBlobBytes(modulesBlob)

  const row: CloudSnapshotRow = {
    id: createId(),
    createdAt: Date.now(),
    label: label?.trim() || new Date().toLocaleString('fr-FR'),
    notebooks,
    pages,
    hasModules: moduleRows > 0,
    size: libraryBytes.byteLength + modulesBytes.byteLength,
    libraryBytes,
    modulesBytes,
  }

  await db.cloudSnapshots.put(row)
  await pruneCloudSnapshots(MAX_CLOUD_SNAPSHOTS)
  return toMeta(row)
}

/** Migre l'ancien slot localStorage vers un instantané, une seule fois. */
export async function migrateLegacyCloudSlot(): Promise<boolean> {
  let dataUrl: string | null = null
  try {
    dataUrl = localStorage.getItem(LEGACY_SLOT_KEY)
  } catch {
    return false
  }
  if (!dataUrl) return false
  try {
    const bytes = dataUrlToBytes(dataUrl)
    await db.cloudSnapshots.put({
      id: createId(),
      createdAt: Date.now(),
      label: 'Ancienne copie cloud (migrée)',
      notebooks: 0,
      pages: 0,
      hasModules: false,
      size: bytes.byteLength,
      libraryBytes: bytes,
    })
  } catch {
    /* dataUrl tronqué/illisible — on abandonne la migration */
  }
  try {
    localStorage.removeItem(LEGACY_SLOT_KEY)
  } catch {
    /* ignore */
  }
  return true
}

/** Liste les instantanés (plus récents d'abord), migration legacy incluse. */
export async function listCloudSnapshots(): Promise<CloudSnapshotMeta[]> {
  await migrateLegacyCloudSlot()
  const rows = await db.cloudSnapshots.orderBy('createdAt').reverse().toArray()
  return rows.map(toMeta)
}

export async function latestCloudSnapshot(): Promise<CloudSnapshotMeta | null> {
  const rows = await db.cloudSnapshots.orderBy('createdAt').reverse().limit(1).toArray()
  return rows[0] ? toMeta(rows[0]) : null
}

export async function deleteCloudSnapshot(id: string): Promise<void> {
  await db.cloudSnapshots.delete(id)
}

/** Supprime les instantanés les plus anciens au-delà de `max`. */
export async function pruneCloudSnapshots(max: number = MAX_CLOUD_SNAPSHOTS): Promise<number> {
  const ids = (await db.cloudSnapshots.orderBy('createdAt').reverse().toArray())
    .slice(max)
    .map((r) => r.id)
  if (ids.length) await db.cloudSnapshots.bulkDelete(ids)
  return ids.length
}

export interface RestoreSnapshotResult {
  library: ImportBackupResult
  modules?: ModulesBackupCounts
}

export interface RestoreSnapshotOptions {
  mode?: ImportBackupMode
  /** Restaure aussi le bundle modules (défaut : true). */
  restoreModules?: boolean
  /** Confirmation UI déjà effectuée. */
  confirmed?: boolean
}

/** Restaure un instantané : carnets puis (optionnellement) modules. */
export async function restoreCloudSnapshot(
  id: string,
  options?: RestoreSnapshotOptions,
): Promise<RestoreSnapshotResult> {
  const row = await db.cloudSnapshots.get(id)
  if (!row) throw new Error('Instantané introuvable')
  const mode = options?.mode ?? 'replace'

  const library = await importBackupFile(
    new File([row.libraryBytes], 'forma-snapshot.forma.zip', { type: 'application/zip' }),
    { confirmed: options?.confirmed ?? true, mode },
  )

  let modules: ModulesBackupCounts | undefined
  if (options?.restoreModules !== false && row.modulesBytes && row.modulesBytes.byteLength > 0) {
    modules = await importModulesBundle(
      new File([row.modulesBytes], 'forma-snapshot.formamods.zip', { type: 'application/zip' }),
      mode === 'replace' ? 'replace' : 'merge',
    )
  }

  return { library, modules }
}
