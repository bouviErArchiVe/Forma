/**
 * Tests de la couche providers FormAI.
 * Aucun appel réseau réel : fetch est mocké (vi.stubGlobal).
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AIChatMessage, ProviderSettings } from '../types'
import { anthropicProvider } from './anthropic'
import { geminiProvider } from './gemini'
import { localProvider } from './local'
import { mockProvider } from './mock'
import { ollamaProvider } from './ollama'
import { openAIProvider } from './openai'
import { getProvider, listProviders } from './index'

const MESSAGES: AIChatMessage[] = [
  { role: 'system', content: 'Tu es FormAI, agent de test.' },
  { role: 'user', content: 'Bonjour, calcule une pente.' },
]

function settings(partial: Partial<ProviderSettings> = {}): ProviderSettings {
  return {
    providerId: 'mock',
    apiKey: '',
    model: '',
    endpoint: '',
    maxTokens: 256,
    temperature: 0.5,
    ...partial,
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

// ─── Registre ─────────────────────────────────────────────────────────────────

describe('registre des providers', () => {
  it('expose les 7 providers', () => {
    const ids = listProviders().map((p) => p.id)
    expect(ids).toEqual(
      expect.arrayContaining(['mock', 'local', 'localmodel', 'openai', 'anthropic', 'gemini', 'ollama']),
    )
    expect(ids).toHaveLength(7)
  })

  it('getProvider retourne le bon adapter', () => {
    expect(getProvider('openai').id).toBe('openai')
    expect(getProvider('mock').id).toBe('mock')
  })
})

// ─── Mock & local ─────────────────────────────────────────────────────────────

describe('mockProvider', () => {
  it('est toujours configuré et répond sans réseau', async () => {
    expect(mockProvider.isConfigured(settings())).toBe(true)
    const res = await mockProvider.chat({ messages: MESSAGES, settings: settings() })
    expect(res.text).toContain('mode démo')
    expect(res.text).toContain('Bonjour, calcule une pente.')
    expect(res.fromCloud).toBe(false)
    expect(res.error).toBeUndefined()
  })
})

describe('localProvider', () => {
  it('est toujours configuré et répond sans réseau', async () => {
    expect(localProvider.isConfigured(settings())).toBe(true)
    const res = await localProvider.chat({ messages: MESSAGES, settings: settings() })
    expect(res.text).toBeTruthy()
    expect(res.fromCloud).toBe(false)
  })
})

// ─── isConfigured ─────────────────────────────────────────────────────────────

describe('isConfigured', () => {
  it('openai : clé OU endpoint local', () => {
    expect(openAIProvider.isConfigured(settings({ apiKey: 'sk-x' }))).toBe(true)
    expect(openAIProvider.isConfigured(settings({ endpoint: 'http://localhost:1234/v1' }))).toBe(true)
    expect(openAIProvider.isConfigured(settings())).toBe(false)
  })

  it('anthropic et gemini : clé requise', () => {
    expect(anthropicProvider.isConfigured(settings({ apiKey: 'k' }))).toBe(true)
    expect(anthropicProvider.isConfigured(settings())).toBe(false)
    expect(geminiProvider.isConfigured(settings({ apiKey: 'k' }))).toBe(true)
    expect(geminiProvider.isConfigured(settings())).toBe(false)
  })

  it('ollama : aucun prérequis (endpoint par défaut)', () => {
    expect(ollamaProvider.isConfigured(settings())).toBe(true)
  })
})

// ─── Appels réseau mockés ─────────────────────────────────────────────────────

describe('providers cloud (fetch mocké)', () => {
  it('openai : succès → texte extrait', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: 'Réponse GPT' } }] }), { status: 200 }),
    ))
    const res = await openAIProvider.chat({ messages: MESSAGES, settings: settings({ apiKey: 'sk-x' }) })
    expect(res.text).toBe('Réponse GPT')
    expect(res.fromCloud).toBe(true)
    expect(res.error).toBeUndefined()
  })

  it('anthropic : succès → texte extrait, system séparé', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ content: [{ type: 'text', text: 'Réponse Claude' }] }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const res = await anthropicProvider.chat({ messages: MESSAGES, settings: settings({ apiKey: 'k' }) })
    expect(res.text).toBe('Réponse Claude')
    const body = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string)
    expect(body.system).toBeTruthy()
    expect((body.messages as unknown[]).length).toBe(1) // system retiré des messages
  })

  it('gemini : succès → texte extrait des parts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Réponse Gemini' }] } }] }), { status: 200 }),
    ))
    const res = await geminiProvider.chat({ messages: MESSAGES, settings: settings({ apiKey: 'k' }) })
    expect(res.text).toBe('Réponse Gemini')
    expect(res.fromCloud).toBe(true)
  })

  it('ollama : succès → texte extrait, fromCloud false', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: { content: 'Réponse Llama' } }), { status: 200 }),
    ))
    const res = await ollamaProvider.chat({ messages: MESSAGES, settings: settings() })
    expect(res.text).toBe('Réponse Llama')
    expect(res.fromCloud).toBe(false)
  })

  it('erreur réseau → error rempli, jamais de throw', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network down')))
    for (const provider of [openAIProvider, anthropicProvider, geminiProvider, ollamaProvider]) {
      const res = await provider.chat({
        messages: MESSAGES,
        settings: settings({ apiKey: 'k' }),
      })
      expect(res.error, provider.id).toBeTruthy()
      expect(res.text).toBe('')
    }
  })

  it('HTTP non-200 → error avec statut', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Unauthorized', { status: 401 })))
    const res = await openAIProvider.chat({ messages: MESSAGES, settings: settings({ apiKey: 'bad' }) })
    expect(res.error).toContain('401')
  })
})
