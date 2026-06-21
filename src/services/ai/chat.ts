/**
 * FormAI — orchestration d'un tour de chat.
 *
 * Assemble : agent spécialisé (prompt système) + mémoire locale pertinente
 * + contexte documentaire (RAG, optionnel) + historique de conversation,
 * puis appelle le provider actif et persiste les deux messages.
 *
 * Le prompt système n'est jamais persisté : il est reconstruit à chaque tour.
 */
import { buildRagContext } from '../../lib/rag/knowledge-base'
import { getAgent } from './agents'
import { appendMessage, getConversation } from './conversations'
import { buildKnowledgeGrounding } from './knowledge-grounding'
import { buildMemoryContext, getRelevantMemories } from './memory'
import { getProvider, resolveProviderSettings } from './providers'
import type { AICitation, AIChatMessage, AIConversation } from './types'

/** Nombre de messages d'historique injectés dans le contexte. */
const HISTORY_WINDOW = 20

export interface SendMessageOptions {
  /** Injecter la mémoire locale pertinente (défaut true). */
  memoryEnabled?: boolean
  /** Injecter le contexte documentaire RAG (défaut false). */
  ragEnabled?: boolean
  signal?: AbortSignal
}

export interface SendMessageResult {
  conversation: AIConversation
  /** Erreur non bloquante éventuelle (ex. échec cloud → message d'erreur). */
  error?: string
}

/**
 * Construit le prompt système complet : agent + mémoire + documents.
 * Exporté pour les tests.
 */
export async function buildSystemPrompt(
  agentId: string,
  userText: string,
  opts: { memoryEnabled: boolean; ragEnabled: boolean },
): Promise<{ prompt: string; memoryUsed: string[]; citations: AICitation[] }> {
  const agent = getAgent(agentId)
  let prompt = agent.systemPrompt
  let memoryUsed: string[] = []
  let citations: AICitation[] = []

  if (opts.memoryEnabled) {
    const [memBlock, memEntries] = await Promise.all([
      buildMemoryContext(userText),
      getRelevantMemories(userText),
    ])
    if (memBlock !== '') {
      prompt += `\n\n${memBlock}`
      memoryUsed = memEntries
    }
  }

  if (opts.ragEnabled) {
    const { context, citations: ragCitations } = await buildRagContext(userText)
    if (context !== '') {
      prompt += `\n\n${context}`
      citations = ragCitations
    }
  }

  return { prompt, memoryUsed, citations }
}

/**
 * Envoie un message utilisateur dans une conversation : persiste le message,
 * appelle le provider et persiste la réponse (avec citations / mémoire usée).
 * Ne throw jamais — les erreurs provider sont reflétées dans le message
 * assistant et dans `result.error`.
 */
export async function sendFormAIMessage(
  conversationId: string,
  userText: string,
  options: SendMessageOptions = {},
): Promise<SendMessageResult | undefined> {
  const trimmed = userText.trim()
  if (trimmed === '') return undefined
  const conversation = await getConversation(conversationId)
  if (!conversation) return undefined

  const memoryEnabled = options.memoryEnabled ?? true
  const ragEnabled = options.ragEnabled ?? false
  const agentId = conversation.agentId

  await appendMessage(conversationId, {
    role: 'user',
    content: trimmed,
    ts: Date.now(),
  })

  const { prompt, memoryUsed, citations } = await buildSystemPrompt(agentId, trimmed, {
    memoryEnabled,
    ragEnabled,
  })

  // Historique récent (le message user vient d'être persisté).
  const fresh = await getConversation(conversationId)
  const history: AIChatMessage[] = (fresh?.messages ?? [])
    .slice(-HISTORY_WINDOW)
    .map((m) => ({ role: m.role, content: m.content }))

  const settings = resolveProviderSettings()
  const agent = getAgent(agentId)
  if (agent.temperature !== undefined) settings.temperature = agent.temperature
  const provider = getProvider(settings.providerId)

  // Grounding Knowledge : pour un provider GÉNÉRATIF (modèle local ou cloud),
  // on injecte la fiche pertinente + consigne anti-hallucination en contexte.
  // Le provider 'local' (extractif) garde son propre pont Knowledge (#11).
  const grounding: AIChatMessage[] = []
  if (settings.providerId !== 'local' && settings.providerId !== 'mock') {
    try {
      const g = await buildKnowledgeGrounding(trimmed)
      if (g) grounding.push({ role: 'system', content: g.block })
    } catch {
      // base indisponible : on continue sans grounding (jamais bloquant).
    }
  }

  const result = await provider.chat({
    messages: [{ role: 'system', content: prompt }, ...grounding, ...history],
    settings,
    signal: options.signal,
  })

  const updated = await appendMessage(conversationId, {
    role: 'assistant',
    content: result.text !== '' ? result.text : `⚠ ${result.error ?? 'Réponse vide.'}`,
    ts: Date.now(),
    agentId,
    providerId: result.providerId,
    ...(citations.length > 0 ? { citations } : {}),
    ...(memoryUsed.length > 0 ? { memoryUsed } : {}),
    ...(result.error !== undefined ? { error: result.error } : {}),
  })

  if (!updated) return undefined
  return { conversation: updated, error: result.error }
}
