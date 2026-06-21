import { afterEach, describe, expect, it, vi } from 'vitest'
import { localModelProvider, testLocalModelConnection } from './providers/localmodel'
import { NO_KNOWLEDGE_MESSAGE } from './providers/local'
import { DEFAULT_ENDPOINTS } from '../../stores/aiStore'
import type { ProviderChatRequest, ProviderSettings } from './types'

const settings: ProviderSettings = {
  providerId: 'localmodel', apiKey: '', model: 'local-model',
  endpoint: 'http://localhost:1234/v1', maxTokens: 512, temperature: 0.2, timeoutMs: 10000,
}
const ask = (content: string): ProviderChatRequest => ({ messages: [{ role: 'user', content }], settings })

afterEach(() => vi.unstubAllGlobals())

function stubFetch(handler: (url: string, init?: RequestInit) => unknown) {
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => handler(String(url), init)))
}

describe('localModelProvider', () => {
  it('isConfigured dès qu’une URL de base est présente (pas de clé requise)', () => {
    expect(localModelProvider.isConfigured(settings)).toBe(true)
    expect(localModelProvider.isConfigured({ ...settings, endpoint: '' })).toBe(true) // défaut LM Studio
  })

  it('réponse mockée du modèle local → fromLocalModel=true, fromCloud=false', async () => {
    stubFetch(() => ({ ok: true, json: async () => ({ choices: [{ message: { content: 'Réponse du modèle local.' } }] }) }))
    const res = await localModelProvider.chat(ask("explique l'isolation continue"))
    expect(res.text).toBe('Réponse du modèle local.')
    expect(res.fromLocalModel).toBe(true)
    expect(res.fromCloud).toBe(false)
    expect(res.providerId).toBe('localmodel')
  })

  it('serveur indisponible (réseau) → fallback mode local Sprint #11', async () => {
    stubFetch(() => { throw new Error('ECONNREFUSED') })
    const res = await localModelProvider.chat(ask('xqzwk blarg totalement inconnu'))
    expect(res.fromCloud).toBe(false)
    expect(res.text).toBe(NO_KNOWLEDGE_MESSAGE) // fallback extractif honnête
    expect(res.error).toContain('indisponible')
  })

  it('fallback ancré Knowledge si la question correspond à une fiche', async () => {
    stubFetch(() => { throw new Error('offline') })
    const res = await localModelProvider.chat(ask("c'est quoi une poutre ?"))
    expect(res.text).toContain('/dictionary?slug=poutre')
    expect(res.error).toBeDefined()
  })

  it('HTTP 500 → fallback (jamais bloquant)', async () => {
    stubFetch(() => ({ ok: false, status: 500, text: async () => 'boom' }))
    const res = await localModelProvider.chat(ask('xqzwk inconnu'))
    expect(res.text).toBe(NO_KNOWLEDGE_MESSAGE)
  })
})

describe('testLocalModelConnection', () => {
  it('liste les modèles quand le serveur répond', async () => {
    stubFetch(() => ({ ok: true, json: async () => ({ data: [{ id: 'llama3' }, { id: 'mistral' }] }) }))
    const r = await testLocalModelConnection(settings)
    expect(r.ok).toBe(true)
    expect(r.models).toEqual(['llama3', 'mistral'])
  })

  it('signale l’échec sans throw', async () => {
    stubFetch(() => { throw new Error('refused') })
    const r = await testLocalModelConnection(settings)
    expect(r.ok).toBe(false)
    expect(r.error).toBeTruthy()
  })
})

describe('aiStore — réglages localmodel', () => {
  it('URL de base par défaut = LM Studio', () => {
    expect(DEFAULT_ENDPOINTS.localmodel).toBe('http://localhost:1234/v1')
  })
})
