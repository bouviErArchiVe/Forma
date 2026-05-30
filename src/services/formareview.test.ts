import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db'
import {
  addCommentToSession,
  buildCommentTree,
  resolvePinInSession,
} from '../lib/formareview/comments'
import { countOpenPins, createPage, createSession } from '../lib/formareview/model'
import {
  createSessionRecord,
  deleteSession,
  duplicateSession,
  getSession,
  listSessions,
  saveSession,
} from './formareview'

async function resetDb(): Promise<void> {
  db.close()
  await db.delete()
  await db.open()
}

describe('formareview service', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('creates session from plans mode', async () => {
    const session = await createSessionRecord('plans', 'Corrections studio')
    expect(session.title).toBe('Corrections studio')
    expect(session.mode).toBe('plans')
    expect(await listSessions()).toHaveLength(1)
  })

  it('saves and retrieves session with pages', async () => {
    const session = await createSessionRecord('team')
    const updated = await saveSession({
      ...session,
      pages: [createPage({ name: 'Plan A' })],
    })
    const row = await getSession(session.id)
    expect(row?.pages).toHaveLength(1)
    expect(updated.updatedAt).toBeGreaterThanOrEqual(session.updatedAt)
  })

  it('duplicates and deletes session', async () => {
    const session = await createSessionRecord('jury', 'Original')
    const copy = await duplicateSession(session.id)
    expect(copy?.title).toContain('copie')
    expect(await listSessions()).toHaveLength(2)
    await deleteSession(session.id)
    expect(await listSessions()).toHaveLength(1)
  })
})

describe('formareview comments', () => {
  it('adds comment and builds thread tree', () => {
    let session = createSession('Test')
    session = addCommentToSession(session, { content: 'Bonne idée', pageId: null, pinId: null })
    session = addCommentToSession(session, {
      content: 'Merci',
      parentId: session.comments[0]!.id,
      pageId: null,
      pinId: null,
    })
    const tree = buildCommentTree(session.comments)
    expect(tree).toHaveLength(1)
    expect(tree[0]?.replies).toHaveLength(1)
  })

  it('resolves pin and counts open pins', () => {
    let session = createSession('Test')
    const page = createPage()
    session = {
      ...session,
      pages: [page],
      pins: [
        {
          id: 'p1',
          pageId: page.id,
          x: 10,
          y: 10,
          label: '',
          authorId: 'local',
          authorName: 'A',
          role: 'prof',
          status: 'open',
          createdAt: Date.now(),
        },
      ],
    }
    expect(countOpenPins(session)).toBe(1)
    session = resolvePinInSession(session, 'p1', 'resolved')
    expect(countOpenPins(session)).toBe(0)
  })
})
