import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../../db'
import { createConversation, getConversation } from './conversations'
import { sendFormAIMessageStream } from './chat'

async function resetDb(): Promise<void> {
  db.close()
  await db.delete()
  await db.open()
}

beforeEach(resetDb)

describe('sendFormAIMessageStream', () => {
  it('ignore un message vide', async () => {
    const c = await createConversation()
    const r = await sendFormAIMessageStream(c.id, '   ', {})
    expect(r).toBeUndefined()
  })

  it('provider non-stream (local) : onChunk appelé une fois avec le texte final', async () => {
    const c = await createConversation()
    const chunks: string[] = []
    const r = await sendFormAIMessageStream(c.id, "c'est quoi une poutre ?", {
      onChunk: (acc) => chunks.push(acc),
    })
    expect(r).toBeDefined()
    expect(chunks).toHaveLength(1)
    // Le message assistant persisté correspond au dernier chunk.
    const assistant = r!.conversation.messages.find((m) => m.role === 'assistant')
    expect(assistant).toBeDefined()
    expect(assistant!.content).toBe(chunks[0])
  })

  it('persiste les messages user + assistant', async () => {
    const c = await createConversation()
    await sendFormAIMessageStream(c.id, 'bonjour', {})
    const fresh = await getConversation(c.id)
    expect(fresh!.messages.filter((m) => m.role === 'user')).toHaveLength(1)
    expect(fresh!.messages.filter((m) => m.role === 'assistant')).toHaveLength(1)
  })
})
