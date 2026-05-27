/** FormaReview — import PDF/images multi-formats */

import { createPage } from './model'

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error(`Lecture impossible : ${file.name}`))
    reader.readAsDataURL(file)
  })
}

function loadImageSize(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => reject(new Error('Image invalide'))
    img.src = dataUrl
  })
}

async function getPdfJs() {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString()
  return pdfjs
}

async function importPdfFile(file) {
  const pdfjs = await getPdfJs()
  const data = await file.arrayBuffer()
  const doc = await pdfjs.getDocument({ data }).promise
  const pages = []
  for (let i = 1; i <= doc.numPages; i += 1) {
    const page = await doc.getPage(i)
    const scale = 2
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)
    const ctx = canvas.getContext('2d')
    await page.render({ canvasContext: ctx, viewport }).promise
    const dataUrl = canvas.toDataURL('image/png')
    const baseName = file.name.replace(/\.[^.]+$/, '')
    pages.push(createPage({
      name: doc.numPages > 1 ? `${baseName} — p.${i}` : baseName,
      dataUrl,
      width: Math.ceil(viewport.width / scale),
      height: Math.ceil(viewport.height / scale),
    }))
  }
  return pages
}

export async function importImageFile(file) {
  const dataUrl = await readFileAsDataUrl(file)
  const size = await loadImageSize(dataUrl)
  return createPage({
    name: file.name.replace(/\.[^.]+$/, ''),
    dataUrl,
    width: size.width,
    height: size.height,
  })
}

export async function importFiles(files) {
  const pages = []
  for (const file of Array.from(files || [])) {
    if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
      pages.push(...await importPdfFile(file))
    } else if (file.type.startsWith('image/')) {
      pages.push(await importImageFile(file))
    }
  }
  if (!pages.length) throw new Error('Aucun fichier valide (PDF, PNG, JPG, WebP…)')
  return pages
}

/** Import depuis FormaLibrary (dataUrl + dimensions) */
export function importFromLibraryItem(item) {
  if (!item?.dataUrl && !item?.previewUrl) throw new Error('Fichier sans aperçu')
  return createPage({
    name: item.name || 'Document',
    dataUrl: item.dataUrl || item.previewUrl,
    width: item.metadata?.width || item.width || 794,
    height: item.metadata?.height || item.height || 1123,
  })
}
