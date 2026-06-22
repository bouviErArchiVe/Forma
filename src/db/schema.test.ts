import Dexie from 'dexie'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, FORMA_DB_VERSION, FormaDatabase } from './index'
import { makeTestNotebook, makeTestPage } from '../lib/forma-test-fixtures'
import type { Page } from '../types'
import { normalizePage } from '../types'

function makeLargePngDataUrl(): string {
  const raw = new Uint8Array(5000)
  raw.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0)
  let binary = ''
  for (let i = 0; i < raw.length; i++) binary += String.fromCharCode(raw[i]!)
  return `data:image/png;base64,${btoa(binary)}`
}

async function resetDb(): Promise<void> {
  db.close()
  await db.delete()
  await db.open()
}

async function seedV5WithInlinePage(): Promise<{ notebookId: string; pageId: string; imageId: string }> {
  db.close()
  await db.delete()

  const v5 = new Dexie('forma')
  v5.version(1).stores({
    folders: 'id, parentId, name, updatedAt',
    notebooks: 'id, folderId, name, updatedAt, favorite',
    pages: 'id, notebookId, order',
  })
  v5.version(2)
    .stores({
      folders: 'id, parentId, name, updatedAt',
      notebooks: 'id, folderId, name, updatedAt, favorite, deletedAt',
      pages: 'id, notebookId, order',
      audio: 'id, notebookId, createdAt',
      studyCards: 'id, notebookId, nextReview',
      shareLinks: 'id, notebookId, token',
      settings: 'key',
    })
    .upgrade(async (tx) => {
      await tx
        .table('pages')
        .toCollection()
        .modify((page: Page) => {
          const n = normalizePage(page)
          page.strokes = n.strokes
          page.shapes = n.shapes
          page.texts = n.texts
          page.images = n.images
          page.tapes = n.tapes
        })
    })
  v5.version(3).upgrade(async (tx) => {
    await tx
      .table('pages')
      .toCollection()
      .modify((page: Page) => {
        page.stickers = page.stickers ?? []
      })
  })
  v5.version(4).stores({
    folders: 'id, parentId, name, updatedAt',
    notebooks: 'id, folderId, name, updatedAt, favorite, deletedAt',
    pages: 'id, notebookId, order',
    audio: 'id, notebookId, createdAt',
    studyCards: 'id, notebookId, nextReview',
    shareLinks: 'id, notebookId, token',
    pageSnapshots: 'id, pageId, createdAt',
    settings: 'key',
  })
  v5.version(5).stores({
    folders: 'id, parentId, name, updatedAt',
    notebooks: 'id, folderId, name, updatedAt, favorite, deletedAt',
    pages: 'id, notebookId, order',
    audio: 'id, notebookId, createdAt',
    studyCards: 'id, notebookId, nextReview',
    shareLinks: 'id, notebookId, token',
    pageSnapshots: 'id, pageId, createdAt',
    assets: 'id, notebookId, createdAt',
    settings: 'key',
  })
  await v5.open()
  expect(v5.verno).toBe(5)

  const nb = makeTestNotebook({ id: 'nb-v5-upgrade' })
  const pageId = 'page-v5-upgrade'
  const imageId = 'img-v5-upgrade'
  await v5.table('notebooks').add(nb)
  await v5.table('pages').add(
    makeTestPage(nb.id, {
      id: pageId,
      images: [
        {
          id: imageId,
          pageId,
          x: 0,
          y: 0,
          width: 80,
          height: 80,
          dataUrl: makeLargePngDataUrl(),
        },
      ],
    }),
  )
  v5.close()
  return { notebookId: nb.id, pageId, imageId }
}

describe('Dexie schema', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('opens at the current version with assets store', async () => {
    expect(db.verno).toBe(FORMA_DB_VERSION)
    expect(db.tables.map((t) => t.name).sort()).toEqual(
      [
        'aiConversations',
        'aiKnowledgeChunks',
        'aiKnowledgeDocs',
        'aiMemory',
        'assets',
        'audio',
        'folders',
        'notebooks',
        'pages',
        'pageSnapshots',
        'settings',
        'shareLinks',
        'studyCards',
        'thumbnails',
        'tasks',
        'projects',
        'academicSessions',
        'quizzes',
        'checklists',
        'flashcards',
        'exams',
        'examAttempts',
        'academicGoals',
        'formaKnowledgeEntries',
        'formaRagChunks',
        'formaSearchKeywords',
        'formaImportBatches',
      ].sort(),
    )
  })

  it('bumps to v15 and exposes the flashcards store', async () => {
    expect(FORMA_DB_VERSION).toBe(17)
    expect(db.verno).toBe(17)
    const now = Date.now()
    await db.flashcards.put({
      id: 'fc-schema-1',
      front: 'Recto',
      back: 'Verso',
      subjectId: 'subj-1',
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      dueDate: now,
      createdAt: now,
      updatedAt: now,
    })
    const row = await db.flashcards.get('fc-schema-1')
    expect(row?.front).toBe('Recto')
    expect(row?.easeFactor).toBe(2.5)
    // index subjectId interrogeable
    const bySubject = await db.flashcards.where('subjectId').equals('subj-1').toArray()
    expect(bySubject).toHaveLength(1)
  })

  it('v15 exposes exams + examAttempts stores with queryable indexes', async () => {
    const now = Date.now()
    await db.exams.put({
      id: 'exam-schema-1',
      title: 'Examen blanc',
      subjectId: 'subj-1',
      questions: [
        { id: 'q1', type: 'short', question: 'Recto', answer: 'Verso', points: 1, source: 'flashcard' },
      ],
      totalPoints: 1,
      createdAt: now,
    })
    await db.examAttempts.put({
      id: 'attempt-schema-1',
      examId: 'exam-schema-1',
      subjectId: 'subj-1',
      answers: [{ questionId: 'q1', given: 'Verso', correct: true, earned: 1 }],
      score: 1,
      total: 1,
      percent: 100,
      createdAt: now,
    })

    const exam = await db.exams.get('exam-schema-1')
    expect(exam?.questions).toHaveLength(1)
    expect(exam?.totalPoints).toBe(1)

    // index subjectId / examId interrogeables
    expect(await db.exams.where('subjectId').equals('subj-1').toArray()).toHaveLength(1)
    expect(await db.examAttempts.where('examId').equals('exam-schema-1').toArray()).toHaveLength(1)
    expect(await db.examAttempts.where('subjectId').equals('subj-1').toArray()).toHaveLength(1)
  })

  it('v16 exposes the academicGoals store with queryable indexes', async () => {
    expect(FORMA_DB_VERSION).toBe(17)
    const now = Date.now()
    await db.academicGoals.put({
      id: 'goal-schema-1',
      title: 'Réviser 5 chapitres',
      subjectId: 'subj-1',
      target: 5,
      progress: 2,
      unit: 'chapitres',
      dueDate: '2026-07-01',
      createdAt: now,
      updatedAt: now,
    })
    const row = await db.academicGoals.get('goal-schema-1')
    expect(row?.title).toBe('Réviser 5 chapitres')
    expect(row?.target).toBe(5)
    expect(row?.progress).toBe(2)

    // index subjectId / dueDate interrogeables
    expect(await db.academicGoals.where('subjectId').equals('subj-1').toArray()).toHaveLength(1)
    expect(await db.academicGoals.where('dueDate').equals('2026-07-01').toArray()).toHaveLength(1)
  })

  it('persists blob rows in assets store (v5)', async () => {
    await db.assets.put({
      id: 'asset-schema-1',
      notebookId: 'nb-1',
      mimeType: 'image/png',
      blob: new Blob([1, 2, 3], { type: 'image/png' }),
      createdAt: Date.now(),
    })
    const row = await db.assets.get('asset-schema-1')
    expect(row?.notebookId).toBe('nb-1')
    expect(row?.mimeType).toBe('image/png')
  })

  it('v6 upgrade externalizes inline page data URLs from v5', async () => {
    const { pageId, imageId, notebookId } = await seedV5WithInlinePage()

    const freshDb = new FormaDatabase()
    await freshDb.open()
    expect(freshDb.verno).toBe(FORMA_DB_VERSION)

    const row = await freshDb.pages.get(pageId)
    expect(row?.images[0]?.assetId).toBe(imageId)
    expect(row?.images[0]?.dataUrl).toBeUndefined()

    const asset = await freshDb.assets.get(imageId)
    expect(asset?.notebookId).toBe(notebookId)
    expect(asset?.mimeType).toContain('image')

    freshDb.close()
    await db.open()
  })

  it('v7 upgrade externalizes inline pdfSourceDataUrl on notebooks', async () => {
    db.close()
    await db.delete()

    const v6 = new Dexie('forma')
    v6.version(6).stores({
      folders: 'id, parentId, name, updatedAt',
      notebooks: 'id, folderId, name, updatedAt, favorite, deletedAt',
      pages: 'id, notebookId, order, pdfAssetId',
      audio: 'id, notebookId, createdAt',
      studyCards: 'id, notebookId, nextReview',
      shareLinks: 'id, notebookId, token',
      pageSnapshots: 'id, pageId, createdAt',
      assets: 'id, notebookId, createdAt',
      settings: 'key',
    })
    await v6.open()

    const nbId = 'nb-v7-pdf'
    const dataUrl = makeLargePngDataUrl().replace('image/png', 'application/pdf')
    await v6.table('notebooks').add({
      id: nbId,
      folderId: null,
      name: 'PDF inline',
      type: 'pdf',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      favorite: false,
      pdfSourceDataUrl: dataUrl,
    })
    v6.close()

    const freshDb = new FormaDatabase()
    await freshDb.open()
    expect(freshDb.verno).toBe(FORMA_DB_VERSION)

    const nb = await freshDb.notebooks.get(nbId)
    expect(nb?.pdfSourceAssetId).toBe(`${nbId}-pdf-source`)
    expect(nb?.pdfSourceDataUrl).toBeUndefined()

    const asset = await freshDb.assets.get(`${nbId}-pdf-source`)
    expect(asset?.notebookId).toBe(nbId)

    freshDb.close()
    await db.open()
  })
})
