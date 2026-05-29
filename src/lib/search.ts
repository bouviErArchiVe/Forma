import type { Notebook, Page } from '../types'
import { normalizePage } from '../types'

export interface SearchHit {
  notebookId: string
  notebookName: string
  pageId?: string
  snippet: string
  type: 'title' | 'text' | 'stroke' | 'pdf'
}

export function searchInLibrary(
  notebooks: Notebook[],
  pagesByNotebook: Map<string, Page[]>,
  query: string,
): SearchHit[] {
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
      if (page.pdfText?.trim()) {
        const idx = page.pdfText.toLowerCase().indexOf(q)
        if (idx >= 0) {
          hits.push({
            notebookId: nb.id,
            notebookName: nb.name,
            pageId: page.id,
            snippet: page.pdfText.slice(Math.max(0, idx - 20), idx + 60),
            type: 'pdf',
          })
        }
      }
    }
  }
  return hits
}

export interface DocumentSearchHit {
  pageId: string
  pageIndex: number
  snippet: string
  source: 'text' | 'pdf' | 'ink'
  textId?: string
}

export function searchInDocument(
  page: Page,
  query: string,
): { index: number; snippet: string; source: 'text' | 'pdf' | 'ink'; textId?: string }[] {
  const q = query.toLowerCase().trim()
  if (!q) return []
  const results: { index: number; snippet: string; source: 'text' | 'pdf' | 'ink'; textId?: string }[] = []
  const pageNorm = normalizePage(page)
  pageNorm.texts.forEach((t, i) => {
    const lower = t.content.toLowerCase()
    let from = 0
    while (from < lower.length) {
      const idx = lower.indexOf(q, from)
      if (idx < 0) break
      results.push({
        index: i,
        textId: t.id,
        snippet: t.content.slice(Math.max(0, idx - 15), idx + q.length + 45),
        source: 'text',
      })
      from = idx + q.length
    }
  })
  if (pageNorm.inkText?.trim()) {
    const lower = pageNorm.inkText.toLowerCase()
    let from = 0
    while (from < lower.length) {
      const idx = lower.indexOf(q, from)
      if (idx < 0) break
      results.push({
        index: -2,
        snippet: pageNorm.inkText.slice(Math.max(0, idx - 20), idx + q.length + 60),
        source: 'ink',
      })
      from = idx + q.length
    }
  }
  if (pageNorm.pdfText) {
    const lower = pageNorm.pdfText.toLowerCase()
    let from = 0
    while (from < lower.length) {
      const idx = lower.indexOf(q, from)
      if (idx < 0) break
      results.push({
        index: -1,
        snippet: pageNorm.pdfText.slice(Math.max(0, idx - 20), idx + q.length + 60),
        source: 'pdf',
      })
      from = idx + q.length
    }
  }
  return results
}

export function searchNotebookPages(pages: Page[], query: string): DocumentSearchHit[] {
  const q = query.trim()
  if (!q) return []
  const hits: DocumentSearchHit[] = []
  pages.forEach((page, i) => {
    for (const h of searchInDocument(page, q)) {
      hits.push({
        pageId: page.id,
        pageIndex: i + 1,
        snippet: h.snippet,
        source: h.source,
        textId: h.textId,
      })
    }
  })
  return hits
}
