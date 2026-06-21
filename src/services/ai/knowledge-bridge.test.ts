import { describe, expect, it } from 'vitest'
import { knowledgeAnswer } from './knowledge-bridge'
import { localProvider, NO_KNOWLEDGE_MESSAGE } from './providers/local'
import type { ProviderChatRequest, ProviderSettings } from './types'

const settings: ProviderSettings = {
  providerId: 'local', apiKey: '', model: '', endpoint: '', maxTokens: 512, temperature: 0.2,
}
const ask = (content: string): ProviderChatRequest => ({ messages: [{ role: 'user', content }], settings })

describe('knowledgeAnswer (pont Knowledge)', () => {
  it('répond à une question de connaissance par une fiche ancrée (poutre)', async () => {
    const r = await knowledgeAnswer("c'est quoi une poutre ?")
    expect(r).not.toBeNull()
    expect(r!.slug).toBe('poutre')
    expect(r!.text).toContain('/dictionary?slug=poutre')
    expect(r!.text.toLowerCase()).toContain('source')
    expect(r!.text.toLowerCase()).toContain('confiance')
  })

  it('avertit clairement quand la fiche est « à-vérifier » (garde-corps)', async () => {
    const r = await knowledgeAnswer("c'est quoi un garde-corps ?")
    expect(r).not.toBeNull()
    expect(r!.confidence).toBe('à-vérifier')
    expect(r!.text).toContain('à vérifier')
  })

  it('renvoie null sur une requête inconnue (jamais d’invention)', async () => {
    expect(await knowledgeAnswer('zzqwxkjpzz blarg')).toBeNull()
  })

  it('renvoie null si la question ne contient aucun mot-clé', async () => {
    expect(await knowledgeAnswer('???')).toBeNull()
  })
})

describe('localProvider — bridge Knowledge avant fallback', () => {
  it('utilise Knowledge pour une question générale', async () => {
    const res = await localProvider.chat(ask("c'est quoi une poutre ?"))
    expect(res.fromCloud).toBe(false)
    expect(res.text).toContain('/dictionary?slug=poutre')
  })

  it('garde un no-result honnête quand rien ne correspond', async () => {
    const res = await localProvider.chat(ask('zzqwxkjpzz blarg inconnu'))
    expect(res.text).toBe(NO_KNOWLEDGE_MESSAGE)
    expect(res.text).toContain('base Knowledge locale')
  })

  it('ne prétend jamais être une IA cloud', async () => {
    const res = await localProvider.chat(ask("c'est quoi une dalle ?"))
    expect(res.fromCloud).toBe(false)
    expect(res.providerId).toBe('local')
  })
})
