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
  StreamChunkHandler,
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

// ─── Streaming (Sprint #17) ─────────────────────────────────────────────────

/**
 * Extrait le delta de contenu d'une ligne SSE OpenAI-compatible
 * (`data: {json}`). Renvoie '' si la ligne est vide, non-`data:`, `[DONE]`,
 * ou un JSON malformé (tolérant : on ignore les fragments invalides).
 */
export function extractSSEDelta(line: string): string {
  const trimmed = line.trim()
  if (trimmed === '' || !trimmed.startsWith('data:')) return ''
  const payload = trimmed.slice('data:'.length).trim()
  if (payload === '' || payload === '[DONE]') return ''
  try {
    const json = JSON.parse(payload) as { choices?: Array<{ delta?: { content?: string } }> }
    const delta = json.choices?.[0]?.delta?.content
    return typeof delta === 'string' ? delta : ''
  } catch {
    return '' // SSE malformé : on ignore ce fragment plutôt que d'échouer.
  }
}

/** Vrai si la ligne SSE signale la fin du flux (`data: [DONE]`). */
function isSSEDone(line: string): boolean {
  return line.trim() === 'data: [DONE]' || line.trim() === 'data:[DONE]'
}

/**
 * Chat en STREAMING contre le modèle local (OpenAI-compatible, `stream: true`).
 * Parse le SSE, appelle `onChunk(delta)` au fil de l'eau, et renvoie le résultat
 * final. JAMAIS bloquant :
 *  - erreur réseau/HTTP/timeout/flux vide → **fallback non-stream** (qui retombe
 *    lui-même sur le mode local #11) ;
 *  - abort UTILISATEUR (stop) → réponse partielle finalisée, `interrupted: true`
 *    (PAS de fallback : l'utilisateur a choisi d'arrêter) ;
 *  - SSE malformé → fragments ignorés, le reste est conservé.
 *
 * `fromLocalModel: true` seulement si le modèle local a produit du texte.
 * Aucun appel automatique : n'est invoqué que sur action explicite.
 */
export async function streamLocalModelChat(
  request: ProviderChatRequest,
  onChunk: StreamChunkHandler,
): Promise<ProviderChatResult> {
  const { settings } = request
  const timeout = settings.timeoutMs && settings.timeoutMs > 0 ? settings.timeoutMs : DEFAULT_TIMEOUT_MS
  const userSignal = request.signal
  const timeoutSignal = AbortSignal.timeout(timeout)
  // Combine abort utilisateur + timeout quand c'est possible.
  const signal =
    userSignal && typeof AbortSignal.any === 'function'
      ? AbortSignal.any([userSignal, timeoutSignal])
      : (userSignal ?? timeoutSignal)

  let acc = ''
  try {
    const res = await fetch(`${baseUrl(settings)}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(settings) },
      body: JSON.stringify({
        model: settings.model || DEFAULT_MODEL,
        messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
        max_tokens: settings.maxTokens > 0 ? settings.maxTokens : 1024,
        temperature: settings.temperature,
        stream: true,
      }),
      signal,
    })

    if (!res.ok || !res.body) {
      const body = res.ok ? '' : await res.text().catch(() => '')
      return fallback(request, res.ok ? 'Flux indisponible (pas de corps).' : `Serveur local ${res.status} : ${body.slice(0, 160)}`)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let done = false
    while (!done) {
      const { value, done: streamDone } = await reader.read()
      if (streamDone) break
      buffer += decoder.decode(value, { stream: true })
      // Découpe en lignes complètes ; conserve le reste partiel dans `buffer`.
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (isSSEDone(line)) { done = true; break }
        const delta = extractSSEDelta(line)
        if (delta !== '') { acc += delta; onChunk(delta) }
      }
    }
    // Traite un éventuel reliquat (dernière ligne sans \n final).
    if (!done && buffer.trim() !== '' && !isSSEDone(buffer)) {
      const delta = extractSSEDelta(buffer)
      if (delta !== '') { acc += delta; onChunk(delta) }
    }

    if (acc.trim() === '') {
      return fallback(request, 'Réponse vide du modèle local (stream).')
    }
    return { text: acc, providerId: 'localmodel', fromCloud: false, fromLocalModel: true }
  } catch (err) {
    // Abort explicite de l'utilisateur (stop) : finaliser le partiel, ne pas replier.
    if (userSignal?.aborted) {
      return {
        text: acc,
        providerId: 'localmodel',
        fromCloud: false,
        fromLocalModel: acc.trim() !== '',
        interrupted: true,
        error: 'Génération interrompue.',
      }
    }
    // Timeout ou erreur réseau/CORS : repli non-stream (puis #11).
    const msg = err instanceof Error ? err.message : String(err)
    return fallback(request, `Streaming modèle local indisponible : ${msg}`)
  }
}
