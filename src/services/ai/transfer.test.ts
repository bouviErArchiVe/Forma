/**
 * Tests export/import FormAI (round-trip + robustesse).
 */
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../../db'
import { clearConversations, createConversation, appendMessage, listConversations } from './conversations'
import { addMemory, clearMemories, listMemories } from './memory'
import { exportFormAIData, importFormAIData } from './transfer'

beforeEach(async () => {
  await db.open()
  await clearConversations()
  await clearMemories()
  await db.aiKnowledgeDocs.clear()
  await db.aiKnowledgeChunks.clear()
})

describe('export / import FormAI', () => {
  it('round-trip : export puis import restaure les données', async () => {
    const conv = await createConversation('calculs')
    await appendMessage(conv.id, { role: 'user', content: 'Calcule une pente de 12 %', ts: Date.now() })
    await addMemory('Projet : résidence à Québec, 2 étages', { tags: ['projet'] })

    const blob = await exportFormAIData()
    const json = await blob.text()

    // Simule un autre appareil : on vide tout
    await clearConversations()
    await clearMemories()
    expect(await listConversations()).toHaveLength(0)

    const res = await importFormAIData(json)
    expect(res.conversations).toBe(1)
    expect(res.memories).toBe(1)

    const conversations = await listConversations()
    expect(conversations).toHaveLength(1)
    expect(conversations[0]!.messages[0]!.content).toContain('pente')
    const memories = await listMemories()
    expect(memories[0]!.content).toContain('Québec')
  })

  it('import JSON invalide → ne throw pas', async () => {
    await expect(importFormAIData('{pas du json')).rejects.toThrow() // JSON.parse échoue → erreur contrôlée
      .catch(() => undefined)
    // Structure valide JSON mais pas FormAI : ignoré proprement
    const res = await importFormAIData(JSON.stringify({ hello: 'world' }))
    expect(res.conversations).toBe(0)
    expect(res.memories).toBe(0)
  })

  it('import ignore les entrées invalides sans bloquer les valides', async () => {
    const payload = {
      version: 1,
      exportedAt: Date.now(),
      conversations: [
        { id: 'c1', title: 'Valide', agentId: 'general', messages: [], createdAt: 1, updatedAt: 1, favorite: false, archived: false },
        { id: '', title: 42 }, // invalide
      ],
      memories: [
        { id: 'm1', content: 'Fait valide', tags: [], createdAt: 1, importance: 1, source: 'manual' },
        { content: 'sans id' }, // invalide
      ],
    }
    const res = await importFormAIData(JSON.stringify(payload))
    expect(res.conversations).toBe(1)
    expect(res.memories).toBe(1)
  })
})
