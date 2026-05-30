/** FormaLibrary — import de fichiers et liens vers des sources Forma. */

import { importPdfFile } from '../pdf-import'
import { listDocuments } from '../../services/formadoc'
import { listSheets } from '../../services/formatab'
import { autoClassify } from './classify'
import { createItem, type LibraryItem } from './model'

async function extractPdf(file: File): Promise<{ text: string; pageCount: number }> {
  try {
    const { pages } = await importPdfFile(file, { lazy: true })
    const text = pages
      .map((p) => p.pdfText)
      .join('\n')
      .slice(0, 50000)
    return { text, pageCount: pages.length }
  } catch {
    return { text: '', pageCount: 0 }
  }
}

export async function importFile(file: File, folderId: string | null): Promise<LibraryItem> {
  const name = file.name || 'fichier'
  const mime = file.type || ''
  let textContent = ''
  let pageCount = 0

  if (mime.includes('pdf') || /\.pdf$/i.test(name)) {
    const out = await extractPdf(file)
    textContent = out.text
    pageCount = out.pageCount
  } else if (/\.(dwg|dxf)$/i.test(name)) {
    textContent = `Fichier CAO : ${name} (aperçu DWG non disponible — ouvrir dans un logiciel CAO)`
  } else if (!mime.startsWith('image/') && !mime.includes('svg') && !/\.(png|jpe?g|webp|svg)$/i.test(name)) {
    try {
      textContent = (await file.text()).slice(0, 50000)
    } catch {
      textContent = ''
    }
  }

  const { category, tags } = autoClassify({ name, textContent, mimeType: mime })

  return createItem({
    folderId,
    name: name.replace(/\.[^.]+$/, ''),
    category,
    mimeType: mime || null,
    tags,
    blob: file,
    textContent,
    size: file.size || 0,
    pageCount,
    metadata: { fileName: name },
  })
}

export async function importFiles(
  files: FileList | File[] | null,
  folderId: string | null,
): Promise<LibraryItem[]> {
  const list = Array.from(files || [])
  const items: LibraryItem[] = []
  for (const file of list) items.push(await importFile(file, folderId))
  return items
}

export interface InternalSource {
  id: string
  name: string
  type: 'doc' | 'sheet'
}

export async function listInternalSources(): Promise<{ doc: InternalSource[]; sheet: InternalSource[] }> {
  const [docs, sheets] = await Promise.all([listDocuments(), listSheets()])
  return {
    doc: docs.map((d) => ({ id: d.id, name: d.name, type: 'doc' as const })),
    sheet: sheets.map((s) => ({ id: s.id, name: s.name, type: 'sheet' as const })),
  }
}

export function linkInternalSource(source: InternalSource, folderId: string | null): LibraryItem {
  return createItem({
    folderId,
    name: source.name,
    category: source.type === 'doc' ? 'doc' : 'sheet',
    tags: ['Forma', source.type],
    refModule: source.type,
    refId: source.id,
    textContent: `Lien ${source.type} : ${source.name}`,
    metadata: { linked: true },
  })
}
