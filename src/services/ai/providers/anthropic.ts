/**
 * AnthropicProvider — API Anthropic (Claude).
 *
 * POST {endpoint}/v1/messages avec les en-têtes `x-api-key`,
 * `anthropic-version: 2023-06-01` et
 * `anthropic-dangerous-direct-browser-access: true` (appel direct navigateur).
 *
 * Particularités API : le prompt système est passé au top-level (`system`),
 * jamais dans `messages` ; `max_tokens` est requis.
 * Ne throw JAMAIS : toute erreur est retournée dans `error`.
 */
import type {
  AIProviderAdapter,
  ProviderChatRequest,
  ProviderChatResult,
  ProviderSettings,
} from '../types'

const DEFAULT_ENDPOINT = 'https://api.anthropic.com'
const DEFAULT_MODEL = 'claude-haiku-4-5'
const TIMEOUT_MS = 30_000

function errorResult(message: string): ProviderChatResult {
  return { text: '', providerId: 'anthropic', fromCloud: false, error: message }
}

interface AnthropicResponse {
  content?: Array<{ type: string; text?: string }>
}

export const anthropicProvider: AIProviderAdapter = {
  id: 'anthropic',
  label: 'Anthropic (Claude)',

  isConfigured(settings: ProviderSettings): boolean {
    return settings.apiKey.trim() !== ''
  },

  async chat(request: ProviderChatRequest): Promise<ProviderChatResult> {
    const { settings } = request
    const endpoint = (settings.endpoint || DEFAULT_ENDPOINT).replace(/\/+$/, '')

    // L'API Anthropic prend le prompt système au top-level, séparé des messages.
    const system = request.messages.find((m) => m.role === 'system')?.content
    const conversation = request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch(`${endpoint}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.apiKey.trim(),
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: settings.model || DEFAULT_MODEL,
          ...(system ? { system } : {}),
          messages: conversation,
          // max_tokens est obligatoire pour l'API Anthropic.
          max_tokens: settings.maxTokens > 0 ? settings.maxTokens : 1024,
          temperature: settings.temperature,
        }),
        signal: request.signal ?? AbortSignal.timeout(TIMEOUT_MS),
      })

      if (!res.ok) {
        const body = await res.text().catch(() => '')
        return errorResult(`Anthropic API ${res.status} : ${body.slice(0, 200)}`)
      }

      const data = (await res.json()) as AnthropicResponse
      const text = data.content?.find((block) => block.type === 'text')?.text
      if (!text) return errorResult('Réponse vide du modèle.')

      return { text, providerId: 'anthropic', fromCloud: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return errorResult(`Erreur réseau Anthropic : ${msg}`)
    }
  },
}
