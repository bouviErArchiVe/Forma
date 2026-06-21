/**
 * LocalModelProvider — modèle IA LOCAL OpenAI-compatible (Sprint #12).
 *
 * Cible LM Studio (`http://localhost:1234/v1`) et Ollama en mode OpenAI
 * (`http://localhost:11434/v1`) via `POST {baseUrl}/chat/completions`. AUCUNE
 * dépendance lourde : `fetch` uniquement. Clé API OPTIONNELLE (la plupart des
 * serveurs locaux n'en exigent pas).
 *
 * Robustesse (jamais bloquant) :
 *  - timeout configurable ;
 *  - toute erreur réseau/CORS/HTTP/timeout → **fallback automatique** vers le
 *    mode local extractif Sprint #11 (`localProvider`) ;
 *  - `fromCloud: false`, `fromLocalModel: true` quand le modèle local répond.
 *
 * Strictement opt-in : ce provider n'est appelé que s'il est sélectionné.
 */
import type {
  AIProviderAdapter,
  ProviderChatRequest,
  ProviderChatResult,
  ProviderSettings,
} from '../types'
import { localProvider } from './local'

const DEFAULT_BASE_URL = 'http://localhost:1234/v1' // LM Studio
const DEFAULT_MODEL = 'local-model'
const DEFAULT_TIMEOUT_MS = 45_000

function baseUrl(settings: ProviderSettings): string {
  return (settings.endpoint || DEFAULT_BASE_URL).replace(/\/+$/, '')
}

function authHeaders(settings: ProviderSettings): Record<string, string> {
  const key = settings.apiKey.trim()
  return key !== '' ? { Authorization: `Bearer ${key}` } : {}
}

interface OpenAIChatResponse {
  choices?: Array<{ message?: { content?: string } }>
}

interface OpenAIModelsResponse {
  data?: Array<{ id?: string }>
}

export interface LocalModelTestResult {
  ok: boolean
  models?: string[]
  error?: string
}

/**
 * Teste la connexion au serveur local (GET {baseUrl}/models). Ne throw jamais.
 * Renvoie la liste des modèles disponibles si possible.
 */
export async function testLocalModelConnection(settings: ProviderSettings): Promise<LocalModelTestResult> {
  const url = `${baseUrl(settings)}/models`
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { ...authHeaders(settings) },
      signal: AbortSignal.timeout(settings.timeoutMs && settings.timeoutMs > 0 ? settings.timeoutMs : 10_000),
    })
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }
    const data = (await res.json().catch(() => ({}))) as OpenAIModelsResponse
    const models = (data.data ?? []).map((m) => m.id).filter((id): id is string => typeof id === 'string')
    return { ok: true, models }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, error: msg }
  }
}

export const localModelProvider: AIProviderAdapter = {
  id: 'localmodel',
  label: 'Modèle local (LM Studio / Ollama)',

  // Considéré configuré dès qu'une URL de base est présente (clé non requise).
  isConfigured(settings: ProviderSettings): boolean {
    return baseUrl(settings).trim() !== ''
  },

  async chat(request: ProviderChatRequest): Promise<ProviderChatResult> {
    const { settings } = request
    const timeout = settings.timeoutMs && settings.timeoutMs > 0 ? settings.timeoutMs : DEFAULT_TIMEOUT_MS

    try {
      const res = await fetch(`${baseUrl(settings)}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(settings) },
        body: JSON.stringify({
          model: settings.model || DEFAULT_MODEL,
          messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
          max_tokens: settings.maxTokens > 0 ? settings.maxTokens : 1024,
          temperature: settings.temperature,
          stream: false,
        }),
        signal: request.signal ?? AbortSignal.timeout(timeout),
      })

      if (!res.ok) {
        const body = await res.text().catch(() => '')
        return fallback(request, `Serveur local ${res.status} : ${body.slice(0, 160)}`)
      }

      const data = (await res.json()) as OpenAIChatResponse
      const text = data.choices?.[0]?.message?.content
      if (!text || text.trim() === '') {
        return fallback(request, 'Réponse vide du modèle local.')
      }

      return { text, providerId: 'localmodel', fromCloud: false, fromLocalModel: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return fallback(request, `Modèle local indisponible : ${msg}`)
    }
  },
}

/**
 * Repli sur le mode local extractif Sprint #11. On préserve la trace de l'erreur
 * du serveur local (pour le diagnostic) tout en garantissant une réponse.
 */
async function fallback(request: ProviderChatRequest, error: string): Promise<ProviderChatResult> {
  const res = await localProvider.chat(request)
  return { ...res, error }
}
