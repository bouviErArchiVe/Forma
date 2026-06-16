/**
 * FormAI Canvas Actions — extraction de contexte (helpers purs).
 *
 * Transforme une page / un document Forma en texte brut exploitable par une
 * action IA (« expliquer », « résumer », « créer une tâche »). Réutilise les
 * extracteurs de `src/lib/global-search.ts` (HTML, tableaux, moodboards,
 * modules V2) sans les dupliquer.
 *
 * IMPORTANT : ce fichier est PUR (texte → texte). Aucun accès Dexie, aucun
 * appel réseau, aucune écriture canvas — il est testable de façon
 * déterministe. La lecture Dexie vit dans `canvas-actions.ts`.
 */
import {
  boardDataToPlainText,
  htmlToPlainText,
  moduleDataToPlainText,
  tabDataToPlainText,
} from '../global-search'
import type { Page } from '../../types'

/** Budget de caractères par défaut pour un contexte envoyé à un provider. */
export const DEFAULT_CONTEXT_BUDGET = 6000

/** Origine textuelle d'un segment extrait (pour diagnostic / honnêteté UI). */
export type ContextSource =
  | 'text'
  | 'content'
  | 'table'
  | 'board'
  | 'module'
  | 'pdf'
  | 'ink'

export interface ContextSegment {
  source: ContextSource
  text: string
}

export interface PageContext {
  /** Texte concaténé, prêt pour un prompt (peut être vide). */
  text: string
  /** Segments par origine (ordre de priorité de lecture). */
  segments: ContextSegment[]
  /** true si la page ne contient aucun texte exploitable. */
  isEmpty: boolean
  /** Nombre de caractères du texte concaténé. */
  charCount: number
  /** true si seul l'encre/manuscrit (OCR) a fourni du texte — confiance moindre. */
  inkOnly: boolean
}

/** Concatène et normalise les espaces d'un ensemble de fragments. */
function joinSegments(segments: ContextSegment[]): string {
  return segments
    .map((s) => s.text.trim())
    .filter((t) => t !== '')
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Extrait le texte d'une page Forma, tous types confondus, en réutilisant les
 * extracteurs de global-search. L'ordre privilégie le contenu « riche »
 * (document, tableau, texte canvas) avant les fallback (PDF, OCR encre).
 */
export function extractPageContext(page: Page): PageContext {
  const segments: ContextSegment[] = []

  const push = (source: ContextSource, raw: string | undefined): void => {
    if (!raw) return
    const text = raw.trim()
    if (text !== '') segments.push({ source, text })
  }

  // ── Texte canvas (blocs texte) ──────────────────────────────────────────────
  if (Array.isArray(page.texts) && page.texts.length > 0) {
    const canvasText = page.texts
      .map((t) => t.content?.trim() ?? '')
      .filter((c) => c !== '')
      .join('\n')
    push('text', canvasText)
  }

  // ── FormaDoc (HTML) ─────────────────────────────────────────────────────────
  if (page.content) push('content', htmlToPlainText(page.content))

  // ── FormaTab (cellules) ─────────────────────────────────────────────────────
  if (page.tableData) push('table', tabDataToPlainText(page.tableData))

  // ── FMoodboard (items texte) ────────────────────────────────────────────────
  if (page.moodboardData) push('board', boardDataToPlainText(page.moodboardData))

  // ── Modules V2 (calendar, presence, translator, combine…) ───────────────────
  if (page.moduleData) push('module', moduleDataToPlainText(page.moduleData))

  // ── PDF (texte extrait) ─────────────────────────────────────────────────────
  if (page.pdfText) push('pdf', page.pdfText)

  // ── OCR / manuscrit ─────────────────────────────────────────────────────────
  if (page.inkText) push('ink', page.inkText)

  const text = joinSegments(segments)
  const inkOnly = segments.length > 0 && segments.every((s) => s.source === 'ink')

  return {
    text,
    segments,
    isEmpty: text === '',
    charCount: text.length,
    inkOnly,
  }
}

/** Agrège les contextes de plusieurs pages en un seul, en numérotant les pages. */
export function extractDocumentContext(pages: Page[]): PageContext {
  const ordered = [...pages].sort((a, b) => a.order - b.order)
  const segments: ContextSegment[] = []
  const parts: string[] = []

  ordered.forEach((page, index) => {
    const ctx = extractPageContext(page)
    if (ctx.isEmpty) return
    segments.push(...ctx.segments)
    parts.push(`— Page ${index + 1} —\n${ctx.text}`)
  })

  const text = parts.join('\n\n').replace(/\n{3,}/g, '\n\n').trim()
  const inkOnly = segments.length > 0 && segments.every((s) => s.source === 'ink')

  return {
    text,
    segments,
    isEmpty: text === '',
    charCount: text.length,
    inkOnly,
  }
}

/**
 * Tronque un texte de contexte à un budget de caractères, en coupant sur une
 * frontière de mot quand c'est possible, avec un marqueur de troncature.
 */
export function truncateContext(text: string, budget = DEFAULT_CONTEXT_BUDGET): string {
  const trimmed = text.trim()
  if (trimmed.length <= budget) return trimmed
  const slice = trimmed.slice(0, budget)
  const lastSpace = slice.lastIndexOf(' ')
  const cut = lastSpace > budget * 0.6 ? slice.slice(0, lastSpace) : slice
  return `${cut.trim()}\n\n[…texte tronqué pour l'analyse…]`
}
