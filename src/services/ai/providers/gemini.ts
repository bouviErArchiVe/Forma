/**
 * GeminiProvider — API Google Gemini (generateContent).
 *
 * POST {endpoint}/v1beta/models/{model}:generateContent?key={apiKey}
 * Le prompt système est passé via `systemInstruction` ; les messages
 * assistant utilisent le rôle 'model'. Ne throw JAMAIS : toute erreur
 * est retournée dans `ProviderChatResult.error`.
 */
import type {
  AIProviderAdapter,
  ProviderChatRequest,
  ProviderChatResult,
  ProviderSettings,
} from '../types'

const DEFAULT_ENDPOINT = 'https://generativelanguage.googleapis.com'
const DEFAULT_MODEL = 'gemini-2.0-flash'
const TIMEOUT_MS = 30_000

function errorResult(message: string): ProviderChatResult {
  return { text: '', providerId: 'gemini', fromCloud: false, error: message }
}

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
}

export const geminiProvider: AIProviderAdapter = {
  id: 'gemini',
  label: 'Google Gemini',

  isConfigured(settings: ProviderSettings): boolean {
    return settings.apiKey.trim() !== ''
  },

  async chat(request: ProviderChatRequest): Promise<ProviderChatResult> {
    const { settings } = request
    const endpoint = (settings.endpoint || DEFAULT_ENDPOINT).replace(/\/+$/, '')
    const model = settings.model || DEFAULT_MODEL
    const apiKey = settings.apiKey.trim()
    if (apiKey === '') return errorResult('Clé API Gemini manquante.')

    const systemText = request.messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n\n')
    const contents = request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))

    try {
      const res = await fetch(
        `${endpoint}/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            ...(systemText !== ''
              ? { systemInstruction: { parts: [{ text: systemText }] } }
              : {}),
            generationConfig: {
              maxOutputTokens: settings.maxTokens > 0 ? settings.maxTokens : 1024,
              temperature: settings.temperature,
            },
          }),
          signal: request.signal ?? AbortSignal.timeout(TIMEOUT_MS),
        },
      )

      if (!res.ok) {
        const body = await res.text().catch(() => '')
        return errorResult(`Gemini API ${res.status} : ${body.slice(0, 200)}`)
      }

      const data = (await res.json()) as GeminiResponse
      const text = data.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? '')
        .join('')
      if (!text) return errorResult('Réponse vide du modèle.')

      return { text, providerId: 'gemini', fromCloud: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return errorResult(`Erreur réseau Gemini : ${msg}`)
    }
  },
}
