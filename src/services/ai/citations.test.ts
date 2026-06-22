import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../../db'
import { createConversation } from './conversations'
import { sendFormAIMessage, sendFormAIMessageStream } from './chat'
import { localProvider } from './providers/local'
import type { ProviderChatRequest, ProviderSettings } from './types'

async function resetDb(): Promise<void> {
  db.close()
  await db.delete()
  await db.open()
}
beforeEach(resetDb)

const settings: ProviderSettings = { providerId: 'local', apiKey: '', model: '', endpoint: '', maxTokens: 512, temperature: 0.2 }
const ask = (content: string): ProviderChatRequest => ({ messages: [{ role: 'user', content }], settings })

describe('citations — provider extractif local', () => {
  it('réponse seeds → source structurée seed avec slug', async () => {
    const r = await localProvider.chat(ask("c'est quoi une poutre ?"))
    expect(r.sources).toBeDefined()
    const seed = r.sources!.find((s) => s.kind === 'seed')
    expect(seed).toBeDefined()
    expect(seed!.slug).toBe('poutre')
  })

  it('requête inconnue → pas de fausse citation', async () => {
    const r = await localProvider.chat(ask('zzqwxkjpzz inconnu'))
    expect(r.sources ?? []).toHaveLength(0)
  })
})

describe('citations — persistance dans le message assistant', () => {
  it('sendFormAIMessage persiste les sources seed', async () => {
    const c = await createConversation()
    const res = await sendFormAIMessage(c.id, "c'est quoi une poutre ?", {})
    const asst = res!.conversation.messages.find((m) => m.role === 'assistant')!
    expect(asst.sources?.some((s) => s.kind === 'seed' && s.slug === 'poutre')).toBe(true)
  })

  it('streaming (provider local) persiste aussi les sources', async () => {
    const c = await createConversation()
    const res = await sendFormAIMessageStream(c.id, "c'est quoi une poutre ?", {})
    const asst = res!.conversation.messages.find((m) => m.role === 'assistant')!
    expect(asst.sources?.length).toBeGreaterThan(0)
  })

  it('réponse sans source ne stocke pas de champ sources', async () => {
    const c = await createConversation()
    const res = await sendFormAIMessage(c.id, 'zzqwxkjpzz inconnu', {})
    const asst = res!.conversation.messages.find((m) => m.role === 'assistant')!
    expect(asst.sources).toBeUndefined()
  })
})
