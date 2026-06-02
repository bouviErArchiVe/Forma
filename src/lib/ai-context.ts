/**
 * ai-context.ts — collecte le texte contextuel d'une page/document.
 *
 * Unifie l'extraction de texte pour tous les types de documents :
 * - Carnets : strokes (inkText OCR), éléments texte canvas
 * - FormaDoc : page.content (HTML → texte brut)
 * - FormaTab : page.tableData (valeurs des cellules)
 * - FMoodboard : page.moodboardData (items texte)
 * - PDF : page.pdfText
 */
import type { Page } from '../types'
import { htmlToPlainText, tabDataToPlainText, boardDataToPlainText } from './global-search'

export interface PageContext {
  /** Texte brut complet extrait de la page. */
  text: string
  /** Sources ayant contribué au contexte. */
  sources: Array<'canvas' | 'ink' | 'pdf' | 'content' | 'table' | 'board'>
  /** Longueur en caractères avant troncature. */
  rawLength: number
}

const MAX_CONTEXT_CHARS = 6000

/**
 * Extrait tout le texte utile d'une page pour l'IA.
 * Respecte MAX_CONTEXT_CHARS pour ne pas dépasser les limites des modèles.
 */
export function buildPageContext(page: Page): PageContext {
  const parts: string[] = []
  const sources: PageContext['sources'] = []

  // Canvas text elements
  if (page.texts?.length) {
    const t = page.texts.map((e) => e.content).filter(Boolean).join('\n')
    if (t.trim()) { parts.push(t); sources.push('canvas') }
  }

  // FormaDoc HTML content
  if (page.content) {
    const t = htmlToPlainText(page.content)
    if (t.trim()) { parts.push(t); sources.push('content') }
  }

  // FormaTab cells
  if (page.tableData) {
    const t = tabDataToPlainText(page.tableData)
    if (t.trim()) { parts.push(`[Tableau]\n${t}`); sources.push('table') }
  }

  // FMoodboard text items
  if (page.moodboardData) {
    const t = boardDataToPlainText(page.moodboardData)
    if (t.trim()) { parts.push(`[Moodboard]\n${t}`); sources.push('board') }
  }

  // OCR / handwriting
  if (page.inkText?.trim()) {
    parts.push(`[Encre OCR]\n${page.inkText}`)
    sources.push('ink')
  }

  // PDF text
  if (page.pdfText?.trim()) {
    parts.push(`[PDF]\n${page.pdfText}`)
    sources.push('pdf')
  }

  const raw = parts.join('\n\n').trim()
  const rawLength = raw.length
  const text = raw.length > MAX_CONTEXT_CHARS
    ? raw.slice(0, MAX_CONTEXT_CHARS) + '\n…[tronqué]'
    : raw

  return { text, sources, rawLength }
}

/**
 * Construit le message système incluant le contexte de page.
 */
export function buildSystemMessageWithContext(
  baseSystemPrompt: string,
  pageCtx: PageContext,
  notebookName: string,
): string {
  if (!pageCtx.text) {
    return `${baseSystemPrompt}\n\nAucun contenu disponible sur la page actuelle.`
  }

  const sourceList = pageCtx.sources.join(', ')
  return `${baseSystemPrompt}

--- Contexte de la page (${notebookName}, sources : ${sourceList}) ---
${pageCtx.text}
--- Fin du contexte ---`
}

/**
 * Résumé court du contexte pour l'affichage dans l'UI (sans le contenu complet).
 */
export function summarizeContext(ctx: PageContext): string {
  if (!ctx.text) return 'Aucun contenu'
  const words = ctx.text.split(/\s+/).length
  return `${words} mots · ${ctx.sources.join(', ')}`
}
