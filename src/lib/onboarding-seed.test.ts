import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db'
import {
  ONBOARDING_NOTEBOOK_NAME,
  seedExampleNotebook,
  seedExampleNotebookIfEmpty,
} from './onboarding-seed'
import { makeTestNotebook } from './forma-test-fixtures'

async function resetDb(): Promise<void> {
  db.close()
  await db.delete()
  await db.open()
}

describe('seedExampleNotebook', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('creates a notebook with the expected name and pages', async () => {
    const id = await seedExampleNotebook()

    const notebook = await db.notebooks.get(id)
    expect(notebook).toBeDefined()
    expect(notebook?.name).toBe(ONBOARDING_NOTEBOOK_NAME)
    expect(notebook?.id).toBe(id)
    expect(notebook?.folderId).toBeNull()
    expect(typeof notebook?.createdAt).toBe('number')
    expect(typeof notebook?.updatedAt).toBe('number')

    const pages = await db.pages.where('notebookId').equals(id).sortBy('order')
    expect(pages).toHaveLength(3)
    expect(pages[0]?.order).toBe(0)
    expect(pages[1]?.order).toBe(1)
    expect(pages[2]?.order).toBe(2)

    // Page 1: explanatory text
    expect(pages[0]?.texts.length).toBeGreaterThan(0)
    expect(pages[0]?.texts[0]?.content).toContain('Bienvenue')

    // Page 2: annotation example with a stroke
    expect(pages[1]?.strokes.length).toBeGreaterThan(0)
    expect(pages[1]?.strokes[0]?.points.length).toBeGreaterThan(1)

    // Page 3: mentions the AI assistant
    expect(pages[2]?.texts.some((t) => /assistant/i.test(t.content))).toBe(true)

    // Each page belongs to the notebook and has a valid pageId on its elements
    for (const page of pages) {
      expect(page.notebookId).toBe(id)
      for (const text of page.texts) expect(text.pageId).toBe(page.id)
      for (const stroke of page.strokes) expect(stroke.pageId).toBe(page.id)
    }
  })
})

describe('seedExampleNotebookIfEmpty', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('seeds the example notebook when the library is empty', async () => {
    expect(await db.notebooks.count()).toBe(0)

    const id = await seedExampleNotebookIfEmpty()

    expect(id).not.toBeNull()
    expect(await db.notebooks.count()).toBe(1)
    const notebook = await db.notebooks.get(id!)
    expect(notebook?.name).toBe(ONBOARDING_NOTEBOOK_NAME)
  })

  it('does nothing when the library already has a notebook', async () => {
    await db.notebooks.add(makeTestNotebook())

    const id = await seedExampleNotebookIfEmpty()

    expect(id).toBeNull()
    expect(await db.notebooks.count()).toBe(1)
  })

  it('seeds only once when called concurrently (StrictMode double effect)', async () => {
    const [a, b] = await Promise.all([
      seedExampleNotebookIfEmpty(),
      seedExampleNotebookIfEmpty(),
    ])

    // Exactly one call must have created the notebook.
    expect([a, b].filter((id) => id !== null)).toHaveLength(1)
    expect(await db.notebooks.count()).toBe(1)
    const pages = await db.pages.count()
    expect(pages).toBe(3)
  })
})
