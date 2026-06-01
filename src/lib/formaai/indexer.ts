/** FormaAI — index de recherche unifié (100 % local, lecture Dexie). */

import { FORMULAS } from '../formulas/catalog'
import { readPersistedFormulaHistory } from '../formulas/history-read'
import { getAllNotebooks, getFolders } from '../../services/library'
import { getPages } from '../../services/pages'
import { listDocuments } from '../../services/formadoc'
import { listSheets } from '../../services/formatab'
import { listDecks } from '../../services/formapresent'
import { listSessions } from '../../services/formareview'
import { listProjects } from '../../services/formacombine'
import { listEvents } from '../../services/formatcal'
import { getBoards } from '../../services/moodboard'
import { INDEX_CACHE_TTL } from './constants'
import type {
  FormaCalEvent,
  FormaCombineProject,
  FormaDeck,
  FormaDocument,
  FormaReviewSession,
  FormaSheet,
} from '../../types'

export interface SearchItem {
  id: string
  source: string
  type: string
  title: string
  text: string
  route: string
  meta?: Record<string, unknown>
  updatedAt: number
}

function stripHtml(html: string): string {
  return String(html ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function docText(doc: FormaDocument): string {
  return doc.pages.map((p) => stripHtml(p.html)).join(' ')
}

function sheetText(sheet: FormaSheet): string {
  return Object.values(sheet.cells)
    .map((c) => c?.raw ?? '')
    .filter(Boolean)
    .join(' ')
}

function deckText(deck: FormaDeck): string {
  return deck.slides
    .flatMap((s) => [s.name, s.notes, ...s.elements.map((el) => el.content ?? el.label ?? '')])
    .filter(Boolean)
    .join(' ')
}

function reviewText(session: FormaReviewSession): string {
  return session.comments.map((c) => c.content).filter(Boolean).join(' ')
}

function combineText(project: FormaCombineProject): string {
  return project.pages.map((p) => [p.name, p.text, p.sourceType].filter(Boolean).join(' ')).join(' ')
}

function eventText(event: FormaCalEvent): string {
  return [event.title, event.description, ...(event.tags ?? []), ...(event.checklist ?? []).map((i) => i.text)]
    .filter(Boolean)
    .join(' ')
}

let cachedIndex: SearchItem[] | null = null
let cacheTime = 0
let building: Promise<SearchItem[]> | null = null

export async function buildSearchIndex({ force = false } = {}): Promise<SearchItem[]> {
  if (!force && cachedIndex && Date.now() - cacheTime < INDEX_CACHE_TTL) return cachedIndex
  if (!force && building) return building

  building = (async () => {
    const items: SearchItem[] = []

    const [notebooks, docs, sheets, decks, sessions, projects, events, boards, folders] = await Promise.all([
      getAllNotebooks(),
      listDocuments(),
      listSheets(),
      listDecks(),
      listSessions(),
      listProjects(),
      listEvents(),
      getBoards(),
      getFolders(null),
    ])

    for (const nb of notebooks) {
      const pages = await getPages(nb.id)
      const text = pages
        .flatMap((p) => [...p.texts.map((t) => t.content), p.pdfText ?? ''])
        .filter(Boolean)
        .join(' ')
      items.push({
        id: `nb:${nb.id}`,
        source: 'notebook',
        type: 'notebook',
        title: nb.name || 'Carnet',
        text,
        route: `/document/${nb.id}`,
        updatedAt: nb.updatedAt,
      })
    }

    for (const doc of docs) {
      items.push({
        id: `doc:${doc.id}`,
        source: 'doc',
        type: 'doc',
        title: doc.name || 'FormaDoc',
        text: docText(doc),
        route: '/formadoc',
        updatedAt: doc.updatedAt,
      })
    }

    for (const sheet of sheets) {
      items.push({
        id: `sheet:${sheet.id}`,
        source: 'sheet',
        type: 'sheet',
        title: sheet.name || 'FormaTab',
        text: sheetText(sheet),
        route: '/formatab',
        updatedAt: sheet.updatedAt,
      })
    }

    for (const deck of decks) {
      items.push({
        id: `present:${deck.id}`,
        source: 'present',
        type: 'present',
        title: deck.title || 'FormaPresent',
        text: deckText(deck),
        route: '/formapresent',
        updatedAt: deck.updatedAt,
      })
    }

    for (const event of events) {
      items.push({
        id: `event:${event.id}`,
        source: 'event',
        type: 'event',
        title: event.title || 'Événement',
        text: eventText(event),
        route: '/formatcal',
        updatedAt: event.updatedAt,
      })
    }

    for (const session of sessions) {
      items.push({
        id: `review:${session.id}`,
        source: 'review',
        type: 'review',
        title: session.title || 'FormaReview',
        text: reviewText(session),
        route: '/formareview',
        updatedAt: session.updatedAt,
      })
    }

    for (const project of projects) {
      items.push({
        id: `combine:${project.id}`,
        source: 'combine',
        type: 'combine',
        title: project.name || 'FormaCombine',
        text: combineText(project),
        route: '/formacombine',
        updatedAt: project.updatedAt,
      })
    }

    for (const board of boards) {
      items.push({
        id: `board:${board.id}`,
        source: 'moodboard',
        type: 'moodboard',
        title: board.name || 'Moodboard',
        text: [board.name, board.emoji].filter(Boolean).join(' '),
        route: '/moodboard',
        updatedAt: board.updatedAt,
      })
    }

    for (const folder of folders) {
      items.push({
        id: `folder:${folder.id}`,
        source: 'folder',
        type: 'folder',
        title: folder.name || 'Dossier',
        text: folder.name || '',
        route: '/',
        updatedAt: folder.updatedAt,
      })
    }

    for (const f of FORMULAS as Array<{
      id: string
      title: string
      description?: string
      formulaText?: string
      tags?: string[]
    }>) {
      items.push({
        id: `formula:${f.id}`,
        source: 'formula',
        type: 'formula',
        title: f.title,
        text: [f.title, f.description, f.formulaText, ...(f.tags ?? [])].filter(Boolean).join(' '),
        route: '/formulas',
        meta: { formulaId: f.id },
        updatedAt: 0,
      })
    }

    for (const entry of readPersistedFormulaHistory()) {
      items.push({
        id: `formula-history:${entry.id}`,
        source: 'formula',
        type: 'formula-history',
        title: `${entry.title} (calcul)`,
        text: [entry.title, entry.summary, ...Object.values(entry.values)].filter(Boolean).join(' '),
        route: '/formulas',
        meta: { formulaId: entry.formulaId, historyId: entry.id },
        updatedAt: entry.createdAt,
      })
    }

    cachedIndex = items
    cacheTime = Date.now()
    return items
  })()

  try {
    return await building
  } finally {
    building = null
  }
}

export function invalidateSearchIndex(): void {
  cachedIndex = null
  cacheTime = 0
}
