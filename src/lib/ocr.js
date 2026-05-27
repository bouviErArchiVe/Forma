/** OCR — Tesseract + PDF (lazy load, jamais au boot). */

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

/**
 * @param {string|Blob|File|HTMLCanvasElement} imageSource
 * @param {string} language — code Tesseract (fra, eng, fra+eng…)
 * @param {(pct: number) => void} [onProgress]
 */
export async function recognizeText(imageSource, language = 'fra+eng', onProgress) {
  const { createWorker } = await getTesseract()
  const worker = await createWorker(language, 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100))
      }
    },
  })
  try {
    const { data } = await worker.recognize(imageSource)
    return data.text?.trim() || ''
  } finally {
    await worker.terminate()
  }
}

/** Extraction texte natif PDF (pas d'OCR). */
export async function extractPdfNativeText(file, maxPages = 12) {
  const pdfjs = await getPdfJs()
  const data = await file.arrayBuffer()
  const doc = await pdfjs.getDocument({ data }).promise
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
  return { text: parts.join('\n\n').trim(), pageCount: doc.numPages }
}

/** Rasterise une page PDF pour OCR ou aperçu. */
export async function rasterizePdfPage(file, pageNum = 1, scale = 2) {
  const pdfjs = await getPdfJs()
  const data = await file.arrayBuffer()
  const doc = await pdfjs.getDocument({ data }).promise
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

function isPdfFile(file) {
  return file?.type === 'application/pdf' || /\.pdf$/i.test(file?.name || '')
}

/**
 * Pipeline fichier → texte (image directe, PDF natif ou raster + OCR).
 * @returns {{ text: string, method: string, previewUrl?: string, pageCount?: number, error?: string }}
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
        }
      }
    } catch {
      /* fallback OCR */
    }

    try {
      const { dataUrl, pageCount, pageNum } = await rasterizePdfPage(file, 1)
      const text = await recognizeText(dataUrl, tessLang, onProgress)
      if (text) {
        const suffix = pageCount > 1 ? `\n\n— (OCR page ${pageNum}/${pageCount})` : ''
        return {
          text: `${text}${suffix}`,
          method: 'pdf-ocr',
          previewUrl: dataUrl,
          pageCount,
        }
      }
      return { text: '', method: 'failed', error: 'OCR sans résultat sur ce PDF', previewUrl: dataUrl, pageCount }
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
