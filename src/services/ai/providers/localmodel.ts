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
 * Renvoie la liste des modèles disponibles si possible. (Compat #12.)
 */
export async function testLocalModelConnection(settings: ProviderSettings): Promise<LocalModelTestResult> {
  const d = await diagnoseLocalModelConnection(settings)
  // Connectivité : un serveur qui répond (même si le modèle ciblé manque) est
  // « joignable ». Le détail fin (model-missing) est porté par le diagnostic.
  const connected = d.ok || d.status === 'model-missing'
  return { ok: connected, models: d.models, error: connected ? undefined : d.message }
}

/**
 * Statuts de diagnostic du serveur local. Le navigateur masque souvent la cause
 * exacte d'un échec réseau (CORS vs serveur down sont indistinguables) → on
 * reste PRUDENT : `unreachable-or-cors` n'affirme aucune cause unique.
 */
export type LocalModelStatus =
  | 'ok'
  | 'no-models'
  | 'model-missing'
  | 'endpoint-invalid'
  | 'unreachable-or-cors'
  | 'timeout'
  | 'invalid-response'
  | 'http-error'

export interface LocalModelDiagnosis {
  status: LocalModelStatus
  /** true seulement si réellement exploitable (ok / no-models). */
  ok: boolean
  /** Message clair et ACTIONNABLE pour l'utilisateur. */
  message: string
  models?: string[]
  httpStatus?: number
}

/**
 * Diagnostic enrichi de la connexion au serveur local (GET {baseUrl}/models).
 * Ne throw jamais ; classe le résultat et fournit un message actionnable.
 * Aucun appel hors action explicite (test/usage).
 */
export async function diagnoseLocalModelConnection(settings: ProviderSettings): Promise<LocalModelDiagnosis> {
  const url = `${baseUrl(settings)}/models`
  let res: Response
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: { ...authHeaders(settings) },
      signal: AbortSignal.timeout(settings.timeoutMs && settings.timeoutMs > 0 ? settings.timeoutMs : 10_000),
    })
  } catch (err) {
    const name = err instanceof Error ? err.name : ''
    if (name === 'TimeoutError') {
      return {
        status: 'timeout', ok: false,
        message: 'Délai dépassé : le serveur local n\'a pas répondu à temps. Vérifiez qu\'il tourne et augmentez le délai si le modèle est lourd.',
      }
    }
    // « Failed to fetch » : cause masquée par le navigateur (CORS OU serveur down).
    return {
      status: 'unreachable-or-cors', ok: false,
      message: 'Serveur injoignable ou origine non autorisée (CORS). Vérifiez que LM Studio/Ollama est lancé avec le serveur local activé, que l\'URL de base est correcte, et autorisez l\'origine (CORS) côté serveur.',
    }
  }

  if (res.status === 404) {
    return { status: 'endpoint-invalid', ok: false, httpStatus: 404, message: 'Endpoint introuvable (404). Vérifiez l\'URL de base (elle doit se terminer par « /v1 »).' }
  }
  if (!res.ok) {
    return { status: 'http-error', ok: false, httpStatus: res.status, message: `Le serveur a répondu HTTP ${res.status}. Vérifiez l\'URL de base et la configuration du serveur local.` }
  }

  let data: OpenAIModelsResponse
  try {
    data = (await res.json()) as OpenAIModelsResponse
  } catch {
    return { status: 'invalid-response', ok: false, message: 'Réponse inattendue (non-JSON). L\'URL pointe peut-être vers un service non compatible OpenAI.' }
  }

  const models = (data.data ?? []).map((m) => m.id).filter((id): id is string => typeof id === 'string')
  if (models.length === 0) {
    return { status: 'no-models', ok: true, models: [], message: 'Connecté, mais aucun modèle n\'est chargé. Chargez un modèle dans LM Studio / Ollama puis réessayez.' }
  }

  const target = settings.model.trim()
  if (target !== '' && !models.includes(target)) {
    return {
      status: 'model-missing', ok: false, models,
      message: `Connecté, mais le modèle « ${target} » n\'est pas disponible. Modèles détectés : ${models.slice(0, 6).join(', ')}.`,
    }
  }

  return { status: 'ok', ok: true, models, message: `Connecté · ${models.length} modèle(s) disponible(s).` }
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
