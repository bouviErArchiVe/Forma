/**
 * Tests Matière V2 : liaison/déliaison de documents via notebook.subjectId.
 */
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../../db'
import { createModuleDocument, createNotebook } from '../../services/library'

beforeEach(async () => {
  await db.open()
  await db.pages.clear()
  await db.notebooks.clear()
})

describe('matière — liaison de documents', () => {
  it('createModuleDocument crée un notebook de type subject avec une page', async () => {
    const subject = await createModuleDocument('subject', 'Structure', null, { coverColor: '#f59e0b' })
    expect(subject.type).toBe('subject')
    const stored = await db.notebooks.get(subject.id)
    expect(stored?.type).toBe('subject')
    expect(stored?.coverColor).toBe('#f59e0b')
    const pages = await db.pages.where('notebookId').equals(subject.id).count()
    expect(pages).toBe(1)
  })

  it('lier puis délier un document via subjectId', async () => {
    const subject = await createModuleDocument('subject', 'Construction', null)
    const carnet = await createNotebook({ name: 'Notes de cours', folderId: null })

    await db.notebooks.update(carnet.id, { subjectId: subject.id })
    let linked = await db.notebooks.filter((n) => n.subjectId === subject.id && !n.deletedAt).toArray()
    expect(linked.map((n) => n.id)).toEqual([carnet.id])

    await db.notebooks.update(carnet.id, { subjectId: undefined })
    linked = await db.notebooks.filter((n) => n.subjectId === subject.id && !n.deletedAt).toArray()
    expect(linked).toHaveLength(0)
  })

  it('le filtrage exclut corbeille et autres matières', async () => {
    const s1 = await createModuleDocument('subject', 'Anglais', null)
    const s2 = await createModuleDocument('subject', 'Français', null)
    const a = await createNotebook({ name: 'A', folderId: null })
    const b = await createNotebook({ name: 'B', folderId: null })
    const c = await createNotebook({ name: 'C', folderId: null })
    await db.notebooks.update(a.id, { subjectId: s1.id })
    await db.notebooks.update(b.id, { subjectId: s2.id })
    await db.notebooks.update(c.id, { subjectId: s1.id, deletedAt: Date.now() })

    const linked = await db.notebooks.filter((n) => n.subjectId === s1.id && !n.deletedAt).toArray()
    expect(linked.map((n) => n.id)).toEqual([a.id])
  })

  it('createModuleDocument accepte un subjectId initial (document pré-lié)', async () => {
    const subject = await createModuleDocument('subject', 'Gestion', null)
    const cal = await createModuleDocument('calendar', 'Échéancier', null, { subjectId: subject.id })
    const stored = await db.notebooks.get(cal.id)
    expect(stored?.subjectId).toBe(subject.id)
  })
})
