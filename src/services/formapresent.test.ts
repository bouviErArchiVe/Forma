import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db'
import { buildTemplate } from '../lib/formapresent/templates'
import { cloneDeck, createDeck } from '../lib/formapresent/model'
import {
  createDeckFromTemplate,
  deleteDeck,
  duplicateDeck,
  getDeck,
  listDecks,
  saveDeck,
  searchDecks,
} from './formapresent'

async function resetDb(): Promise<void> {
  db.close()
  await db.delete()
  await db.open()
}

describe('formapresent service', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('creates deck from architecture template', async () => {
    const deck = await createDeckFromTemplate('architecture', 'Mon projet')
    expect(deck.title).toBe('Mon projet')
    expect(deck.slides.length).toBeGreaterThan(1)
    expect(await listDecks()).toHaveLength(1)
  })

  it('saves and retrieves deck', async () => {
    const deck = await createDeckFromTemplate('blank')
    const updated = await saveDeck({ ...deck, title: 'Renommé' })
    const row = await getDeck(deck.id)
    expect(row?.title).toBe('Renommé')
    expect(updated.updatedAt).toBeGreaterThanOrEqual(deck.updatedAt)
  })

  it('duplicates and deletes deck', async () => {
    const deck = await createDeckFromTemplate('blank', 'Original')
    const copy = await duplicateDeck(deck.id)
    expect(copy?.title).toContain('copie')
    expect(await listDecks()).toHaveLength(2)
    await deleteDeck(deck.id)
    expect(await listDecks()).toHaveLength(1)
  })

  it('searches by title and slide content', async () => {
    await createDeckFromTemplate('blank', 'Architecture urbaine')
    const other = await createDeckFromTemplate('blank', 'Autre')
    await saveDeck({
      ...other,
      slides: [
        {
          ...other.slides[0]!,
          elements: [
            {
              ...other.slides[0]!.elements[0],
              id: 'el1',
              type: 'text',
              x: 0,
              y: 0,
              w: 100,
              h: 50,
              rotation: 0,
              opacity: 1,
              zIndex: 1,
              animation: 'none',
              createdAt: Date.now(),
              content: 'béton précontraint',
            },
          ],
        },
      ],
    })
    expect(await searchDecks('archi')).toHaveLength(1)
    expect(await searchDecks('béton')).toHaveLength(1)
  })
})

describe('present model', () => {
  it('buildTemplate architecture has multiple slides', () => {
    const deck = buildTemplate('architecture', 'Test')
    expect(deck.template).toBe('architecture')
    expect(deck.slides.length).toBeGreaterThan(3)
  })

  it('cloneDeck assigns new ids', () => {
    const deck = createDeck('Src')
    const copy = cloneDeck(deck)
    expect(copy.id).not.toBe(deck.id)
    expect(copy.slides[0]?.id).not.toBe(deck.slides[0]?.id)
  })
})
