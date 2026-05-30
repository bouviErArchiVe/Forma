/**
 * Instantanés portables — export/import d'un instantané cloud local vers un
 * fichier unique `.formasnap.zip` (carnets .forma + modules .formamods).
 *
 * Permet de sortir les instantanés d'IndexedDB (résistance à un effacement du
 * stockage navigateur) et d'obtenir une sauvegarde complète en un seul fichier.
 * 100 % local.
 */
import JSZip from 'jszip'
import { db } from '../db'
import { createId } from './id'
import { APP_VERSION } from './version'
import {
  MAX_CLOUD_SNAPSHOTS,
  pruneCloudSnapshots,
  type CloudSnapshotMeta,
  type CloudSnapshotRow,
} from './cloud-snapshots'

export const SNAPSHOT_FILE_VERSION = 1

const LIBRARY_ENTRY = 'library.forma.zip'
const MODULES_ENTRY = 'modules.formamods.zip'
const META_ENTRY = 'snapshot.json'

interface SnapshotFileMeta {
  fileVersion: number
  appVersion: string
  createdAt: number
  label: string
  notebooks: number
  pages: number
  hasModules: boolean
  size: number
}

/** Construit le fichier portable d'un instantané existant. */
export async function exportSnapshotFile(id: string): Promise<Blob> {
  const row = await db.cloudSnapshots.get(id)
  if (!row) throw new Error('Instantané introuvable')
  return buildSnapshotZip(row)
}

/** Normalise en Uint8Array (entrée fiable pour JSZip, robuste au round-trip IndexedDB). */
function toBytes(data: ArrayBuffer | ArrayBufferView): Uint8Array {
  if (data instanceof Uint8Array) return data
  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
  }
  return new Uint8Array(data)
}

async function buildSnapshotZip(row: CloudSnapshotRow): Promise<Blob> {
  const zip = new JSZip()
  const meta: SnapshotFileMeta = {
    fileVersion: SNAPSHOT_FILE_VERSION,
    appVersion: APP_VERSION,
    createdAt: row.createdAt,
    label: row.label,
    notebooks: row.notebooks,
    pages: row.pages,
    hasModules: row.hasModules,
    size: row.size,
  }
  zip.file(META_ENTRY, JSON.stringify(meta))
  zip.file(LIBRARY_ENTRY, toBytes(row.libraryBytes))
  if (row.modulesBytes && row.modulesBytes.byteLength > 0) {
    zip.file(MODULES_ENTRY, toBytes(row.modulesBytes))
  }
  return zip.generateAsync({
    type: 'blob',
    compression: 'STORE', // archives internes déjà compressées
  })
}

function sanitizeFilename(label: string): string {
  const base = label.replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '')
  return base || 'instantane'
}

export async function downloadSnapshotFile(id: string): Promise<string> {
  const row = await db.cloudSnapshots.get(id)
  if (!row) throw new Error('Instantané introuvable')
  const blob = await buildSnapshotZip(row)
  const stamp = new Date(row.createdAt).toISOString().slice(0, 10)
  const name = `forma-${sanitizeFilename(row.label)}-${stamp}.formasnap.zip`
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
  return name
}

function toMeta(row: CloudSnapshotRow): CloudSnapshotMeta {
  const { libraryBytes: _l, modulesBytes: _m, ...meta } = row
  return meta
}

/** Importe un fichier `.formasnap.zip` comme nouvel instantané (sans restaurer). */
export async function importSnapshotFile(file: File | Blob): Promise<CloudSnapshotMeta> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer())
  const libraryFile = zip.file(LIBRARY_ENTRY)
  if (!libraryFile) {
    throw new Error('Fichier instantané invalide (archive carnets manquante)')
  }
  const metaRaw = zip.file(META_ENTRY)
  const meta: Partial<SnapshotFileMeta> =
    metaRaw ? (JSON.parse(await metaRaw.async('string')) as SnapshotFileMeta) : {}

  const libraryBytes = await libraryFile.async('arraybuffer')
  const modulesFile = zip.file(MODULES_ENTRY)
  const modulesBytes = modulesFile ? await modulesFile.async('arraybuffer') : undefined

  const row: CloudSnapshotRow = {
    id: createId(),
    createdAt: Date.now(),
    label: meta.label ? `${meta.label} (importé)` : 'Instantané importé',
    notebooks: meta.notebooks ?? 0,
    pages: meta.pages ?? 0,
    hasModules: meta.hasModules ?? !!modulesBytes,
    size: libraryBytes.byteLength + (modulesBytes?.byteLength ?? 0),
    libraryBytes,
    modulesBytes,
  }

  await db.cloudSnapshots.put(row)
  await pruneCloudSnapshots(MAX_CLOUD_SNAPSHOTS)
  return toMeta(row)
}
