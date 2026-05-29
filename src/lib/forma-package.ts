/**
 * Format .forma v1 — package ZIP structuré (addendum §9).
 * Compatible import : backup.json v4, manifest carnet legacy.
 */
import JSZip from 'jszip'
import { db } from '../db'
import { putAsset, readBlobBytes } from './assets'
import { APP_VERSION } from './version'
import {
  FORMA_FORMAT_VERSION,
  type FormaManifest,
  type FormaMetadata,
} from './forma-types'
import {
  computeFormaPayloadDigest,
  validateFormaZip,
  type FormaValidationIssue,
} from './forma-validate'
import type {
  AudioRecording,
  Folder,
  Notebook,
  Page,
  PageSnapshot,
  ShareLink,
  StudyCard,
} from '../types'
import { normalizePage } from '../types'
import type { FormaBackup } from './backup'

export { FORMA_FORMAT_VERSION, type FormaManifest, type FormaMetadata } from './forma-types'
export type { FormaValidationIssue } from './forma-validate'
export { formatValidationSummary, validateFormaZip } from './forma-validate'

export interface FormaLibraryPayload {
  folders: Folder[]
  notebooks: Notebook[]
  pages: Page[]
  audio: AudioRecording[]
  studyCards: StudyCard[]
  shareLinks: ShareLink[]
  pageSnapshots: PageSnapshot[]
}

type AssetRef = { assetRef: string }

function isDataUrl(s: string | undefined): s is string {
  return !!s && s.startsWith('data:')
}

async function dataUrlToArrayBuffer(dataUrl: string): Promise<ArrayBuffer> {
  const res = await fetch(dataUrl)
  return res.arrayBuffer()
}

async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return readBlobBytes(blob)
}

function bufferToDataUrl(buf: ArrayBuffer, mime: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([buf], { type: mime })
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(new Error('Lecture asset impossible'))
    r.readAsDataURL(blob)
  })
}

async function assetRefToDataUrl(zip: JSZip, ref: string): Promise<string | undefined> {
  const f = zip.file(ref)
  if (!f) return undefined
  const buf = await f.async('arraybuffer')
  const ext = ref.split('.').pop() ?? 'bin'
  const mime =
    ext === 'png' ? 'image/png'
    : ext === 'jpg' ? 'image/jpeg'
    : ext === 'webm' ? 'audio/webm'
    : ext === 'pdf' ? 'application/pdf'
    : 'application/octet-stream'
  return bufferToDataUrl(buf, mime)
}

function extFromMime(mime: string): string {
  if (mime.includes('png')) return 'png'
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg'
  if (mime.includes('webm')) return 'webm'
  if (mime.includes('pdf')) return 'pdf'
  return 'bin'
}

function assetPath(folder: string, id: string, dataUrl: string): string {
  const semi = dataUrl.indexOf(';')
  const mime = semi > 5 ? dataUrl.slice(5, semi) : 'application/octet-stream'
  return `assets/${folder}/${id}.${extFromMime(mime)}`
}

function blobAssetPath(assetId: string, mime: string): string {
  return `assets/blobs/${assetId}.${extFromMime(mime || 'application/octet-stream')}`
}

function zipHasBlobAsset(zip: JSZip, assetId: string): boolean {
  const prefix = `assets/blobs/${assetId}.`
  return Object.keys(zip.files).some((p) => p.startsWith(prefix) && !p.endsWith('/'))
}

async function ensureBlobAssetInZip(
  zip: JSZip,
  assetId: string,
  blob: Blob,
  written: Set<string>,
): Promise<void> {
  const path = blobAssetPath(assetId, blob.type)
  if (written.has(path)) return
  zip.file(path, await blobToArrayBuffer(blob))
  written.add(path)
}

/** Sérialise une page : externalise dataURL ou référence blobs IndexedDB. */
async function serializePage(
  zip: JSZip,
  page: Page,
  written: Set<string>,
): Promise<Record<string, unknown>> {
  const p = normalizePage(page)
  const out: Record<string, unknown> = { ...p }

  if (p.pdfAssetId) {
    const row = await db.assets.get(p.pdfAssetId)
    if (row) {
      await ensureBlobAssetInZip(zip, p.pdfAssetId, row.blob, written)
      out.pdfDataUrl = undefined
    }
  } else if (isDataUrl(p.pdfDataUrl)) {
    const path = assetPath('pdf-pages', p.id, p.pdfDataUrl)
    if (!written.has(path)) {
      zip.file(path, await dataUrlToArrayBuffer(p.pdfDataUrl))
      written.add(path)
    }
    out.pdfDataUrl = { assetRef: path }
    out.pdfAssetId = undefined
  }

  const imageWrites: Promise<void>[] = []
  out.images = await Promise.all(
    p.images.map(async (img) => {
      if (img.assetId) {
        const row = await db.assets.get(img.assetId)
        if (row) {
          imageWrites.push(ensureBlobAssetInZip(zip, img.assetId, row.blob, written))
          return { ...img, dataUrl: undefined }
        }
      }
      if (!isDataUrl(img.dataUrl)) return img
      const path = assetPath('images', img.id, img.dataUrl)
      if (!written.has(path)) {
        written.add(path)
        imageWrites.push(
          dataUrlToArrayBuffer(img.dataUrl).then((buf) => {
            zip.file(path, buf)
          }),
        )
      }
      return { ...img, dataUrl: { assetRef: path }, assetId: undefined }
    }),
  )
  await Promise.all(imageWrites)

  return out
}

async function resolvePage(raw: Record<string, unknown>, zip: JSZip): Promise<Page> {
  const resolveField = async (v: unknown): Promise<string | undefined> => {
    if (typeof v === 'string') return v
    if (v && typeof v === 'object' && 'assetRef' in v) {
      return assetRefToDataUrl(zip, (v as AssetRef).assetRef)
    }
    return undefined
  }

  const page = { ...raw } as unknown as Page
  const pdfAssetId = typeof raw.pdfAssetId === 'string' ? raw.pdfAssetId : undefined
  if (pdfAssetId && zipHasBlobAsset(zip, pdfAssetId)) {
    page.pdfAssetId = pdfAssetId
    page.pdfDataUrl = undefined
  } else if (raw.pdfDataUrl) {
    page.pdfDataUrl = await resolveField(raw.pdfDataUrl)
    page.pdfAssetId = undefined
  }
  if (Array.isArray(raw.images)) {
    page.images = await Promise.all(
      (raw.images as Page['images']).map(async (img) => {
        if (img.assetId && zipHasBlobAsset(zip, img.assetId)) {
          return { ...img, dataUrl: undefined }
        }
        const dataUrl = await resolveField(img.dataUrl)
        if (dataUrl) return { ...img, dataUrl, assetId: undefined }
        return img
      }),
    )
  }
  return normalizePage(page)
}

function mimeFromExt(ext: string): string {
  if (ext === 'png') return 'image/png'
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'webm') return 'audio/webm'
  if (ext === 'pdf') return 'application/pdf'
  return 'application/octet-stream'
}

function sniffMime(buf: ArrayBuffer): string | null {
  const b = new Uint8Array(buf.slice(0, 12))
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png'
  if (b[0] === 0xff && b[1] === 0xd8) return 'image/jpeg'
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return 'application/pdf'
  return null
}

function buildAssetNotebookMap(payload: FormaLibraryPayload): Map<string, string> {
  const map = new Map<string, string>()
  for (const nb of payload.notebooks) {
    if (nb.pdfSourceAssetId) map.set(nb.pdfSourceAssetId, nb.id)
  }
  for (const p of payload.pages) {
    const page = normalizePage(p)
    if (page.pdfAssetId) map.set(page.pdfAssetId, page.notebookId)
    for (const img of page.images) {
      if (img.assetId) map.set(img.assetId, page.notebookId)
    }
  }
  for (const a of payload.audio) {
    if (a.assetId) map.set(a.assetId, a.notebookId)
  }
  return map
}

export async function importAssetsFromZip(
  zip: JSZip,
  notebookIds: Set<string>,
  payload?: Pick<FormaLibraryPayload, 'notebooks' | 'pages' | 'audio'>,
): Promise<void> {
  const defaultNb = [...notebookIds][0] ?? 'unknown'
  const assetNb = payload ? buildAssetNotebookMap(payload as FormaLibraryPayload) : new Map()
  for (const path of Object.keys(zip.files)) {
    if (!path.startsWith('assets/blobs/') || path.endsWith('/')) continue
    const f = zip.file(path)
    if (!f) continue
    const parts = path.split('/')
    const fileName = parts[parts.length - 1]
    const id = fileName.replace(/\.[^.]+$/, '')
    const buf = await f.async('arraybuffer')
    const ext = fileName.split('.').pop() ?? 'bin'
    const mime = sniffMime(buf) ?? mimeFromExt(ext)
    const notebookId = assetNb.get(id) ?? defaultNb
    await putAsset(id, notebookId, new Blob([buf], { type: mime }), mime)
  }
}

async function writeLibraryPackage(data: FormaLibraryPayload): Promise<Blob> {
  const zip = new JSZip()
  const written = new Set<string>()
  const nbIds = new Set(data.notebooks.map((n) => n.id))
  for (const asset of await db.assets.toArray()) {
    if (!nbIds.has(asset.notebookId)) continue
    const mime = asset.mimeType || asset.blob.type || 'application/octet-stream'
    const path = blobAssetPath(asset.id, mime)
    if (written.has(path)) continue
    written.add(path)
    zip.file(path, await blobToArrayBuffer(asset.blob))
  }

  const exportedAt = Date.now()

  const metadata: FormaMetadata = {
    folderCount: data.folders.length,
    notebookCount: data.notebooks.length,
    pageCount: data.pages.length,
  }
  zip.file('metadata.json', JSON.stringify(metadata, null, 0))

  zip.file('indexes/folders.json', JSON.stringify(data.folders))
  const slimNotebooks = data.notebooks.map((nb) => ({
    ...nb,
    pdfSourceDataUrl:
      isDataUrl(nb.pdfSourceDataUrl) ? undefined : nb.pdfSourceDataUrl,
  }))
  zip.file('indexes/notebooks.json', JSON.stringify(slimNotebooks))
  zip.file('indexes/audio.json', JSON.stringify(data.audio))
  zip.file('indexes/study.json', JSON.stringify(data.studyCards))
  zip.file('indexes/share-links.json', JSON.stringify(data.shareLinks))
  zip.file('indexes/snapshots.json', JSON.stringify(data.pageSnapshots))

  for (const nb of data.notebooks) {
    if (nb.pdfSourceAssetId) {
      const row = await db.assets.get(nb.pdfSourceAssetId)
      if (row) await ensureBlobAssetInZip(zip, nb.pdfSourceAssetId, row.blob, written)
      zip.file(
        `notebooks/${nb.id}.json`,
        JSON.stringify({ ...nb, pdfSourceDataUrl: undefined }),
      )
    } else if (isDataUrl(nb.pdfSourceDataUrl)) {
      const path = assetPath('pdf-source', nb.id, nb.pdfSourceDataUrl)
      if (!written.has(path)) {
        zip.file(path, await dataUrlToArrayBuffer(nb.pdfSourceDataUrl))
        written.add(path)
      }
      const nbOut = { ...nb, pdfSourceDataUrl: { assetRef: path }, pdfSourceAssetId: undefined }
      zip.file(`notebooks/${nb.id}.json`, JSON.stringify(nbOut))
    } else {
      zip.file(`notebooks/${nb.id}.json`, JSON.stringify(nb))
    }
  }

  for (const a of data.audio) {
    if (a.assetId) {
      const row = await db.assets.get(a.assetId)
      if (row) {
        await ensureBlobAssetInZip(zip, a.assetId, row.blob, written)
        zip.file(`audio/${a.id}.json`, JSON.stringify({ ...a, dataUrl: undefined }))
        continue
      }
    }
    if (isDataUrl(a.dataUrl)) {
      const path = assetPath('audio', a.id, a.dataUrl)
      if (!written.has(path)) {
        zip.file(path, await dataUrlToArrayBuffer(a.dataUrl))
        written.add(path)
      }
      zip.file(
        `audio/${a.id}.json`,
        JSON.stringify({ ...a, dataUrl: { assetRef: path }, assetId: undefined }),
      )
    } else {
      zip.file(`audio/${a.id}.json`, JSON.stringify(a))
    }
  }

  for (const page of data.pages) {
    const serialized = await serializePage(zip, page, written)
    zip.file(`pages/${page.id}.json`, JSON.stringify(serialized))
    if (page.strokes.length) {
      zip.file(`strokes/${page.id}.json`, JSON.stringify(page.strokes))
    }
  }

  // Rétrocompatibilité lecture ancienne app (inclus dans le digest)
  const legacy: FormaBackup = {
    version: 4,
    exportedAt,
    folders: data.folders,
    notebooks: data.notebooks,
    pages: data.pages,
    audio: data.audio,
    studyCards: data.studyCards,
    shareLinks: data.shareLinks,
    pageSnapshots: data.pageSnapshots,
  }
  zip.file('backup.json', JSON.stringify(legacy))

  const digest = await computeFormaPayloadDigest(zip)
  const manifest: FormaManifest = {
    formatVersion: FORMA_FORMAT_VERSION,
    appVersion: APP_VERSION,
    exportedAt,
    packageType: 'library',
    integrity: { algorithm: 'sha256', digest },
  }
  zip.file('manifest.json', JSON.stringify(manifest, null, 0))

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } })
}

export async function exportLibraryFormaPackage(data: FormaLibraryPayload): Promise<Blob> {
  return writeLibraryPackage(data)
}

export interface ImportFormaResult {
  notebooks: number
  pages: number
  skippedPages: number
  format: 'forma-v1' | 'backup-json' | 'legacy-notebook'
  validationIssues: FormaValidationIssue[]
}

async function readJsonFile<T>(zip: JSZip, path: string): Promise<T | null> {
  const f = zip.file(path)
  if (!f) return null
  try {
    return JSON.parse(await f.async('string')) as T
  } catch {
    return null
  }
}

export interface ImportFormaPackageOptions {
  /** ZIP déjà chargé (évite un second parse dans importBackupFile). */
  zip?: JSZip
}

/** Import avec récupération partielle (pages corrompues ignorées). */
export async function importFormaPackage(
  file: File | Blob,
  options?: ImportFormaPackageOptions,
): Promise<{
  data: FormaLibraryPayload
  result: ImportFormaResult
}> {
  const zip =
    options?.zip ?? (await JSZip.loadAsync(await file.arrayBuffer()))
  const zipValidation = await validateFormaZip(zip)

  const manifest = await readJsonFile<FormaManifest>(zip, 'manifest.json')
  if (manifest?.formatVersion === FORMA_FORMAT_VERSION && manifest.packageType === 'library') {
    const folders = (await readJsonFile<Folder[]>(zip, 'indexes/folders.json')) ?? []
    const notebooksRaw = (await readJsonFile<Notebook[]>(zip, 'indexes/notebooks.json')) ?? []
    const audioRaw = (await readJsonFile<AudioRecording[]>(zip, 'indexes/audio.json')) ?? []
    const studyCards = (await readJsonFile<StudyCard[]>(zip, 'indexes/study.json')) ?? []
    const shareLinks = (await readJsonFile<ShareLink[]>(zip, 'indexes/share-links.json')) ?? []
    const pageSnapshots =
      (await readJsonFile<PageSnapshot[]>(zip, 'indexes/snapshots.json')) ?? []

    const notebooks: Notebook[] = []
    for (const nb of notebooksRaw) {
      const detail = await readJsonFile<Record<string, unknown>>(zip, `notebooks/${nb.id}.json`)
      if (detail) {
        const resolved = { ...nb, ...detail } as Notebook
        const srcAssetId =
          typeof detail.pdfSourceAssetId === 'string' ? detail.pdfSourceAssetId : undefined
        if (srcAssetId && zipHasBlobAsset(zip, srcAssetId)) {
          resolved.pdfSourceAssetId = srcAssetId
          resolved.pdfSourceDataUrl = undefined
        } else if (detail.pdfSourceDataUrl && typeof detail.pdfSourceDataUrl === 'object') {
          const url = await assetRefToDataUrl(
            zip,
            (detail.pdfSourceDataUrl as AssetRef).assetRef,
          )
          if (url) {
            resolved.pdfSourceDataUrl = url
            resolved.pdfSourceAssetId = undefined
          }
        }
        notebooks.push(resolved)
      } else {
        notebooks.push(nb)
      }
    }

    const audio: AudioRecording[] = []
    for (const a of audioRaw) {
      const detail = await readJsonFile<Record<string, unknown>>(zip, `audio/${a.id}.json`)
      if (detail) {
        const rec = { ...a, ...detail } as AudioRecording
        const assetId = typeof detail.assetId === 'string' ? detail.assetId : undefined
        if (assetId && zipHasBlobAsset(zip, assetId)) {
          rec.assetId = assetId
          rec.dataUrl = undefined
        } else if (detail.dataUrl && typeof detail.dataUrl === 'object') {
          const dataUrl =
            (await assetRefToDataUrl(zip, (detail.dataUrl as AssetRef).assetRef)) ?? a.dataUrl
          rec.dataUrl = dataUrl
          rec.assetId = undefined
        }
        audio.push(rec)
      } else {
        audio.push(a)
      }
    }

    const pageFiles = Object.keys(zip.files).filter(
      (p) => p.startsWith('pages/') && p.endsWith('.json'),
    )
    const pages: Page[] = []
    let skippedPages = 0
    for (const path of pageFiles) {
      try {
        const raw = await readJsonFile<Record<string, unknown>>(zip, path)
        if (!raw) {
          skippedPages++
          continue
        }
        const strokeFile = zip.file(`strokes/${raw.id as string}.json`)
        if (strokeFile) {
          raw.strokes = JSON.parse(await strokeFile.async('string'))
        }
        pages.push(await resolvePage(raw, zip))
      } catch {
        skippedPages++
      }
    }

    return {
      data: {
        folders,
        notebooks,
        pages,
        audio,
        studyCards,
        shareLinks,
        pageSnapshots,
      },
      result: {
        notebooks: notebooks.length,
        pages: pages.length,
        skippedPages,
        format: 'forma-v1',
        validationIssues: zipValidation.issues,
      },
    }
  }

  const backup = await readJsonFile<FormaBackup>(zip, 'backup.json')
  if (backup?.notebooks) {
    return {
      data: {
        folders: backup.folders ?? [],
        notebooks: backup.notebooks ?? [],
        pages: (backup.pages ?? []).map(normalizePage),
        audio: backup.audio ?? [],
        studyCards: backup.studyCards ?? [],
        shareLinks: backup.shareLinks ?? [],
        pageSnapshots: backup.pageSnapshots ?? [],
      },
      result: {
        notebooks: backup.notebooks.length,
        pages: backup.pages?.length ?? 0,
        skippedPages: 0,
        format: 'backup-json',
        validationIssues: zipValidation.issues,
      },
    }
  }

  const legacyManifest = await readJsonFile<{
    notebook: Notebook
    pages: Page[]
    studyCards?: StudyCard[]
    audio?: AudioRecording[]
    pageSnapshots?: PageSnapshot[]
  }>(zip, 'manifest.json')
  if (legacyManifest?.notebook) {
    return {
      data: {
        folders: [],
        notebooks: [legacyManifest.notebook],
        pages: (legacyManifest.pages ?? []).map(normalizePage),
        audio: legacyManifest.audio ?? [],
        studyCards: legacyManifest.studyCards ?? [],
        shareLinks: [],
        pageSnapshots: legacyManifest.pageSnapshots ?? [],
      },
      result: {
        notebooks: 1,
        pages: legacyManifest.pages?.length ?? 0,
        skippedPages: 0,
        format: 'legacy-notebook',
        validationIssues: zipValidation.issues,
      },
    }
  }

  const errMsg = zipValidation.issues.find((i) => i.severity === 'error')?.message
  throw new Error(errMsg ?? 'Archive .forma invalide ou non reconnue')
}
