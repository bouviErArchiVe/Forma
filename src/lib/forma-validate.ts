/**
 * Validation structure et intégrité des archives .forma v1.
 * Digest SHA-256 : hash par fichier puis hash du concaténat (manifest exclu).
 */
import type JSZip from 'jszip'
import { FORMA_FORMAT_VERSION, type FormaManifest, type FormaMetadata } from './forma-types'

export interface FormaValidationIssue {
  code: string
  severity: 'error' | 'warning'
  message: string
}

export interface FormaZipValidation {
  ok: boolean
  format: 'forma-v1' | 'backup-json' | 'legacy-notebook' | 'unknown'
  issues: FormaValidationIssue[]
  manifest: FormaManifest | null
  metadata: FormaMetadata | null
  pageFileCount: number
  strokeFileCount: number
  blobAssetCount: number
}

function bytesToHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Digest SHA-256 du contenu .forma (hors manifest.json). */
export async function computeFormaPayloadDigest(zip: JSZip): Promise<string> {
  const paths = Object.keys(zip.files)
    .filter((p) => !zip.files[p].dir && p !== 'manifest.json')
    .sort()
  const perFile = await Promise.all(
    paths.map(async (p) => {
      const f = zip.file(p)
      if (!f) return new Uint8Array(32)
      const buf = await f.async('arraybuffer')
      return new Uint8Array(await crypto.subtle.digest('SHA-256', buf))
    }),
  )
  const combined = new Uint8Array(perFile.length * 32)
  perFile.forEach((h, i) => combined.set(h, i * 32))
  return bytesToHex(await crypto.subtle.digest('SHA-256', combined))
}

export async function verifyFormaPayloadIntegrity(
  zip: JSZip,
  manifest: FormaManifest,
): Promise<FormaValidationIssue[]> {
  const issues: FormaValidationIssue[] = []
  const integrity = manifest.integrity
  if (!integrity || integrity.algorithm === 'none') return issues
  if (integrity.algorithm !== 'sha256') {
    issues.push({
      code: 'integrity_algorithm',
      severity: 'warning',
      message: `Algorithme d'intégrité inconnu : ${integrity.algorithm}`,
    })
    return issues
  }
  if (!integrity.digest) {
    issues.push({
      code: 'integrity_digest_missing',
      severity: 'warning',
      message: 'manifest.integrity.sha256 sans digest',
    })
    return issues
  }
  const actual = await computeFormaPayloadDigest(zip)
  if (actual !== integrity.digest) {
    issues.push({
      code: 'integrity_mismatch',
      severity: 'warning',
      message: 'Checksum SHA-256 du payload ne correspond pas au manifest',
    })
  }
  return issues
}

const REQUIRED_INDEXES = [
  'indexes/folders.json',
  'indexes/notebooks.json',
  'indexes/audio.json',
  'indexes/study.json',
  'indexes/share-links.json',
  'indexes/snapshots.json',
] as const

export function validateFormaManifest(raw: unknown): FormaValidationIssue[] {
  const issues: FormaValidationIssue[] = []
  if (!raw || typeof raw !== 'object') {
    issues.push({ code: 'manifest_missing', severity: 'error', message: 'manifest.json absent ou invalide' })
    return issues
  }
  const m = raw as FormaManifest
  if (m.formatVersion !== FORMA_FORMAT_VERSION) {
    issues.push({
      code: 'format_version',
      severity: 'error',
      message: `formatVersion attendu ${FORMA_FORMAT_VERSION}, reçu ${m.formatVersion}`,
    })
  }
  if (!m.appVersion || typeof m.appVersion !== 'string') {
    issues.push({ code: 'app_version', severity: 'warning', message: 'appVersion manquant' })
  }
  if (typeof m.exportedAt !== 'number' || m.exportedAt <= 0) {
    issues.push({ code: 'exported_at', severity: 'warning', message: 'exportedAt invalide' })
  }
  if (m.packageType !== 'library' && m.packageType !== 'notebook') {
    issues.push({ code: 'package_type', severity: 'error', message: 'packageType inconnu' })
  }
  return issues
}

export function validateFormaMetadata(
  meta: FormaMetadata | null,
  counts: { notebooks: number; pages: number; folders: number },
): FormaValidationIssue[] {
  const issues: FormaValidationIssue[] = []
  if (!meta) {
    issues.push({ code: 'metadata_missing', severity: 'warning', message: 'metadata.json absent' })
    return issues
  }
  if (meta.pageCount !== counts.pages) {
    issues.push({
      code: 'page_count_mismatch',
      severity: 'warning',
      message: `metadata.pageCount=${meta.pageCount} mais ${counts.pages} fichier(s) pages/`,
    })
  }
  if (meta.notebookCount !== counts.notebooks) {
    issues.push({
      code: 'notebook_count_mismatch',
      severity: 'warning',
      message: `metadata.notebookCount=${meta.notebookCount} mais index=${counts.notebooks}`,
    })
  }
  if (meta.folderCount !== counts.folders) {
    issues.push({
      code: 'folder_count_mismatch',
      severity: 'warning',
      message: `metadata.folderCount=${meta.folderCount} mais index=${counts.folders}`,
    })
  }
  return issues
}

/** Analyse ZIP sans charger toute la bibliothèque en mémoire applicative. */
export async function validateFormaZip(zip: JSZip): Promise<FormaZipValidation> {
  const issues: FormaValidationIssue[] = []
  const paths = Object.keys(zip.files).filter((p) => !p.endsWith('/'))

  const pageFileCount = paths.filter((p) => p.startsWith('pages/') && p.endsWith('.json')).length
  const strokeFileCount = paths.filter((p) => p.startsWith('strokes/') && p.endsWith('.json')).length
  const blobAssetCount = paths.filter((p) => p.startsWith('assets/blobs/')).length

  let manifest: FormaManifest | null = null
  let metadata: FormaMetadata | null = null
  let format: FormaZipValidation['format'] = 'unknown'

  const manifestFile = zip.file('manifest.json')
  if (manifestFile) {
    try {
      manifest = JSON.parse(await manifestFile.async('string')) as FormaManifest
      issues.push(...validateFormaManifest(manifest))
      if (manifest.formatVersion === FORMA_FORMAT_VERSION && manifest.packageType === 'library') {
        format = 'forma-v1'
      }
    } catch {
      issues.push({ code: 'manifest_parse', severity: 'error', message: 'manifest.json illisible' })
    }
  }

  const metaFile = zip.file('metadata.json')
  if (metaFile) {
    try {
      metadata = JSON.parse(await metaFile.async('string')) as FormaMetadata
    } catch {
      issues.push({ code: 'metadata_parse', severity: 'warning', message: 'metadata.json illisible' })
    }
  }

  if (zip.file('backup.json')) {
    if (format === 'unknown') format = 'backup-json'
  }

  if (format === 'forma-v1') {
    for (const idx of REQUIRED_INDEXES) {
      if (!zip.file(idx)) {
        issues.push({
          code: 'index_missing',
          severity: 'warning',
          message: `Index manquant : ${idx}`,
        })
      }
    }
    if (!zip.file('backup.json')) {
      issues.push({
        code: 'legacy_backup',
        severity: 'warning',
        message: 'backup.json absent (rétrocompatibilité réduite)',
      })
    }
  }

  if (format === 'unknown' && !zip.file('backup.json')) {
    issues.push({
      code: 'unknown_format',
      severity: 'error',
      message: 'Archive non reconnue',
    })
  }

  let notebookIndexLen = 0
  let folderIndexLen = 0
  const nbIndex = zip.file('indexes/notebooks.json')
  const folderIndex = zip.file('indexes/folders.json')
  if (nbIndex) {
    try {
      const arr = JSON.parse(await nbIndex.async('string'))
      notebookIndexLen = Array.isArray(arr) ? arr.length : 0
    } catch {
      issues.push({ code: 'notebooks_index', severity: 'error', message: 'indexes/notebooks.json invalide' })
    }
  }
  if (folderIndex) {
    try {
      const arr = JSON.parse(await folderIndex.async('string'))
      folderIndexLen = Array.isArray(arr) ? arr.length : 0
    } catch {
      issues.push({ code: 'folders_index', severity: 'warning', message: 'indexes/folders.json invalide' })
    }
  }

  issues.push(
    ...validateFormaMetadata(metadata, {
      notebooks: notebookIndexLen,
      pages: pageFileCount,
      folders: folderIndexLen,
    }),
  )

  if (manifest?.integrity?.algorithm === 'sha256') {
    issues.push(...(await verifyFormaPayloadIntegrity(zip, manifest)))
  }

  const errors = issues.filter((i) => i.severity === 'error')
  return {
    ok: errors.length === 0 && format !== 'unknown',
    format,
    issues,
    manifest,
    metadata,
    pageFileCount,
    strokeFileCount,
    blobAssetCount,
  }
}

export function formatValidationSummary(issues: FormaValidationIssue[]): string {
  const errors = issues.filter((i) => i.severity === 'error')
  const warnings = issues.filter((i) => i.severity === 'warning')
  if (!errors.length && !warnings.length) return ''
  const parts: string[] = []
  if (errors.length) parts.push(`${errors.length} erreur(s)`)
  if (warnings.length) parts.push(`${warnings.length} avertissement(s)`)
  return parts.join(', ')
}
