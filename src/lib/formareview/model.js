/** FormaReview — modèle sessions, pins, annotations, commentaires */

import { A4_PX } from './constants'

function uid(p = 'frv') {
  return `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function createPage(partial = {}) {
  const now = Date.now()
  return {
    id: uid('pg'),
    name: partial.name || 'Page',
    width: partial.width || A4_PX.width,
    height: partial.height || A4_PX.height,
    dataUrl: partial.dataUrl || null,
    createdAt: now,
  }
}

export function createPin({ pageId, x, y, authorId, authorName, role = 'prof', label = '' }) {
  return {
    id: uid('pin'),
    pageId,
    x,
    y,
    label,
    authorId: authorId || 'local',
    authorName: authorName || 'Anonyme',
    role,
    status: 'open',
    createdAt: Date.now(),
  }
}

export function createMarkup({ pageId, type, data, authorId, authorName, role = 'prof' }) {
  return {
    id: uid('mk'),
    pageId,
    type,
    data,
    authorId: authorId || 'local',
    authorName: authorName || 'Anonyme',
    role,
    createdAt: Date.now(),
  }
}

export function createComment({ pinId, pageId, content, authorId, authorName, role = 'prof', parentId = null }) {
  const now = Date.now()
  return {
    id: uid('cmt'),
    pinId: pinId || null,
    pageId: pageId || null,
    parentId: parentId || null,
    content: String(content || '').trim(),
    authorId: authorId || 'local',
    authorName: authorName || 'Anonyme',
    role,
    resolved: false,
    history: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function createSession(name = 'Révision', partial = {}) {
  const now = Date.now()
  return {
    id: uid('sess'),
    title: name,
    description: partial.description || '',
    mode: partial.mode || 'plans',
    pages: partial.pages || [],
    pins: partial.pins || [],
    markups: partial.markups || [],
    comments: partial.comments || [],
    settings: {
      authorRole: partial.settings?.authorRole || 'prof',
      authorName: partial.settings?.authorName || 'Professeur',
      showResolved: true,
      ...partial.settings,
    },
    createdAt: now,
    updatedAt: now,
  }
}

export function updateSession(session, patch) {
  return { ...session, ...patch, updatedAt: Date.now() }
}

export function getPinsForPage(session, pageId) {
  return (session.pins || []).filter((p) => p.pageId === pageId)
}

export function getMarkupsForPage(session, pageId) {
  return (session.markups || []).filter((m) => m.pageId === pageId)
}

export function getCommentsForPin(session, pinId) {
  return (session.comments || []).filter((c) => c.pinId === pinId)
}

export function getThreadRoots(session) {
  return (session.comments || []).filter((c) => !c.parentId)
}

export function getReplies(session, parentId) {
  return (session.comments || []).filter((c) => c.parentId === parentId)
}

export function countOpenPins(session) {
  return (session.pins || []).filter((p) => p.status !== 'resolved').length
}

export function countUnresolvedComments(session) {
  return (session.comments || []).filter((c) => !c.resolved && !c.parentId).length
}
