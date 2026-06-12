/**
 * merge-pdf — fusion d'une liste ordonnée de PDF et d'images en un seul PDF.
 *
 * Logique pure (pdf-lib), testable sans UI :
 * - PDF  → toutes les pages copiées via `copyPages`.
 * - PNG/JPEG → page aux dimensions de l'image (`embedPng` / `embedJpg`).
 * - WebP (ou format inconnu) → rasterisé sur canvas → PNG (navigateur uniquement).
 *
 * Sans `onItemError`, un item illisible fait échouer la fusion avec une
 * erreur propre mentionnant son nom. Avec `onItemError`, l'item est signalé
 * puis ignoré et la fusion continue.
 */
import { PDFDocument } from 'pdf-lib'

export interface MergeInputItem {
  blob: Blob
  kind: 'pdf' | 'image'
  name: string
}

export interface MergeItemFailure {
  index: number
  name: string
  error: unknown
}

export interface MergeOptions {
  /** Si fourni : item illisible signalé puis ignoré (la fusion continue). */
  onItemError?: (failure: MergeItemFailure) => void
}

async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === 'function') {
    return blob.arrayBuffer()
  }
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(reader.error ?? new Error('Lecture du blob impossible'))
    reader.readAsArrayBuffer(blob)
  })
}

type ImageFormat = 'png' | 'jpg' | 'webp' | 'unknown'

/** Détection par octets magiques (plus fiable que le mimeType). */
function sniffImageFormat(bytes: Uint8Array): ImageFormat {
  if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'png'
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'jpg'
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && // RIFF
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50 // WEBP
  ) {
    return 'webp'
  }
  return 'unknown'
}

/** Rasterise une image (webp…) sur canvas → octets PNG. Navigateur uniquement. */
async function imageToPngBytesViaCanvas(blob: Blob): Promise<ArrayBuffer> {
  const bitmap = await createImageBitmap(blob)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D indisponible')
    ctx.drawImage(bitmap, 0, 0)
    const dataUrl = canvas.toDataURL('image/png')
    canvas.width = 0
    canvas.height = 0
    const comma = dataUrl.indexOf(',')
    const binary = atob(dataUrl.slice(comma + 1))
    const out = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
    return out.buffer
  } finally {
    bitmap.close()
  }
}

async function appendPdf(out: PDFDocument, blob: Blob): Promise<void> {
  const bytes = await blobToArrayBuffer(blob)
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true })
  const pages = await out.copyPages(src, src.getPageIndices())
  for (const page of pages) out.addPage(page)
}

async function appendImage(out: PDFDocument, blob: Blob): Promise<void> {
  const buf = await blobToArrayBuffer(blob)
  const format = sniffImageFormat(new Uint8Array(buf))
  const embedded =
    format === 'png'
      ? await out.embedPng(buf)
      : format === 'jpg'
        ? await out.embedJpg(buf)
        : await out.embedPng(await imageToPngBytesViaCanvas(blob))
  const page = out.addPage([embedded.width, embedded.height])
  page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height })
}

/**
 * Fusionne les items (dans l'ordre du tableau) en un PDF unique.
 * @returns octets du PDF final (`PDFDocument.save()`).
 */
export async function mergeToPdf(items: MergeInputItem[], options?: MergeOptions): Promise<Uint8Array> {
  if (items.length === 0) {
    throw new Error('Aucun élément à fusionner')
  }
  const out = await PDFDocument.create()
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    try {
      if (item.kind === 'pdf') {
        await appendPdf(out, item.blob)
      } else {
        await appendImage(out, item.blob)
      }
    } catch (error) {
      if (options?.onItemError) {
        options.onItemError({ index: i, name: item.name, error })
        continue
      }
      throw new Error(`Élément « ${item.name} » illisible — fusion annulée`, { cause: error })
    }
  }
  if (out.getPageCount() === 0) {
    throw new Error('Aucune page valide à fusionner')
  }
  return out.save()
}
