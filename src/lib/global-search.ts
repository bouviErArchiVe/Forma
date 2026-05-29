import { db } from '../db'
import { getAllNotebooks } from '../services/library'
import { normalizePage } from '../types'

export interface GlobalPageHit {
  notebookId: string
  notebookName: string
  pageId: string
  pageIndex: number
  snippet: string
  source: 'text' | 'ink' | 'pdf' | 'title'
}

const SOURCE_LABEL: Record<GlobalPageHit['source'], string> = {
  title: 'Carnet',
  text: 'Texte',
  ink: 'Encre',
  pdf: 'PDF',
}

export function globalHitSourceLabel(source: GlobalPageHit['source']): string {
  return SOURCE_LABEL[source]
}

function pushHit(hits: GlobalPageHit[], hit: GlobalPageHit, seen: Set<string>, limit: number) {
  const key = `${hit.notebookId}:${hit.pageId}:${hit.source}:${hit.snippet.slice(0, 24)}`
  if (seen.has(key)) return
  seen.add(key)
  hits.push(hit)
  if (hits.length >= limit) return true
  return false
}

export async function searchGlobalPages(query: string, limit = 15): Promise<GlobalPageHit[]> {
  const q = query.toLowerCase().trim()
  if (!q || q.length < 2) return []

  const notebooks = await getAllNotebooks()
  const hits: GlobalPageHit[] = []
  const seen = new Set<string>()

  for (const nb of notebooks) {
    if (nb.deletedAt) continue
    if (nb.name.toLowerCase().includes(q)) {
      if (pushHit(hits, {
        notebookId: nb.id,
        notebookName: nb.name,
        pageId: '',
        pageIndex: 0,
        snippet: nb.name,
        source: 'title',
      }, seen, limit)) break
    }
    const pages = await db.pages.where('notebookId').equals(nb.id).toArray()
    const sorted = pages.map(normalizePage).sort((a, b) => a.order - b.order)
    for (let i = 0; i < sorted.length; i++) {
      const page = sorted[i]
      let full = false
      for (const t of page.texts) {
        if (t.content.toLowerCase().includes(q)) {
          full = !!pushHit(hits, {
            notebookId: nb.id,
            notebookName: nb.name,
            pageId: page.id,
            pageIndex: i + 1,
            snippet: t.content.slice(0, 80),
            source: 'text',
          }, seen, limit)
          if (full) break
        }
      }
      if (full) break
      if (page.pdfText?.trim()) {
        const idx = page.pdfText.toLowerCase().indexOf(q)
        if (idx >= 0) {
          full = !!pushHit(hits, {
            notebookId: nb.id,
            notebookName: nb.name,
            pageId: page.id,
            pageIndex: i + 1,
            snippet: page.pdfText.slice(Math.max(0, idx - 15), idx + 65),
            source: 'pdf',
          }, seen, limit)
          if (full) break
        }
      }
      if (page.inkText?.trim()) {
        const idx = page.inkText.toLowerCase().indexOf(q)
        if (idx >= 0) {
          full = !!pushHit(hits, {
            notebookId: nb.id,
            notebookName: nb.name,
            pageId: page.id,
            pageIndex: i + 1,
            snippet: page.inkText.slice(Math.max(0, idx - 15), idx + 50),
            source: 'ink',
          }, seen, limit)
          if (full) break
        }
      }
    }
    if (hits.length >= limit) break
  }

  return hits.slice(0, limit)
}
