import { createPage } from './model'

const MAX_PREVIEW_EDGE = 2048
const MAX_FILE_MB = 80

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error(`Lecture impossible : ${file.name}`))
    reader.readAsDataURL(file)
  })
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image invalide'))
    img.src = dataUrl
  })
}

function fitScale(w: number, h: number, maxEdge = MAX_PREVIEW_EDGE): number {
  const m = Math.max(w, h, 1)
  if (m <= maxEdge) return 1
  return maxEdge / m
}

async function toPreviewDataUrl(
  src: string,
  naturalW: number,
  naturalH: number,
): Promise<{ dataUrl: string; width: number; height: number; previewScale: number }> {
  const scale = fitScale(naturalW, naturalH)
  if (scale >= 1) return { dataUrl: src, width: naturalW, height: naturalH, previewScale: 1 }
  const w = Math.max(1, Math.round(naturalW * scale))
  const h = Math.max(1, Math.round(naturalH * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  const img = await loadImage(src)
  ctx?.drawImage(img, 0, 0, w, h)
  return {
    dataUrl: canvas.toDataURL('image/jpeg', 0.88),
    width: naturalW,
    height: naturalH,
    previewScale: scale,
  }
}

function assertFileSize(file: File): void {
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    throw new Error(`Fichier trop lourd (max ${MAX_FILE_MB} Mo).`)
  }
}

async function getPdfJs() {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString()
  return pdfjs
}

async function importPdfFile(file: File) {
  assertFileSize(file)
  const pdfjs = await getPdfJs()
  const data = await file.arrayBuffer()
  const doc = await pdfjs.getDocument({ data }).promise
  const pages = []
  const baseName = file.name.replace(/\.[^.]+$/, '')

  for (let i = 1; i <= doc.numPages; i += 1) {
    const page = await doc.getPage(i)
    const baseVp = page.getViewport({ scale: 1 })
    const renderScale = Math.min(1.5, fitScale(baseVp.width, baseVp.height) * 1.25)
    const viewport = page.getViewport({ scale: renderScale })
    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)
    const ctx = canvas.getContext('2d')
    await page.render({ canvasContext: ctx!, viewport, canvas }).promise
    const raw = canvas.toDataURL('image/png')
    const preview = await toPreviewDataUrl(raw, baseVp.width, baseVp.height)
    pages.push(
      createPage({
        name: doc.numPages > 1 ? `${baseName} — p.${i}` : baseName,
        dataUrl: preview.dataUrl,
        width: preview.width,
        height: preview.height,
        previewScale: preview.previewScale,
      }),
    )
  }
  return pages
}

export async function importImageFile(file: File) {
  assertFileSize(file)
  const raw = await readFileAsDataUrl(file)
  const img = await loadImage(raw)
  const preview = await toPreviewDataUrl(raw, img.naturalWidth, img.naturalHeight)
  return createPage({
    name: file.name.replace(/\.[^.]+$/, ''),
    dataUrl: preview.dataUrl,
    width: preview.width,
    height: preview.height,
    previewScale: preview.previewScale,
  })
}

export async function importReviewFiles(files: FileList | File[]) {
  const pages = []
  for (const file of Array.from(files || [])) {
    if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
      pages.push(...(await importPdfFile(file)))
    } else if (file.type.startsWith('image/')) {
      pages.push(await importImageFile(file))
    }
  }
  if (!pages.length) throw new Error('Aucun fichier valide (PDF, PNG, JPG, WebP…)')
  return pages
}
