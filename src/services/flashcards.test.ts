/**
 * Tests service flashcards : CRUD Dexie + flux de révision SRS persisté.
 */
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db'
import {
  createFlashcard,
  deleteFlashcard,
  flashcardStats,
  listDueFlashcards,
  listFlashcards,
  reviewFlashcard,
  updateFlashcard,
} from './flashcards'
import { REVIEW_BUTTON_GRADE } from '../lib/study/srs'

const DAY = 24 * 60 * 60 * 1000

beforeEach(async () => {
  await db.open()
  await db.flashcards.clear()
})

describe('CRUD', () => {
  it('crée une carte due immédiatement avec état SRS initial', async () => {
    const before = Date.now()
    const c = await createFlashcard({ front: ' Béton ', back: ' Matériau ' })
    expect(c.front).toBe('Béton') // trim
    expect(c.back).toBe('Matériau')
    expect(c.easeFactor).toBe(2.5)
    expect(c.repetitions).toBe(0)
    expect(c.dueDate).toBeGreaterThanOrEqual(before)
    expect(await listFlashcards()).toHaveLength(1)
  })

  it('filtre par matière', async () => {
    await createFlashcard({ front: 'a', back: '1', subjectId: 's1' })
    await createFlashcard({ front: 'b', back: '2', subjectId: 's2' })
    await createFlashcard({ front: 'c', back: '3' })
    expect(await listFlashcards({ subjectId: 's1' })).toHaveLength(1)
    expect(await listFlashcards()).toHaveLength(3)
  })

  it('met à jour le contenu sans toucher à l’état SRS', async () => {
    const c = await createFlashcard({ front: 'x', back: 'y' })
    await updateFlashcard(c.id, { front: 'X2' })
    const got = (await listFlashcards())[0]
    expect(got.front).toBe('X2')
    expect(got.easeFactor).toBe(c.easeFactor)
    expect(got.dueDate).toBe(c.dueDate)
  })

  it('supprime une carte', async () => {
    const c = await createFlashcard({ front: 'a', back: 'b' })
    await deleteFlashcard(c.id)
    expect(await listFlashcards()).toHaveLength(0)
  })

  it('ne stocke pas de tableau de tags vide', async () => {
    const c = await createFlashcard({ front: 'a', back: 'b', tags: ['  ', ''] })
    expect(c.tags).toBeUndefined()
    const c2 = await createFlashcard({ front: 'a', back: 'b', tags: [' droit ', 'béton'] })
    expect(c2.tags).toEqual(['droit', 'béton'])
  })
})

describe('révision', () => {
  it('une bonne note repousse l’échéance à plus tard', async () => {
    const now = 1_700_000_000_000
    const c = await createFlashcard({ front: 'q', back: 'r' })
    const updated = await reviewFlashcard(c.id, REVIEW_BUTTON_GRADE.good, now)
    expect(updated?.repetitions).toBe(1)
    expect(updated?.interval).toBe(1)
    expect(updated?.dueDate).toBe(now + 1 * DAY)
    // persisté
    const got = (await listFlashcards())[0]
    expect(got.dueDate).toBe(now + 1 * DAY)
    expect(got.lastReviewedAt).toBe(now)
  })

  it('un échec garde la carte due le lendemain et remet repetitions à 0', async () => {
    const now = 1_700_000_000_000
    const c = await createFlashcard({ front: 'q', back: 'r' })
    await reviewFlashcard(c.id, REVIEW_BUTTON_GRADE.good, now)
    const failed = await reviewFlashcard(c.id, REVIEW_BUTTON_GRADE.again, now)
    expect(failed?.repetitions).toBe(0)
    expect(failed?.interval).toBe(1)
  })

  it('reviewFlashcard renvoie undefined si la carte n’existe pas', async () => {
    expect(await reviewFlashcard('inconnu', 4)).toBeUndefined()
  })
})

describe('cartes dues & stats', () => {
  it('liste seulement les cartes dues, triées par échéance', async () => {
    const a = await createFlashcard({ front: 'a', back: '1' }) // due maintenant
    const b = await createFlashcard({ front: 'b', back: '2' })
    const now = Date.now() // postérieur à la création des cartes
    // b révisée → repoussée → plus due
    await reviewFlashcard(b.id, REVIEW_BUTTON_GRADE.good, now)

    const due = await listDueFlashcards({ now: now + 1000 })
    expect(due.map((c) => c.id)).toEqual([a.id])
  })

  it('flashcardStats compte total / due / fresh', async () => {
    await createFlashcard({ front: 'a', back: '1' })
    const b = await createFlashcard({ front: 'b', back: '2' })
    const now = Date.now()
    await reviewFlashcard(b.id, REVIEW_BUTTON_GRADE.good, now)

    const stats = await flashcardStats({ now: now + 1000 })
    expect(stats.total).toBe(2)
    expect(stats.due).toBe(1) // b n'est plus due
    expect(stats.fresh).toBe(1) // a jamais révisée
  })
})
