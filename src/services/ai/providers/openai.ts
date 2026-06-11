/**
 * OpenAIProvider — API OpenAI et tout backend compatible
 * (LM Studio, vLLM, serveur auto-hébergé…).
 *
 * POST {endpoint}/chat/completions, en-tête Authorization Bearer.
 * Ne throw JAMAIS : toute erreur (réseau, HTTP, parsing) est retournée
 * dans `ProviderChatResult.error`.
 */
import type {
  AIProviderAdapter,
  ProviderChatRequest,
  ProviderChatResult,
  ProviderSettings,
} from '../types'

const DEFAULT_ENDPOINT = 'https://api.openai.com/v1'
const DEFAULT_MODEL = 'gpt-4o-mini'
const TIMEOUT_MS = 30_000

/** true si l'endpoint pointe vers une machine locale (pas de clé requise). */
function isLocalEndpoint(endpoint: string): boolean {
  return /localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]/i.test(endpoint)
}

function errorResult(message: string): ProviderChatResult {
  return { text: '', providerId: 'openai', fromCloud: false, error: message }
}

interface OpenAIResponse {
  choices?: Array<{ message?: { content?: string } }>
}

export const openAIProvider: AIProviderAdapter = {
  id: 'openai',
  label: 'OpenAI / compatible',

  isConfigured(settings: ProviderSettings): boolean {
    return settings.apiKey.trim() !== '' || isLocalEndpoint(settings.endpoint)
  },

  async chat(request: ProviderChatRequest): Promise<ProviderChatResult> {
    const { settings } = request
    const endpoint = (settings.endpoint || DEFAULT_ENDPOINT).replace(/\/+$/, '')
    const apiKey = settings.apiKey.trim()

    try {
      const res = await fetch(`${endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey !== '' ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: settings.model || DEFAULT_MODEL,
          messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
          max_tokens: settings.maxTokens > 0 ? settings.maxTokens : 1024,
          temperature: settings.temperature,
        }),
        signal: request.signal ?? AbortSignal.timeout(TIMEOUT_MS),
      })

      if (!res.ok) {
        const body = await res.text().catch(() => '')
        return errorResult(`OpenAI API ${res.status} : ${body.slice(0, 200)}`)
      }

      const data = (await res.json()) as OpenAIResponse
      const text = data.choices?.[0]?.message?.content
      if (!text) return errorResult('Réponse vide du modèle.')

      return { text, providerId: 'openai', fromCloud: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return errorResult(`Erreur réseau OpenAI : ${msg}`)
    }
  },
}
