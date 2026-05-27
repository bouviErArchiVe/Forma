/** OCR — Tesseract + PDF (lazy load, jamais au boot). */

export const PDF_MAX_PAGES = 12

let tesseractModule = null
let pdfjsModule = null

export function mapLangToTesseract(lang) {
  if (!lang) return 'fra+eng'
  const id = String(lang).toLowerCase().replace(/[-_].*/, '').slice(0, 2)
  if (id === 'fr') return 'fra+eng'
  if (id === 'en') return 'eng+fra'
  return 'fra+eng'
}

async function getTesseract() {
  if (!tesseractModule) tesseractModule = await import('tesseract.js')
  return tesseractModule
}

async function getPdfJs() {
  if (!pdfjsModule) {
    pdfjsModule = await import('pdfjs-dist')
    pdfjsModule.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).toString()
  }
  return pdfjsModule
}

async function openPdfDocument(file) {
  const pdfjs = await getPdfJs()
  const data = await file.arrayBuffer()
  const doc = await pdfjs.getDocument({ data }).promise
  return doc
}

async function renderPdfPageToCanvas(doc, pageNum, scale = 2) {
  const safePage = Math.min(Math.max(1, pageNum), doc.numPages)
  const page = await doc.getPage(safePage)
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  const ctx = canvas.getContext('2d')
  await page.render({ canvasContext: ctx, viewport }).promise
  return {
    canvas,
    dataUrl: canvas.toDataURL('image/png'),
    pageCount: doc.numPages,
    pageNum: safePage,
  }
}

/**
 * @param {string|Blob|File|HTMLCanvasElement} imageSource
 * @param {string} language — code Tesseract (fra, eng, fra+eng…)
 * @param {(pct: number) => void} [onProgress]
 * @param {import('tesseract.js').Worker} [worker] — worker réutilisable (multi-pages)
 */
export async function recognizeText(imageSource, language = 'fra+eng', onProgress, worker = null) {
  const ownsWorker = !worker
  let activeWorker = worker
  if (!activeWorker) {
    const { createWorker } = await getTesseract()
    activeWorker = await createWorker(language, 1, {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(Math.round(m.progress * 100))
        }
      },
    })
  }

  try {
    const { data } = await activeWorker.recognize(imageSource)
    return data.text?.trim() || ''
  } finally {
    if (ownsWorker) await activeWorker.terminate()
  }
}

/** Extraction texte natif PDF (pas d'OCR). */
export async function extractPdfNativeText(file, maxPages = PDF_MAX_PAGES) {
  const doc = await openPdfDocument(file)
  const parts = []
  const pageCount = Math.min(doc.numPages, maxPages)
  for (let i = 1; i <= pageCount; i += 1) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    const text = content.items
      .map((item) => item.str)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (text) parts.push(text)
  }
  const text = parts.join('\n\n').trim()
  const truncated = doc.numPages > maxPages
  return {
    text: truncated ? `${text}\n\n— (${maxPages}/${doc.numPages} pages extraites)` : text,
    pageCount: doc.numPages,
    pagesProcessed: pageCount,
  }
}

/** Rasterise une page PDF pour OCR ou aperçu. */
export async function rasterizePdfPage(file, pageNum = 1, scale = 2) {
  const doc = await openPdfDocument(file)
  return renderPdfPageToCanvas(doc, pageNum, scale)
}

/** OCR raster sur toutes les pages (jusqu'à maxPages). Un seul worker Tesseract. */
export async function ocrPdfPages(file, lang = 'fr', onProgress, maxPages = PDF_MAX_PAGES) {
  const doc = await openPdfDocument(file)
  const pageCount = doc.numPages
  const pagesToProcess = Math.min(pageCount, maxPages)
  const tessLang = mapLangToTesseract(lang)
  const { createWorker } = await getTesseract()

  let currentPage = 0
  const worker = await createWorker(tessLang, 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress && pagesToProcess > 0) {
        const frac = (currentPage - 1 + m.progress) / pagesToProcess
        onProgress(Math.round(Math.min(100, frac * 100)))
      }
    },
  })

  const parts = []
  let previewUrl = null

  try {
    for (let i = 1; i <= pagesToProcess; i += 1) {
      currentPage = i
      const { dataUrl } = await renderPdfPageToCanvas(doc, i)
      if (!previewUrl) previewUrl = dataUrl

      const text = await recognizeText(dataUrl, tessLang, null, worker)
      if (text) {
        parts.push(pageCount > 1 ? `--- Page ${i}/${pageCount} ---\n${text}` : text)
      }

      if (onProgress) onProgress(Math.round((i / pagesToProcess) * 100))
    }
  } finally {
    await worker.terminate()
  }

  let text = parts.join('\n\n').trim()
  if (pageCount > maxPages) {
    text = `${text}\n\n— (OCR ${pagesToProcess}/${pageCount} pages)`
  }

  return {
    text,
    method: 'pdf-ocr',
    previewUrl,
    pageCount,
    pagesProcessed: pagesToProcess,
  }
}

function isPdfFile(file) {
  return file?.type === 'application/pdf' || /\.pdf$/i.test(file?.name || '')
}

/**
 * Pipeline fichier → texte (image directe, PDF natif ou raster + OCR).
 * @returns {{ text: string, method: string, previewUrl?: string, pageCount?: number, pagesProcessed?: number, error?: string }}
 */
export async function recognizeFromFile(file, lang = 'fr', onProgress) {
  if (!file) return { text: '', method: 'failed', error: 'Fichier manquant' }

  const tessLang = mapLangToTesseract(lang)

  if (isPdfFile(file)) {
    try {
      const native = await extractPdfNativeText(file)
      if (native.text.length > 24) {
        return {
          text: native.text,
          method: 'pdf-native',
          pageCount: native.pageCount,
          pagesProcessed: native.pagesProcessed,
        }
      }
    } catch {
      /* fallback OCR */
    }

    try {
      const out = await ocrPdfPages(file, lang, onProgress)
      if (out.text) return out
      return {
        text: '',
        method: 'failed',
        error: 'OCR sans résultat sur ce PDF',
        previewUrl: out.previewUrl,
        pageCount: out.pageCount,
        pagesProcessed: out.pagesProcessed,
      }
    } catch (err) {
      return { text: '', method: 'failed', error: err?.message || 'PDF illisible' }
    }
  }

  if (file.type?.startsWith('image/')) {
    const text = await recognizeText(file, tessLang, onProgress)
    return { text, method: 'image-ocr' }
  }

  return { text: '', method: 'failed', error: 'Format non supporté (image ou PDF)' }
}
