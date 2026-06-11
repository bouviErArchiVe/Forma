/**
 * MockProvider — provider déterministe sans réseau.
 *
 * Utilisé pour les tests et le mode démo : il renvoie un echo structuré
 * du dernier message utilisateur, mentionne l'agent actif (première ligne
 * du prompt système) et simule une latence d'environ 300 ms.
 *
 * Toujours configuré (`isConfigured` retourne true), jamais d'erreur réseau.
 */
import type {
  AIProviderAdapter,
  ProviderChatRequest,
  ProviderChatResult,
} from '../types'

/** Latence simulée (ms) pour rester proche d'un vrai aller-retour réseau. */
const MOCK_LATENCY_MS = 300

/**
 * Attend `ms` millisecondes. Retourne false si le signal est annulé avant la fin.
 */
function wait(ms: number, signal?: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve(false)
      return
    }
    const timer = setTimeout(() => resolve(true), ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        resolve(false)
      },
      { once: true },
    )
  })
}

export const mockProvider: AIProviderAdapter = {
  id: 'mock',
  label: 'Mock (démo)',

  isConfigured(): boolean {
    return true
  },

  async chat(request: ProviderChatRequest): Promise<ProviderChatResult> {
    const completed = await wait(MOCK_LATENCY_MS, request.signal)
    if (!completed) {
      return { text: '', providerId: 'mock', fromCloud: false, error: 'Requête annulée.' }
    }

    const lastUser =
      [...request.messages].reverse().find((m) => m.role === 'user')?.content
      ?? '(aucun message utilisateur)'
    const systemPrompt = request.messages.find((m) => m.role === 'system')?.content
    const agentLine = systemPrompt
      ? (systemPrompt.split('\n')[0] ?? '').trim()
      : 'Aucun agent actif'

    const text = [
      '[FormAI — mode démo]',
      `Agent : ${agentLine}`,
      '',
      `Vous avez demandé : « ${lastUser} »`,
      '',
      'Ceci est une réponse simulée, générée localement sans appel réseau.',
    ].join('\n')

    return { text, providerId: 'mock', fromCloud: false }
  },
}
