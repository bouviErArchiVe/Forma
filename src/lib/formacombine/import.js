/** FormaCombine — import fichiers et sources Forma */

import JSZip from 'jszip'
import html2canvas from 'html2canvas'
import { getDoc, listDocs } from '@/lib/docs/persistence'
import { getSheet, listSheets } from '@/lib/spreadsheet/persistence'
import { getProformaDoc, listProformaDocs } from '@/lib/proforma/persistence'
import { docToDataUrl } from '@/lib/proforma/render'
import { loadLocalNotebooks, loadLocalPages } from '@/lib/projectPersistence'
import { safeGetLocalStorage, safeJsonParse } from '@/lib/storage'
import { createPage, loadImageDimensions, textPage } from './model'

async function getPdfJs() {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString()
  return pdfjs
}

async function importPdfPages(file, onProgress) {
  const pdfjs = await getPdfJs()
  const data = await file.arrayBuffer()
  const doc = await pdfjs.getDocument({ data }).promise
  const pages = []
  for (let i = 1; i <= doc.numPages; i += 1) {
    const page = await doc.getPage(i)
    const viewport = page.getViewport({ scale: 2 })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')
    await page.render({ canvasContext: ctx, viewport }).promise
    const dataUrl = canvas.toDataURL('image/png')
    pages.push(createPage({
      name: `${file.name.replace(/\.pdf$/i, '')} — p.${i}`,
      type: 'raster',
      width: viewport.width,
      height: viewport.height,
      dataUrl,
      sourceType: 'pdf',
      sourceRef: file.name,
    }))
    if (onProgress) onProgress(Math.round((i / doc.numPages) * 100))
  }
  return pages
}

async function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

async function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = reject
    r.readAsText(file)
  })
}

async function extractDocxText(file) {
  const zip = await JSZip.loadAsync(await file.arrayBuffer())
  const xml = await zip.file('word/document.xml')?.async('string')
  if (!xml) throw new Error('DOCX invalide')
  return xml
    .replace(/<w:tab[^/]*\/>/g, '\t')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function renderDocPages(doc) {
  const out = []
  for (let i = 0; i < doc.pages.length; i += 1) {
    const pg = doc.pages[i]
    const el = document.createElement('div')
    el.style.cssText = `width:794px;min-height:1123px;padding:48px;background:#fff;font-family:${doc.fontFamily || 'Inter, sans-serif'};font-size:${doc.fontSize || 14}px;line-height:${doc.lineHeight || 1.6};box-sizing:border-box;position:fixed;left:-9999px;top:0`
    el.innerHTML = pg.html || '<p></p>'
    document.body.appendChild(el)
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
    document.body.removeChild(el)
    out.push(createPage({
      name: `${doc.name} — p.${i + 1}`,
      type: 'raster',
      width: canvas.width,
      height: canvas.height,
      dataUrl: canvas.toDataURL('image/png'),
      sourceType: 'formadoc',
      sourceRef: doc.id,
    }))
  }
  return out
}

async function renderSheetPage(sheet) {
  const { getCell } = await import('@/lib/spreadsheet/model')
  const rows = sheet.rows || 20
  const cols = sheet.cols || 8
  let html = '<table style="border-collapse:collapse;font-family:Inter,sans-serif;font-size:12px">'
  for (let r = 0; r < rows; r += 1) {
    html += '<tr>'
    for (let c = 0; c < cols; c += 1) {
      const cell = getCell(sheet, r, c)
      const val = cell?.value ?? cell?.raw ?? ''
      const bg = cell?.style?.bg || '#fff'
      const bold = cell?.style?.bold ? 'font-weight:bold;' : ''
      html += `<td style="border:1px solid #ccc;padding:4px 8px;min-width:64px;${bold}background:${bg}">${String(val).replace(/</g, '&lt;')}</td>`
    }
    html += '</tr>'
  }
  html += '</table>'
  const el = document.createElement('div')
  el.style.cssText = 'padding:24px;background:#fff;position:fixed;left:-9999px;top:0'
  el.innerHTML = html
  document.body.appendChild(el)
  const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
  document.body.removeChild(el)
  return createPage({
    name: sheet.name || 'FormaTab',
    type: 'raster',
    width: canvas.width,
    height: canvas.height,
    dataUrl: canvas.toDataURL('image/png'),
    sourceType: 'formatab',
    sourceRef: sheet.id,
  })
}

function loadFormaPageCanvas(pageId) {
  try {
    const raw = safeGetLocalStorage(`forma_page_${pageId}`, null)
    if (!raw) return null
    const data = safeJsonParse(raw, null)
    return data?.canvasData || null
  } catch {
    return null
  }
}

/** Importe un ou plusieurs fichiers locaux. */
export async function importFiles(files, onProgress) {
  const list = Array.from(files || [])
  const pages = []
  let done = 0
  for (const file of list) {
    const name = file.name || 'fichier'
    try {
      if (file.type === 'application/pdf' || /\.pdf$/i.test(name)) {
        const pdfPages = await importPdfPages(file, (pct) => {
          if (onProgress) onProgress(Math.round(((done + pct / 100) / list.length) * 100))
        })
        pages.push(...pdfPages)
      } else if (file.type?.startsWith('image/')) {
        const dataUrl = await readFileAsDataUrl(file)
        const dim = await loadImageDimensions(dataUrl)
        pages.push(createPage({
          name,
          type: 'raster',
          width: dim.width,
          height: dim.height,
          dataUrl,
          sourceType: 'image',
        }))
      } else if (/\.docx$/i.test(name)) {
        const text = await extractDocxText(file)
        pages.push(textPage(text, name.replace(/\.docx$/i, '')))
      } else if (file.type?.startsWith('text/') || /\.(txt|md|csv)$/i.test(name)) {
        const text = await readFileAsText(file)
        pages.push(textPage(text, name.replace(/\.[^.]+$/, '')))
      } else {
        throw new Error(`Format non supporté : ${name}`)
      }
    } catch (err) {
      throw new Error(err?.message || `Import échoué : ${name}`)
    }
    done += 1
    if (onProgress) onProgress(Math.round((done / list.length) * 100))
  }
  return pages
}

export async function importProforma(id) {
  const doc = getProformaDoc(id)
  if (!doc) throw new Error('Proforma introuvable')
  const dataUrl = docToDataUrl(doc)
  return [createPage({
    name: doc.name || 'Proforma',
    type: 'raster',
    width: doc.width,
    height: doc.height,
    dataUrl,
    sourceType: 'proforma',
    sourceRef: id,
  })]
}

export async function importFormaDoc(id) {
  const doc = getDoc(id)
  if (!doc) throw new Error('FormaDoc introuvable')
  return renderDocPages(doc)
}

export async function importFormaTab(id) {
  const sheet = getSheet(id)
  if (!sheet) throw new Error('FormaTab introuvable')
  return [await renderSheetPage(sheet)]
}

export async function importFormaNotebookPage(nbId, pageId, pageLabel) {
  const canvasData = loadFormaPageCanvas(pageId)
  if (canvasData) {
    const dim = await loadImageDimensions(canvasData)
    return [createPage({
      name: pageLabel || 'Page Forma',
      type: 'raster',
      width: dim.width,
      height: dim.height,
      dataUrl: canvasData,
      sourceType: 'forma',
      sourceRef: `${nbId}:${pageId}`,
    })]
  }
  return [textPage(`Page Forma : ${pageLabel}\n(Aperçu local non disponible — ouvrez la page dans l'éditeur pour l'enregistrer.)`, pageLabel || 'Page Forma')]
}

export function listInternalSources() {
  return {
    proforma: listProformaDocs().map((d) => ({ id: d.id, name: d.name, type: 'proforma' })),
    formadoc: listDocs().map((d) => ({ id: d.id, name: d.name, type: 'formadoc' })),
    formatab: listSheets().map((d) => ({ id: d.id, name: d.name, type: 'formatab' })),
    forma: loadLocalNotebooks().flatMap((nb) => {
      const pages = loadLocalPages(nb.id)
      return pages.map((p) => ({
        id: `${nb.id}:${p.id}`,
        nbId: nb.id,
        pageId: p.id,
        name: `${nb.title || 'Carnet'} — p.${p.page_number ?? '?'}`,
        type: 'forma',
      }))
    }),
  }
}

export async function importInternalSource(item) {
  if (item.type === 'proforma') return importProforma(item.id)
  if (item.type === 'formadoc') return importFormaDoc(item.id)
  if (item.type === 'formatab') return importFormaTab(item.id)
  if (item.type === 'forma') return importFormaNotebookPage(item.nbId, item.pageId, item.name)
  return []
}
