/** Données minimales pour tests .forma (sans IndexedDB). */
import { createId } from './id'
import type { FormaLibraryPayload } from './forma-package'
import type { Notebook, Page } from '../types'
import { normalizePage } from '../types'

export function makeTestNotebook(overrides: Partial<Notebook> = {}): Notebook {
  const id = overrides.id ?? createId()
  return {
    id,
    name: 'Test carnet',
    folderId: null,
    type: 'notebook',
    coverColor: '#6366f1',
    paperTemplate: 'lined',
    orientation: 'portrait',
    favorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  }
}

export function makeTestPage(notebookId: string, overrides: Partial<Page> = {}): Page {
  const id = overrides.id ?? createId()
  return normalizePage({
    id,
    notebookId,
    order: 0,
    template: 'lined',
    rotation: 0,
    strokes: [
      {
        id: createId(),
        tool: 'pen',
        color: '#111',
        width: 2,
        opacity: 1,
        pageId: id,
        points: [
          { x: 10, y: 10, pressure: 0.5, timestamp: 1 },
          { x: 50, y: 50, pressure: 0.5, timestamp: 2 },
        ],
      },
    ],
    shapes: [],
    texts: [],
    images: [],
    stickers: [],
    tapes: [],
    ...overrides,
  })
}

export function makeTestLibraryPayload(): FormaLibraryPayload {
  const nb = makeTestNotebook()
  const page = makeTestPage(nb.id)
  return {
    folders: [],
    notebooks: [nb],
    pages: [page],
    audio: [],
    studyCards: [],
    shareLinks: [],
    pageSnapshots: [],
  }
}
