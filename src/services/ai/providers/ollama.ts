/**
 * OllamaProvider — serveur Ollama local (format natif /api/chat).
 *
 * POST {endpoint}/api/chat avec `stream: false`. Aucune clé requise :
 * `isConfigured` vérifie seulement la présence d'un endpoint.
 * Ne throw JAMAIS : toute erreur est retournée dans `error`.
 */
import type {
  AIProviderAdapter,
  ProviderChatRequest,
  ProviderChatResult,
  ProviderSettings,
} from '../types'

const DEFAULT_ENDPOINT = 'http://localhost:11434'
const DEFAULT_MODEL = 'llama3.2'
const TIMEOUT_MS = 60_000 // les modèles locaux peuvent être lents

function errorResult(message: string): ProviderChatResult {
  return { text: '', providerId: 'ollama', fromCloud: false, error: message }
}

interface OllamaResponse {
  message?: { content?: string }
}

export const ollamaProvider: AIProviderAdapter = {
  id: 'ollama',
  label: 'Ollama (local)',

  isConfigured(settings: ProviderSettings): boolean {
    return (settings.endpoint || DEFAULT_ENDPOINT).trim() !== ''
  },

  async chat(request: ProviderChatRequest): Promise<ProviderChatResult> {
    const { settings } = request
    const endpoint = (settings.endpoint || DEFAULT_ENDPOINT).replace(/\/+$/, '')

    try {
      const res = await fetch(`${endpoint}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: settings.model || DEFAULT_MODEL,
          messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
          stream: false,
          options: {
            num_predict: settings.maxTokens > 0 ? settings.maxTokens : 1024,
            temperature: settings.temperature,
          },
        }),
        signal: request.signal ?? AbortSignal.timeout(TIMEOUT_MS),
      })

      if (!res.ok) {
        const body = await res.text().catch(() => '')
        return errorResult(`Ollama ${res.status} : ${body.slice(0, 200)}`)
      }

      const data = (await res.json()) as OllamaResponse
      const text = data.message?.content
      if (!text) return errorResult('Réponse vide du modèle.')

      // Réponse produite par un serveur local — pas un cloud tiers.
      return { text, providerId: 'ollama', fromCloud: false }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return errorResult(`Erreur réseau Ollama : ${msg}`)
    }
  },
}
