/** FormaReview — gestion commentaires, réponses et historique */

import { createComment } from './model'

export function addCommentToSession(session, opts) {
  const comment = createComment({
    ...opts,
    authorId: opts.authorId || session.settings?.authorId || 'local',
    authorName: opts.authorName || session.settings?.authorName || 'Anonyme',
    role: opts.role || session.settings?.authorRole || 'prof',
  })
  return {
    ...session,
    comments: [...(session.comments || []), comment],
    updatedAt: Date.now(),
  }
}

export function editCommentInSession(session, commentId, newContent) {
  const text = String(newContent || '').trim()
  if (!text) return session
  return {
    ...session,
    comments: (session.comments || []).map((c) => {
      if (c.id !== commentId) return c
      return {
        ...c,
        history: [...(c.history || []), { content: c.content, editedAt: Date.now() }],
        content: text,
        updatedAt: Date.now(),
      }
    }),
    updatedAt: Date.now(),
  }
}

export function resolveCommentInSession(session, commentId, resolved = true) {
  return {
    ...session,
    comments: (session.comments || []).map((c) =>
      c.id === commentId ? { ...c, resolved: !!resolved, updatedAt: Date.now() } : c
    ),
    updatedAt: Date.now(),
  }
}

export function deleteCommentFromSession(session, commentId) {
  const ids = new Set([commentId])
  let changed = true
  while (changed) {
    changed = false
    for (const c of session.comments || []) {
      if (c.parentId && ids.has(c.parentId) && !ids.has(c.id)) {
        ids.add(c.id)
        changed = true
      }
    }
  }
  return {
    ...session,
    comments: (session.comments || []).filter((c) => !ids.has(c.id)),
    updatedAt: Date.now(),
  }
}

export function resolvePinInSession(session, pinId, status = 'resolved') {
  return {
    ...session,
    pins: (session.pins || []).map((p) =>
      p.id === pinId ? { ...p, status } : p
    ),
    updatedAt: Date.now(),
  }
}

export function buildCommentTree(comments) {
  const roots = (comments || []).filter((c) => !c.parentId)
  const byParent = {}
  for (const c of comments || []) {
    if (!c.parentId) continue
    if (!byParent[c.parentId]) byParent[c.parentId] = []
    byParent[c.parentId].push(c)
  }
  return roots.map((r) => ({
    ...r,
    replies: (byParent[r.id] || []).sort((a, b) => a.createdAt - b.createdAt),
  }))
}
