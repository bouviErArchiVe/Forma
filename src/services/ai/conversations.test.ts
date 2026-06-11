import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../../db'
import {
  appendMessage,
  archiveConversation,
  clearConversations,
  createConversation,
  deleteConversation,
  deleteMessage,
  getConversation,
  listConversations,
  NEW_CONVERSATION_TITLE,
  renameConversation,
  toggleFavorite,
  unarchiveConversation,
} from './conversations'
import type { StoredChatMessage } from './types'

async function resetDb(): Promise<void> {
  db.close()
  await db.delete()
  await db.open()
}

function userMessage(content: string): Omit<StoredChatMessage, 'id'> {
  return { role: 'user', content, ts: Date.now() }
}

function assistantMessage(content: string): Omit<StoredChatMessage, 'id'> {
  return { role: 'assistant', content, ts: Date.now(), providerId: 'mock' }
}

beforeEach(async () => {
  await resetDb()
})

describe('createConversation', () => {
  it('crée une conversation vide avec le titre et l’agent par défaut', async () => {
    const conv = await createConversation()

    expect(conv.id).toBeTruthy()
    expect(conv.title).toBe(NEW_CONVERSATION_TITLE)
    expect(conv.agentId).toBe('general')
    expect(conv.messages).toEqual([])
    expect(conv.favorite).toBe(false)
    expect(conv.archived).toBe(false)
    expect(typeof conv.createdAt).toBe('number')
    expect(conv.updatedAt).toBe(conv.createdAt)

    const stored = await getConversation(conv.id)
    expect(stored).toEqual(conv)
  })

  it('respecte l’agentId fourni', async () => {
    const conv = await createConversation('quiz')
    expect(conv.agentId).toBe('quiz')
  })
})

describe('listConversations', () => {
  it('trie par updatedAt décroissant et exclut les archivées par défaut', async () => {
    const a = await createConversation()
    const b = await createConversation()
    const c = await createConversation()
    // updatedAt déterministes (Date.now() peut produire des égalités).
    await db.aiConversations.update(a.id, { updatedAt: 1000 })
    await db.aiConversations.update(b.id, { updatedAt: 3000 })
    await db.aiConversations.update(c.id, { updatedAt: 2000 })
    await archiveConversation(c.id)

    const list = await listConversations()
    expect(list.map((x) => x.id)).toEqual([b.id, a.id])
  })

  it('liste les archivées avec archived=true', async () => {
    const a = await createConversation()
    await createConversation()
    await archiveConversation(a.id)

    const archived = await listConversations({ archived: true })
    expect(archived.map((x) => x.id)).toEqual([a.id])
  })

  it('filtre les favorites avec favoritesOnly', async () => {
    const a = await createConversation()
    await createConversation()
    await toggleFavorite(a.id)

    const favorites = await listConversations({ favoritesOnly: true })
    expect(favorites.map((x) => x.id)).toEqual([a.id])
  })

  it('recherche dans le titre, insensible à la casse', async () => {
    const a = await createConversation()
    await createConversation()
    await renameConversation(a.id, 'Plan de Révision BTS')

    const hits = await listConversations({ query: 'révision' })
    expect(hits.map((x) => x.id)).toEqual([a.id])
  })

  it('recherche dans le contenu des messages', async () => {
    const a = await createConversation()
    const b = await createConversation()
    await appendMessage(a.id, assistantMessage('La photosynthèse transforme la lumière.'))
    await appendMessage(b.id, assistantMessage('Le théorème de Pythagore.'))

    const hits = await listConversations({ query: 'PHOTOSYNTHÈSE' })
    expect(hits.map((x) => x.id)).toEqual([a.id])
  })
})

describe('appendMessage', () => {
  it('ajoute le message avec un id généré et met à jour updatedAt', async () => {
    const conv = await createConversation()
    await db.aiConversations.update(conv.id, { updatedAt: 1 })

    const updated = await appendMessage(conv.id, userMessage('Bonjour'))

    expect(updated).toBeDefined()
    expect(updated?.messages).toHaveLength(1)
    expect(updated?.messages[0]?.id).toBeTruthy()
    expect(updated?.messages[0]?.content).toBe('Bonjour')
    expect(updated?.updatedAt).toBeGreaterThan(1)
  })

  it('définit le titre auto depuis le premier message user (50 chars max)', async () => {
    const conv = await createConversation()
    const long = 'a'.repeat(80)

    const updated = await appendMessage(conv.id, userMessage(long))

    expect(updated?.title).toBe('a'.repeat(50))
    expect(updated?.title.length).toBe(50)
  })

  it('ne change pas le titre pour un message assistant ni si déjà renommée', async () => {
    const conv = await createConversation()
    await appendMessage(conv.id, assistantMessage('Réponse IA'))
    expect((await getConversation(conv.id))?.title).toBe(NEW_CONVERSATION_TITLE)

    await renameConversation(conv.id, 'Mon titre')
    await appendMessage(conv.id, userMessage('Question'))
    expect((await getConversation(conv.id))?.title).toBe('Mon titre')
  })

  it('retourne undefined si la conversation n’existe pas', async () => {
    expect(await appendMessage('inconnue', userMessage('x'))).toBeUndefined()
  })
})

describe('renameConversation', () => {
  it('renomme la conversation', async () => {
    const conv = await createConversation()
    await renameConversation(conv.id, 'Cours de maths')
    expect((await getConversation(conv.id))?.title).toBe('Cours de maths')
  })
})

describe('toggleFavorite', () => {
  it('inverse le statut favori à chaque appel', async () => {
    const conv = await createConversation()
    await toggleFavorite(conv.id)
    expect((await getConversation(conv.id))?.favorite).toBe(true)
    await toggleFavorite(conv.id)
    expect((await getConversation(conv.id))?.favorite).toBe(false)
  })
})

describe('archiveConversation / unarchiveConversation', () => {
  it('archive puis désarchive', async () => {
    const conv = await createConversation()
    await archiveConversation(conv.id)
    expect((await getConversation(conv.id))?.archived).toBe(true)
    await unarchiveConversation(conv.id)
    expect((await getConversation(conv.id))?.archived).toBe(false)
  })
})

describe('deleteConversation', () => {
  it('supprime définitivement', async () => {
    const conv = await createConversation()
    await deleteConversation(conv.id)
    expect(await getConversation(conv.id)).toBeUndefined()
    expect(await db.aiConversations.count()).toBe(0)
  })
})

describe('deleteMessage', () => {
  it('supprime un message par id', async () => {
    const conv = await createConversation()
    const withFirst = await appendMessage(conv.id, userMessage('Premier'))
    await appendMessage(conv.id, assistantMessage('Second'))
    const firstId = withFirst?.messages[0]?.id
    expect(firstId).toBeTruthy()

    await deleteMessage(conv.id, firstId!)

    const stored = await getConversation(conv.id)
    expect(stored?.messages).toHaveLength(1)
    expect(stored?.messages[0]?.content).toBe('Second')
  })
})

describe('clearConversations', () => {
  it('vide la table', async () => {
    await createConversation()
    await createConversation()
    await clearConversations()
    expect(await db.aiConversations.count()).toBe(0)
  })
})
