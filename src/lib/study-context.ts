/**
 * Agrégation du contenu textuel d'une matière ou d'un projet, pour alimenter
 * les générateurs d'étude (quiz, révision, checklist) en local ou via FormAI.
 * Réutilise les extracteurs de texte de la recherche globale.
 */
import { db } from '../db'
import { boardDataToPlainText, htmlToPlainText, tabDataToPlainText } from './global-search'
import { normalizePage } from '../types'

/** Texte exploitable des pages d'un notebook (canvas, FormaDoc, tableau, board, ink, pdf). */
async function notebookText(notebookId: string): Promise<string> {
  const pages = (await db.pages.where('notebookId').equals(notebookId).toArray()).map(normalizePage)
  const parts: string[] = []
  for (const page of pages) {
    for (const t of page.texts) if (t.content) parts.push(t.content)
    if (page.content) parts.push(htmlToPlainText(page.content))
    if (page.tableData) parts.push(tabDataToPlainText(page.tableData))
    if (page.moodboardData) parts.push(boardDataToPlainText(page.moodboardData))
    if (page.inkText?.trim()) parts.push(page.inkText)
    if (page.pdfText?.trim()) parts.push(page.pdfText)
  }
  return parts.join('\n').replace(/\s{2,}/g, ' ').trim()
}

/** Texte agrégé des documents liés à une matière (notebook.subjectId). */
export async function collectSubjectText(subjectId: string, maxChars = 8000): Promise<string> {
  // Inclut le document matière lui-même + les documents liés.
  const linked = await db.notebooks.filter((n) => (n.subjectId === subjectId || n.id === subjectId) && !n.deletedAt).toArray()
  const texts: string[] = []
  for (const nb of linked) {
    const t = await notebookText(nb.id)
    if (t) texts.push(t)
    if (texts.join(' ').length > maxChars) break
  }
  return texts.join('\n\n').slice(0, maxChars)
}

export interface ProjectContext {
  documentCount: number
  taskTitles: string[]
  hasEvents: boolean
  text: string
}

/** Signaux d'un projet pour la génération de checklist. */
export async function collectProjectContext(projectId: string): Promise<ProjectContext> {
  const docs = await db.notebooks.filter((n) => n.projectId === projectId && !n.deletedAt).toArray()
  const tasks = await db.tasks.filter((t) => t.projectId === projectId && !t.deletedAt).toArray()
  // Présence d'événements liés au projet (parcours léger des calendriers).
  const calendars = await db.notebooks.filter((n) => n.type === 'calendar' && !n.deletedAt).toArray()
  let hasEvents = false
  for (const cal of calendars) {
    const page = await db.pages.where('notebookId').equals(cal.id).first()
    if (!page?.moduleData) continue
    try {
      const parsed = JSON.parse(page.moduleData) as { events?: { projectId?: string }[] }
      if (Array.isArray(parsed.events) && parsed.events.some((e) => e.projectId === projectId)) {
        hasEvents = true
        break
      }
    } catch { /* ignore */ }
  }
  let text = ''
  for (const nb of docs) {
    text += (await notebookText(nb.id)) + '\n'
    if (text.length > 6000) break
  }
  return {
    documentCount: docs.length,
    taskTitles: tasks.map((t) => t.title),
    hasEvents,
    text: text.slice(0, 6000),
  }
}
