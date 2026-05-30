import { createId } from '../id'
import type {
  FormaReviewComment,
  FormaReviewMarkup,
  FormaReviewMode,
  FormaReviewPage,
  FormaReviewPin,
  FormaReviewRole,
  FormaReviewSession,
  FormaReviewSessionSettings,
} from '../../types'
import { A4_PX } from './constants'

export function createPage(partial: Partial<FormaReviewPage> = {}): FormaReviewPage {
  const now = Date.now()
  return {
    id: createId(),
    name: partial.name || 'Page',
    width: partial.width || A4_PX.width,
    height: partial.height || A4_PX.height,
    dataUrl: partial.dataUrl ?? null,
    previewScale: partial.previewScale,
    createdAt: now,
  }
}

export function createPin(opts: {
  pageId: string
  x: number
  y: number
  authorId?: string
  authorName?: string
  role?: FormaReviewRole
  label?: string
}): FormaReviewPin {
  return {
    id: createId(),
    pageId: opts.pageId,
    x: opts.x,
    y: opts.y,
    label: opts.label || '',
    authorId: opts.authorId || 'local',
    authorName: opts.authorName || 'Anonyme',
    role: opts.role || 'prof',
    status: 'open',
    createdAt: Date.now(),
  }
}

export function createMarkup(opts: {
  pageId: string
  type: FormaReviewMarkup['type']
  data: Record<string, unknown>
  authorId?: string
  authorName?: string
  role?: FormaReviewRole
}): FormaReviewMarkup {
  return {
    id: createId(),
    pageId: opts.pageId,
    type: opts.type,
    data: opts.data,
    authorId: opts.authorId || 'local',
    authorName: opts.authorName || 'Anonyme',
    role: opts.role || 'prof',
    createdAt: Date.now(),
  }
}

export function createComment(
  opts: Partial<FormaReviewComment> & { content: string },
): FormaReviewComment {
  const now = Date.now()
  return {
    id: createId(),
    pinId: opts.pinId ?? null,
    pageId: opts.pageId ?? null,
    parentId: opts.parentId ?? null,
    content: String(opts.content || '').trim(),
    authorId: opts.authorId || 'local',
    authorName: opts.authorName || 'Anonyme',
    role: opts.role || 'prof',
    resolved: false,
    history: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function createSession(
  title = 'Révision',
  partial: Partial<FormaReviewSession> = {},
): FormaReviewSession {
  const now = Date.now()
  const settings: FormaReviewSessionSettings = {
    authorRole: partial.settings?.authorRole || 'prof',
    authorName: partial.settings?.authorName || 'Professeur',
    showResolved: partial.settings?.showResolved ?? true,
    ...partial.settings,
  }
  return {
    id: createId(),
    title,
    description: partial.description || '',
    mode: partial.mode || 'plans',
    pages: partial.pages || [],
    pins: partial.pins || [],
    markups: partial.markups || [],
    comments: partial.comments || [],
    settings,
    createdAt: now,
    updatedAt: now,
  }
}

export function cloneSession(session: FormaReviewSession, title?: string): FormaReviewSession {
  const now = Date.now()
  return {
    ...structuredClone(session),
    id: createId(),
    title: title || `${session.title} (copie)`,
    createdAt: now,
    updatedAt: now,
  }
}

export function getPinsForPage(session: FormaReviewSession, pageId: string): FormaReviewPin[] {
  return session.pins.filter((p) => p.pageId === pageId)
}

export function getMarkupsForPage(session: FormaReviewSession, pageId: string): FormaReviewMarkup[] {
  return session.markups.filter((m) => m.pageId === pageId)
}

export function countOpenPins(session: FormaReviewSession): number {
  return session.pins.filter((p) => p.status !== 'resolved').length
}

export function countUnresolvedComments(session: FormaReviewSession): number {
  return session.comments.filter((c) => !c.resolved && !c.parentId).length
}

export function defaultRoleForMode(mode: FormaReviewMode): FormaReviewRole {
  if (mode === 'jury') return 'jury'
  if (mode === 'team') return 'team'
  if (mode === 'prof') return 'prof'
  return 'prof'
}
