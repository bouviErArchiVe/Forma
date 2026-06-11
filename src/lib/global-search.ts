import { db } from '../db'
import { getAllNotebooks } from '../services/library'
import { normalizePage } from '../types'

export interface GlobalPageHit {
  notebookId: string
  notebookName: string
  notebookType: string
  pageId: string
  pageIndex: number
  snippet: string
  source: 'text' | 'ink' | 'pdf' | 'title' | 'content' | 'table' | 'board'
}

const SOURCE_LABEL: Record<GlobalPageHit['source'], string> = {
  title: 'Carnet',
  text: 'Texte',
  ink: 'Encre',
  pdf: 'PDF',
  content: 'Document',
  table: 'Tableau',
  board: 'Moodboard',
}

export function globalHitSourceLabel(source: GlobalPageHit['source']): string {
  return SOURCE_LABEL[source]
}

// ─── Content extraction helpers ───────────────────────────────────────────────

/** Strip HTML tags → plain text for FormaDoc content search. */
export function htmlToPlainText(html: string): string {
  // Fast regex strip — no DOM needed at index time
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?(p|h[1-6]|li|blockquote|div)[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/** Extract all cell text values from FormaTab JSON. */
export function tabDataToPlainText(tableDataJson: string): string {
  try {
    const parsed = JSON.parse(tableDataJson) as { cells?: Record<string, { value?: string }> }
    if (!parsed.cells) return ''
    return Object.values(parsed.cells)
      .map((c) => c.value ?? '')
      .filter((v) => v && !v.startsWith('='))  // skip formulas, keep plain text
      .join(' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
  } catch {
    return ''
  }
}

/** Extract text items from FMoodboard JSON. */
export function boardDataToPlainText(moodboardDataJson: string): string {
  try {
    const parsed = JSON.parse(moodboardDataJson) as { items?: Array<{ kind?: string; text?: string }> }
    if (!Array.isArray(parsed.items)) return ''
    return parsed.items
      .filter((it) => it.kind === 'text' && it.text)
      .map((it) => it.text!)
      .join(' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
  } catch {
    return ''
  }
}

// ─── Snippet helper ───────────────────────────────────────────────────────────

function makeSnippet(text: string, q: string, context = 50): string {
  const idx = text.toLowerCase().indexOf(q)
  if (idx < 0) return text.slice(0, 80)
  const start = Math.max(0, idx - context)
  const end = Math.min(text.length, idx + q.length + context)
  return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '')
}

// ─── Deduplication helper ─────────────────────────────────────────────────────

function pushHit(
  hits: GlobalPageHit[],
  hit: GlobalPageHit,
  seen: Set<string>,
  limit: number,
): boolean {
  const key = `${hit.notebookId}:${hit.pageId}:${hit.source}`
  if (seen.has(key)) return hits.length >= limit
  seen.add(key)
  hits.push(hit)
  return hits.length >= limit
}

// ─── Yield helper (avoid UI freeze on large vaults) ──────────────────────────

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

// ─── Main search function ─────────────────────────────────────────────────────

export async function searchGlobalPages(query: string, limit = 20): Promise<GlobalPageHit[]> {
  const q = query.toLowerCase().trim()
  if (!q || q.length < 2) return []

  const notebooks = await getAllNotebooks()
  const hits: GlobalPageHit[] = []
  const seen = new Set<string>()

  for (let ni = 0; ni < notebooks.length; ni++) {
    const nb = notebooks[ni]
    if (nb.deletedAt) continue

    // Yield every 5 notebooks to keep UI responsive
    if (ni > 0 && ni % 5 === 0) await yieldToMain()

    if (hits.length >= limit) break

    // ── Title match ────────────────────────────────────────────────────────
    if (nb.name.toLowerCase().includes(q)) {
      if (pushHit(hits, {
        notebookId: nb.id,
        notebookName: nb.name,
        notebookType: nb.type,
        pageId: '',
        pageIndex: 0,
        snippet: nb.name,
        source: 'title',
      }, seen, limit)) break
    }

    const pages = await db.pages.where('notebookId').equals(nb.id).toArray()
    const sorted = pages.map(normalizePage).sort((a, b) => a.order - b.order)

    for (let pi = 0; pi < sorted.length; pi++) {
      if (hits.length >= limit) break
      const page = sorted[pi]

      // ── Canvas text elements ───────────────────────────────────────────
      for (const t of page.texts) {
        if (t.content.toLowerCase().includes(q)) {
          if (pushHit(hits, {
            notebookId: nb.id,
            notebookName: nb.name,
            notebookType: nb.type,
            pageId: page.id,
            pageIndex: pi + 1,
            snippet: makeSnippet(t.content, q),
            source: 'text',
          }, seen, limit)) break
        }
      }
      if (hits.length >= limit) break

      // ── FormaDoc HTML content ──────────────────────────────────────────
      if (page.content) {
        const plain = htmlToPlainText(page.content)
        if (plain.toLowerCase().includes(q)) {
          if (pushHit(hits, {
            notebookId: nb.id,
            notebookName: nb.name,
            notebookType: nb.type,
            pageId: page.id,
            pageIndex: pi + 1,
            snippet: makeSnippet(plain, q),
            source: 'content',
          }, seen, limit)) break
        }
      }
      if (hits.length >= limit) break

      // ── FormaTab cells ─────────────────────────────────────────────────
      if (page.tableData) {
        const plain = tabDataToPlainText(page.tableData)
        if (plain.toLowerCase().includes(q)) {
          if (pushHit(hits, {
            notebookId: nb.id,
            notebookName: nb.name,
            notebookType: nb.type,
            pageId: page.id,
            pageIndex: pi + 1,
            snippet: makeSnippet(plain, q),
            source: 'table',
          }, seen, limit)) break
        }
      }
      if (hits.length >= limit) break

      // ── FMoodboard text items ──────────────────────────────────────────
      if (page.moodboardData) {
        const plain = boardDataToPlainText(page.moodboardData)
        if (plain.toLowerCase().includes(q)) {
          if (pushHit(hits, {
            notebookId: nb.id,
            notebookName: nb.name,
            notebookType: nb.type,
            pageId: page.id,
            pageIndex: pi + 1,
            snippet: makeSnippet(plain, q),
            source: 'board',
          }, seen, limit)) break
        }
      }
      if (hits.length >= limit) break

      // ── PDF text ────────────────────────────────────────────────────────
      if (page.pdfText?.trim()) {
        if (page.pdfText.toLowerCase().includes(q)) {
          if (pushHit(hits, {
            notebookId: nb.id,
            notebookName: nb.name,
            notebookType: nb.type,
            pageId: page.id,
            pageIndex: pi + 1,
            snippet: makeSnippet(page.pdfText, q),
            source: 'pdf',
          }, seen, limit)) break
        }
      }
      if (hits.length >= limit) break

      // ── OCR / handwriting index ────────────────────────────────────────
      if (page.inkText?.trim()) {
        if (page.inkText.toLowerCase().includes(q)) {
          if (pushHit(hits, {
            notebookId: nb.id,
            notebookName: nb.name,
            notebookType: nb.type,
            pageId: page.id,
            pageIndex: pi + 1,
            snippet: makeSnippet(page.inkText, q),
            source: 'ink',
          }, seen, limit)) break
        }
      }
    }
  }

  return hits.slice(0, limit)
}

// ─── Quick notebook-only search (for command palette dropdown) ─────────────────

export async function searchNotebookTitles(query: string, limit = 8): Promise<GlobalPageHit[]> {
  const q = query.toLowerCase().trim()
  if (!q) return []
  const notebooks = await getAllNotebooks()
  const hits: GlobalPageHit[] = []
  for (const nb of notebooks) {
    if (nb.deletedAt) continue
    if (nb.name.toLowerCase().includes(q)) {
      hits.push({
        notebookId: nb.id,
        notebookName: nb.name,
        notebookType: nb.type,
        pageId: '',
        pageIndex: 0,
        snippet: nb.name,
        source: 'title',
      })
      if (hits.length >= limit) break
    }
  }
  return hits
}
