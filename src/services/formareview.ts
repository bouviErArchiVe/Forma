import { db } from '../db'
import {
  cloneSession,
  createSession,
  defaultRoleForMode,
} from '../lib/formareview/model'
import type { FormaReviewMode, FormaReviewSession } from '../types'
import { REVIEW_MODES } from '../lib/formareview/constants'

export async function listSessions(): Promise<FormaReviewSession[]> {
  return db.formaReviewSessions.orderBy('updatedAt').reverse().toArray()
}

export async function getSession(id: string): Promise<FormaReviewSession | undefined> {
  return db.formaReviewSessions.get(id)
}

export async function saveSession(session: FormaReviewSession): Promise<FormaReviewSession> {
  const next = { ...session, updatedAt: Date.now() }
  await db.formaReviewSessions.put(next)
  return next
}

export async function createSessionRecord(
  mode: FormaReviewMode,
  title?: string,
): Promise<FormaReviewSession> {
  const modeInfo = REVIEW_MODES[mode]
  const session = createSession(title?.trim() || `Révision ${modeInfo.label}`, {
    mode,
    description: modeInfo.label,
    settings: { authorRole: defaultRoleForMode(mode), authorName: 'Professeur', showResolved: true },
  })
  await db.formaReviewSessions.add(session)
  return session
}

export async function deleteSession(id: string): Promise<void> {
  await db.formaReviewSessions.delete(id)
}

export async function duplicateSession(id: string): Promise<FormaReviewSession | null> {
  const src = await getSession(id)
  if (!src) return null
  const copy = cloneSession(src)
  await db.formaReviewSessions.add(copy)
  return copy
}

let saveTimer: ReturnType<typeof setTimeout> | null = null

export function autosaveSession(session: FormaReviewSession, delay = 500): Promise<FormaReviewSession> {
  return new Promise((resolve) => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      void saveSession(session).then(resolve)
    }, delay)
  })
}
