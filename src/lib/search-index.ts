import { resolveNotebookPdfSource } from './assets'
import { extractPdfText } from './pdf-text'
import type { Notebook, Page } from '../types'
import { normalizePage } from '../types'
import type { SearchHit } from './search'

const pdfTextCache = new Map<string, string>()

export async function indexPdfPage(page: Page, notebook?: Notebook): Promise<string> {
  if (page.pdfText?.trim()) return page.pdfText
  if (pdfTextCache.has(page.id)) return pdfTextCache.get(page.id)!
  if (notebook) {
    try {
      const src = await resolveNotebookPdfSource(notebook)
      if (!src) return ''
      const texts = await extractPdfText(src)
      const text = texts[page.pdfPageIndex ?? 0] ?? ''
      if (text) pdfTextCache.set(page.id, text)
      return text
    } catch {
      return ''
    }
  }
  return ''
}

export async function searchInLibraryAsync(
  notebooks: Notebook[],
  pagesByNotebook: Map<string, Page[]>,
  query: string,
): Promise<SearchHit[]> {
  const q = query.toLowerCase().trim()
  if (!q) return []
  const hits: SearchHit[] = []

  for (const nb of notebooks) {
    if (nb.deletedAt) continue
    if (nb.name.toLowerCase().includes(q)) {
      hits.push({
        notebookId: nb.id,
        notebookName: nb.name,
        snippet: nb.name,
        type: 'title',
      })
    }
    const pages = pagesByNotebook.get(nb.id) ?? []
    for (const raw of pages) {
      const page = normalizePage(raw)
      for (const t of page.texts) {
        if (t.content.toLowerCase().includes(q)) {
          hits.push({
            notebookId: nb.id,
            notebookName: nb.name,
            pageId: page.id,
            snippet: t.content.slice(0, 80),
            type: 'text',
          })
        }
      }
      if (page.inkText?.trim()) {
        const idx = page.inkText.toLowerCase().indexOf(q)
        if (idx >= 0) {
          hits.push({
            notebookId: nb.id,
            notebookName: nb.name,
            pageId: page.id,
            snippet: page.inkText.slice(Math.max(0, idx - 20), idx + 60),
            type: 'stroke',
          })
        }
      }
      if (page.pdfDataUrl || page.pdfText) {
        const pdfText = await indexPdfPage(page, nb)
        const idx = pdfText.toLowerCase().indexOf(q)
        if (idx >= 0) {
          hits.push({
            notebookId: nb.id,
            notebookName: nb.name,
            pageId: page.id,
            snippet: pdfText.slice(Math.max(0, idx - 20), idx + 60),
            type: 'pdf',
          })
        }
      }
    }
  }
  return hits
}
