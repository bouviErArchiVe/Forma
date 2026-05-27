/** FormaLibrary — import fichiers et sources Forma */

import { createItem } from './model'
import { autoClassify } from './classify'
import { listDocs } from '@/lib/docs/persistence'
import { listSheets } from '@/lib/spreadsheet/persistence'

async function getPdfJs() {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString()
  return pdfjs
}

async function extractPdfText(file) {
  try {
    const pdfjs = await getPdfJs()
    const data = await file.arrayBuffer()
    const doc = await pdfjs.getDocument({ data }).promise
    const parts = []
    for (let i = 1; i <= Math.min(doc.numPages, 20); i += 1) {
      const page = await doc.getPage(i)
      const content = await page.getTextContent()
      parts.push(content.items.map((it) => it.str).join(' '))
    }
    return parts.join('\n')
  } catch {
    return ''
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

export async function importFile(file, folderId) {
  const name = file.name || 'fichier'
  const mime = file.type || ''
  let textContent = ''
  let dataUrl = null
  let pageCount = 0

  if (mime.includes('pdf') || /\.pdf$/i.test(name)) {
    textContent = await extractPdfText(file)
    dataUrl = await readFileAsDataUrl(file)
    try {
      const pdfjs = await getPdfJs()
      const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
      pageCount = doc.numPages
    } catch { /* ignore */ }
  } else if (mime.startsWith('image/') || mime.includes('svg') || /\.(png|jpe?g|webp|svg)$/i.test(name)) {
    dataUrl = await readFileAsDataUrl(file)
  } else if (/\.dwg|\.dxf$/i.test(name)) {
    dataUrl = null
    textContent = `Fichier CAO : ${name} (aperçu DWG non disponible — ouvrir dans un logiciel CAO)`
  } else {
    try {
      textContent = await file.text()
    } catch {
      dataUrl = await readFileAsDataUrl(file)
    }
  }

  const { category, tags } = autoClassify({ name, textContent, mimeType: mime })

  return createItem({
    folderId,
    name: name.replace(/\.[^.]+$/, ''),
    category,
    mimeType: mime || null,
    tags,
    dataUrl,
    previewUrl: dataUrl,
    textContent: textContent.slice(0, 50000),
    size: file.size || 0,
    pageCount,
    metadata: { fileName: name },
  })
}

export async function importFiles(files, folderId) {
  const list = Array.from(files || [])
  const items = []
  for (const file of list) {
    items.push(await importFile(file, folderId))
  }
  return items
}

export function listInternalSources() {
  return {
    doc: listDocs().map((d) => ({ id: d.id, name: d.name, type: 'doc' })),
    sheet: listSheets().map((s) => ({ id: s.id, name: s.name, type: 'sheet' })),
  }
}

export function linkInternalSource(item, folderId) {
  const catMap = { doc: 'doc', sheet: 'sheet' }
  return createItem({
    folderId,
    name: item.name,
    category: catMap[item.type] || 'reference',
    tags: ['Forma', item.type],
    refModule: item.type,
    refId: item.id,
    textContent: `Lien ${item.type} : ${item.name}`,
    metadata: { linked: true },
  })
}
