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
import { buildPackGrounding } from './pack-grounding'
import { buildMemoryContext, getRelevantMemories } from './memory'
import { getProvider, resolveProviderSettings } from './providers'
import { streamLocalModelChat } from './providers/localmodel'
import { coordinateSources } from './source-coordination'
import type {
  AICitation,
  AIChatMessage,
  AIConversation,
  AssistantSource,
  ProviderChatResult,
  ProviderSettings,
} from './types'

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

/** Tour préparé : messages assemblés + réglages + métadonnées à persister. */
interface PreparedTurn {
  messages: AIChatMessage[]
  settings: ProviderSettings
  memoryUsed: string[]
  citations: AICitation[]
  /** Sources structurées issues du grounding génératif (seeds + pack). */
  sources: AssistantSource[]
  agentId: string
}

/**
 * Prépare un tour : persiste le message utilisateur, construit le prompt système
 * (agent + mémoire + RAG), ajoute le grounding Knowledge pour un provider
 * génératif, et assemble messages + réglages. Partagé par les chemins non-stream
 * et streaming. `undefined` si la conversation n'existe pas.
 */
async function prepareTurn(
  conversationId: string,
  trimmed: string,
  options: SendMessageOptions,
): Promise<PreparedTurn | undefined> {
  const conversation = await getConversation(conversationId)
  if (!conversation) return undefined
  const agentId = conversation.agentId

  await appendMessage(conversationId, { role: 'user', content: trimmed, ts: Date.now() })

  const { prompt, memoryUsed, citations } = await buildSystemPrompt(agentId, trimmed, {
    memoryEnabled: options.memoryEnabled ?? true,
    ragEnabled: options.ragEnabled ?? false,
  })

  const fresh = await getConversation(conversationId)
  const history: AIChatMessage[] = (fresh?.messages ?? [])
    .slice(-HISTORY_WINDOW)
    .map((m) => ({ role: m.role, content: m.content }))

  const settings = resolveProviderSettings()
  const agent = getAgent(agentId)
  if (agent.temperature !== undefined) settings.temperature = agent.temperature

  // Grounding pour un provider GÉNÉRATIF (modèle local ou cloud) : on injecte
  // (1) la fiche Knowledge seeds pertinente (#11/#12) puis (2) les meilleurs
  // extraits `clean` du pack PDF (#18) — pour que le modèle vif cite aussi les
  // documents (document + page). Le provider 'local' (extractif) garde sa propre
  // chaîne pont Knowledge → RAG pack. Jamais bloquant.
  const grounding: AIChatMessage[] = []
  const sources: AssistantSource[] = []
  if (settings.providerId !== 'local' && settings.providerId !== 'mock') {
    try {
      const g = await buildKnowledgeGrounding(trimmed)
      if (g) {
        grounding.push({ role: 'system', content: g.block })
        sources.push({ kind: 'seed', label: g.term, slug: g.slug, toVerify: g.toVerify })
      }
    } catch {
      // base seeds indisponible : on continue (jamais bloquant).
    }
    try {
      const p = await buildPackGrounding(trimmed)
      if (p) {
        grounding.push({ role: 'system', content: p.block })
        const gate: 'clean' | 'review' = p.usedReview ? 'review' : 'clean'
        for (const cit of p.citations) {
          sources.push({
            kind: 'pack',
            label: cit.document || 'Document Forma',
            ...(cit.document ? { document: cit.document } : {}),
            ...(cit.page !== undefined ? { page: cit.page } : {}),
            gate,
            toVerify: p.warn,
          })
        }
      }
    } catch {
      // pack indisponible : on continue sans contexte pack (jamais bloquant).
    }
  }

  return {
    messages: [{ role: 'system', content: prompt }, ...grounding, ...history],
    settings,
    memoryUsed,
    citations,
    // Brutes ici ; la coordination (dédup + ranking + plafond) est appliquée à
    // la persistance (`persistAssistant`), commune aux chemins génératif/extractif.
    sources,
    agentId,
  }
}

/** Persiste le message assistant et renvoie le résultat d'envoi. */
async function persistAssistant(
  conversationId: string,
  result: ProviderChatResult,
  prep: PreparedTurn,
): Promise<SendMessageResult | undefined> {
  // Sources : celles renvoyées par le provider extractif (local) priment ;
  // sinon celles du grounding génératif (seeds + pack) calculées en amont.
  // Coordination inter-sources (#23) : dédup + ranking + plafond, déterministe.
  const sources = coordinateSources(
    result.sources && result.sources.length > 0 ? result.sources : prep.sources,
  )
  const updated = await appendMessage(conversationId, {
    role: 'assistant',
    content: result.text !== '' ? result.text : `⚠ ${result.error ?? 'Réponse vide.'}`,
    ts: Date.now(),
    agentId: prep.agentId,
    providerId: result.providerId,
    ...(prep.citations.length > 0 ? { citations: prep.citations } : {}),
    ...(sources.length > 0 ? { sources } : {}),
    ...(prep.memoryUsed.length > 0 ? { memoryUsed: prep.memoryUsed } : {}),
    ...(result.error !== undefined ? { error: result.error } : {}),
  })
  if (!updated) return undefined
  return { conversation: updated, error: result.error }
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
  const prep = await prepareTurn(conversationId, trimmed, options)
  if (!prep) return undefined

  const result = await getProvider(prep.settings.providerId).chat({
    messages: prep.messages,
    settings: prep.settings,
    signal: options.signal,
  })
  return persistAssistant(conversationId, result, prep)
}

export interface StreamMessageOptions extends SendMessageOptions {
  /** Reçoit le texte ACCUMULÉ à chaque fragment (pour l'affichage progressif). */
  onChunk?: (accumulated: string) => void
}

/**
 * Variante STREAMING de `sendFormAIMessage` (Sprint #17). Pour le provider
 * `localmodel`, streame la réponse via SSE (`onChunk` reçoit le texte cumulé) ;
 * pour les autres providers, délivre le texte complet en une fois via `onChunk`
 * (chemin unique pour l'UI). Persiste la réponse finale (ou partielle si
 * interrompue). Ne throw jamais.
 */
export async function sendFormAIMessageStream(
  conversationId: string,
  userText: string,
  options: StreamMessageOptions = {},
): Promise<SendMessageResult | undefined> {
  const trimmed = userText.trim()
  if (trimmed === '') return undefined
  const prep = await prepareTurn(conversationId, trimmed, options)
  if (!prep) return undefined

  let result: ProviderChatResult
  if (prep.settings.providerId === 'localmodel') {
    let acc = ''
    result = await streamLocalModelChat(
      { messages: prep.messages, settings: prep.settings, signal: options.signal },
      (delta) => {
        acc += delta
        options.onChunk?.(acc)
      },
    )
  } else {
    result = await getProvider(prep.settings.providerId).chat({
      messages: prep.messages,
      settings: prep.settings,
      signal: options.signal,
    })
    if (result.text !== '') options.onChunk?.(result.text)
  }
  return persistAssistant(conversationId, result, prep)
}
