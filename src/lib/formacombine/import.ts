import JSZip from 'jszip'
import { db } from '../../db'
import { docToPlainText } from '../docs/htmlUtils'
import { getDocument, listDocuments } from '../../services/formadoc'
import { getSheet, listSheets } from '../../services/formatab'
import type { FormaCombinePage, FormaDocument, FormaSheet, InternalCombineSource, Notebook } from '../../types'
import { createPage, loadImageDimensions, textPage } from './model'

async function getPdfJs() {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString()
  return pdfjs
}

async function importPdfPages(file: File): Promise<FormaCombinePage[]> {
  const pdfjs = await getPdfJs()
  const data = await file.arrayBuffer()
  const doc = await pdfjs.getDocument({ data }).promise
  const pages: FormaCombinePage[] = []
  for (let i = 1; i <= doc.numPages; i += 1) {
    const page = await doc.getPage(i)
    const viewport = page.getViewport({ scale: 2 })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')
    await page.render({ canvasContext: ctx!, viewport, canvas }).promise
    const dataUrl = canvas.toDataURL('image/png')
    pages.push(
      createPage({
        name: `${file.name.replace(/\.pdf$/i, '')} — p.${i}`,
        type: 'raster',
        width: viewport.width,
        height: viewport.height,
        dataUrl,
        sourceType: 'pdf',
        sourceRef: file.name,
      }),
    )
  }
  return pages
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error(`Lecture impossible : ${file.name}`))
    reader.readAsDataURL(file)
  })
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error(`Lecture impossible : ${file.name}`))
    reader.readAsText(file)
  })
}

async function extractDocxText(file: File): Promise<string> {
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

export async function importCombineFiles(files: FileList | File[]): Promise<FormaCombinePage[]> {
  const list = Array.from(files || [])
  const pages: FormaCombinePage[] = []
  for (const file of list) {
    const name = file.name || 'fichier'
    if (file.type === 'application/pdf' || /\.pdf$/i.test(name)) {
      pages.push(...(await importPdfPages(file)))
    } else if (file.type.startsWith('image/')) {
      const dataUrl = await readFileAsDataUrl(file)
      const dim = await loadImageDimensions(dataUrl)
      pages.push(
        createPage({
          name,
          type: 'raster',
          width: dim.width,
          height: dim.height,
          dataUrl,
          sourceType: 'image',
        }),
      )
    } else if (/\.docx$/i.test(name)) {
      const text = await extractDocxText(file)
      pages.push(textPage(text, name.replace(/\.docx$/i, '')))
    } else if (file.type.startsWith('text/') || /\.(txt|md|csv)$/i.test(name)) {
      const text = await readFileAsText(file)
      pages.push(textPage(text, name.replace(/\.[^.]+$/, '')))
    } else {
      throw new Error(`Format non supporté : ${name}`)
    }
  }
  return pages
}

function sheetToText(sheet: Awaited<ReturnType<typeof getSheet>>): string {
  if (!sheet) return ''
  const lines: string[] = []
  for (let r = 0; r < sheet.rows; r += 1) {
    const cols: string[] = []
    for (let c = 0; c < sheet.cols; c += 1) {
      const key = `${r},${c}`
      cols.push(sheet.cells[key]?.raw || '')
    }
    if (cols.some((v) => v.trim())) lines.push(cols.join('\t'))
  }
  return lines.join('\n')
}

export async function listInternalSources(): Promise<{
  formadoc: InternalCombineSource[]
  formatab: InternalCombineSource[]
  forma: InternalCombineSource[]
}> {
  const [docs, sheets, notebooks] = await Promise.all([
    listDocuments(),
    listSheets(),
    db.notebooks.filter((n: Notebook) => !n.deletedAt).toArray(),
  ])

  const forma: InternalCombineSource[] = []
  for (const nb of notebooks) {
    const pages = await db.pages.where('notebookId').equals(nb.id).sortBy('order')
    for (const p of pages) {
      forma.push({
        id: `${nb.id}:${p.id}`,
        nbId: nb.id,
        pageId: p.id,
        name: `${nb.name} — page ${p.order + 1}`,
        type: 'forma',
      })
    }
  }

  return {
    formadoc: docs.map((d: FormaDocument) => ({ id: d.id, name: d.name, type: 'formadoc' as const })),
    formatab: sheets.map((s: FormaSheet) => ({ id: s.id, name: s.name, type: 'formatab' as const })),
    forma,
  }
}

export async function importInternalSource(item: InternalCombineSource): Promise<FormaCombinePage[]> {
  if (item.type === 'formadoc') {
    const doc = await getDocument(item.id)
    if (!doc) throw new Error('FormaDoc introuvable')
    return [textPage(docToPlainText(doc), doc.name)]
  }
  if (item.type === 'formatab') {
    const sheet = await getSheet(item.id)
    if (!sheet) throw new Error('FormaTab introuvable')
    return [textPage(sheetToText(sheet), sheet.name)]
  }
  if (item.type === 'forma' && item.nbId && item.pageId) {
    const nb = await db.notebooks.get(item.nbId)
    const page = await db.pages.get(item.pageId)
    return [
      textPage(
        `Page Forma : ${item.name}\n(Carnet « ${nb?.name || '?'} », page ${(page?.order ?? 0) + 1})`,
        item.name,
      ),
    ]
  }
  return []
}
