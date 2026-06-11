/**
 * ai-service.ts — abstraction multi-fournisseur pour les appels IA.
 *
 * Sécurité :
 * - Aucune donnée envoyée sans action explicite de l'utilisateur
 * - La clé API n'est jamais loguée
 * - Si cloudEnabled = false ou provider = 'local' → fallback local pur
 * - Toutes les erreurs sont catchées et retournées en string, jamais throw
 *
 * Providers supportés :
 * - local    : ai-local.ts (sans réseau)
 * - openai   : API OpenAI / compatible (gpt-4o-mini par défaut)
 * - anthropic: API Anthropic (claude-haiku-4-5 par défaut)
 * - ollama   : serveur Ollama local (openai-compatible /v1/chat/completions)
 */

import { answerQuestion, extractKeywords, reformulate, summarizeText } from './ai-local'
import type { AIConfig } from '../stores/aiStore'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type AIMode =
  | 'chat'
  | 'summarize'
  | 'shorter'
  | 'formal'
  | 'keywords'
  | 'outline'
  | 'explain'
  | 'reformulate'
  | 'question'
  | 'cnb'      // Code national du bâtiment
  | 'ccq'      // Code de construction du Québec
  | 'rmu'      // Réglementation municipale / urbanisme

/** Result returned by all service functions — never throws. */
export interface AIResult {
  text: string
  fromCloud: boolean
  error?: string
}

// ─── System prompts ───────────────────────────────────────────────────────────

export const SYSTEM_PROMPTS: Record<string, string> = {
  default: `Tu es Forma IA, un assistant intégré à l'application de notes Forma.
Tu aides l'utilisateur à synthétiser, reformuler et comprendre ses notes.
Réponds toujours en français, de façon concise et utile.
N'invente jamais de faits — base-toi uniquement sur le contexte fourni.`,

  architecture: `Tu es un assistant spécialisé en architecture et construction.
Tu aides à interpréter des notes de projet, des plans, des cahiers des charges.
Réponds en français, cite les articles de référence quand tu les mentionnes.
Rappelle toujours que tes réponses ne remplacent pas l'avis d'un professionnel certifié.`,

  cours: `Tu es un assistant pédagogique pour étudiants.
Tu synthétises des notes de cours, génères des questions de révision, expliques des concepts.
Adapte le niveau de détail au contexte fourni. Réponds en français.`,

  reformulation: `Tu es un assistant de reformulation de texte professionnel.
Reformule le texte fourni selon la consigne (plus court, plus formel, etc.).
Conserve le sens exact. Ne rajoute pas d'informations. Réponds uniquement avec le texte reformulé.`,

  explain: `Tu es Forma IA, un assistant pédagogique intégré à l'application Forma.
Explique le contenu fourni de façon claire et accessible, comme à quelqu'un qui découvre le sujet.
Détaille les concepts clés, donne des exemples si utile, et structure ta réponse.
Réponds en français.`,

  cnb: `Tu es un assistant spécialisé dans le Code national du bâtiment du Canada (CNB).
Aide à localiser et interpréter des exigences réglementaires.
Cite toujours le numéro d'article (ex: CNB 9.8.3.1) quand tu fais référence au code.
Rappelle que seul le document officiel fait foi et que les codes évoluent.
Réponds en français.`,

  ccq: `Tu es un assistant spécialisé dans le Code de construction du Québec (CCQ).
Aide à localiser et interpréter les exigences du CCQ et ses amendements provinciaux.
Cite les articles avec leur numéro (ex: CCQ art. 3.2.1.1.).
Rappelle que la version officielle publiée par la CNESST fait foi. Réponds en français.`,

  rmu: `Tu es un assistant spécialisé en réglementation municipale et urbanisme au Québec.
Aide à comprendre les règlements de zonage, PIIA, plans d'urbanisme.
Précise toujours que les règlements varient par municipalité et qu'il faut consulter le document officiel.
Réponds en français.`,
}

// ─── Preset prompts ───────────────────────────────────────────────────────────

export interface PresetPrompt {
  id: string
  label: string
  icon: string
  mode: AIMode
  systemKey?: string
  buildUserPrompt: (context: string, extra?: string) => string
}

export const PRESET_PROMPTS: PresetPrompt[] = [
  {
    id: 'summarize',
    label: 'Résumer',
    icon: '📋',
    mode: 'summarize',
    buildUserPrompt: (ctx) => `Résume ce texte en 3-5 phrases clés :\n\n${ctx}`,
  },
  {
    id: 'shorter',
    label: 'Raccourcir',
    icon: '✂️',
    mode: 'shorter',
    systemKey: 'reformulation',
    buildUserPrompt: (ctx) => `Raccourcis ce texte tout en gardant l'essentiel :\n\n${ctx}`,
  },
  {
    id: 'formal',
    label: 'Ton formel',
    icon: '🎩',
    mode: 'formal',
    systemKey: 'reformulation',
    buildUserPrompt: (ctx) => `Reformule ce texte avec un ton professionnel et formel :\n\n${ctx}`,
  },
  {
    id: 'keywords',
    label: 'Mots-clés',
    icon: '🔑',
    mode: 'keywords',
    buildUserPrompt: (ctx) => `Extrais les 8 mots-clés les plus importants de ce texte (liste simple) :\n\n${ctx}`,
  },
  {
    id: 'outline',
    label: 'Plan à puces',
    icon: '📌',
    mode: 'outline',
    buildUserPrompt: (ctx) => `Transforme ce texte en plan structuré à puces :\n\n${ctx}`,
  },
  {
    id: 'explain',
    label: 'Expliquer',
    icon: '💡',
    mode: 'explain',
    systemKey: 'explain',
    buildUserPrompt: (ctx) => `Explique le contenu de cette page de façon claire et structurée :\n\n${ctx}`,
  },
  {
    id: 'reformulate',
    label: 'Reformuler',
    icon: '🔄',
    mode: 'reformulate',
    systemKey: 'reformulation',
    buildUserPrompt: (ctx) => `Reformule ce texte en gardant le même sens, avec des mots différents :\n\n${ctx}`,
  },
  {
    id: 'cnb',
    label: 'CNB',
    icon: '🏛️',
    mode: 'cnb',
    systemKey: 'cnb',
    buildUserPrompt: (ctx, q) => q
      ? `Contexte de mes notes :\n${ctx}\n\nQuestion CNB : ${q}`
      : `Mes notes de projet :\n${ctx}\n\nQuelles exigences du Code national du bâtiment sont potentiellement applicables ?`,
  },
  {
    id: 'ccq',
    label: 'CCQ',
    icon: '⚖️',
    mode: 'ccq',
    systemKey: 'ccq',
    buildUserPrompt: (ctx, q) => q
      ? `Contexte :\n${ctx}\n\nQuestion CCQ : ${q}`
      : `Mes notes :\n${ctx}\n\nQuelles dispositions du Code de construction du Québec sont applicables ?`,
  },
  {
    id: 'rmu',
    label: 'Urbanisme',
    icon: '🗺️',
    mode: 'rmu',
    systemKey: 'rmu',
    buildUserPrompt: (ctx, q) => q
      ? `Contexte :\n${ctx}\n\nQuestion réglementation : ${q}`
      : `Mes notes :\n${ctx}\n\nQuels aspects réglementaires et d'urbanisme dois-je vérifier ?`,
  },
]

// ─── Local fallback ───────────────────────────────────────────────────────────

function localFallback(messages: AIMessage[], mode: AIMode, context: string): AIResult {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content ?? ''

  switch (mode) {
    case 'summarize':
      return { text: summarizeText(context, 4), fromCloud: false }
    case 'shorter':
      return { text: reformulate(context, 'shorter'), fromCloud: false }
    case 'formal':
      return { text: reformulate(context, 'formal'), fromCloud: false }
    case 'keywords':
      return { text: `Mots-clés : ${extractKeywords(context).join(', ')}`, fromCloud: false }
    case 'outline': {
      const sentences = context.replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+/).filter((s) => s.length > 12)
      const bullets = sentences.slice(0, 8).map((s) => `• ${s}`).join('\n')
      return { text: bullets || '• (aucun contenu)', fromCloud: false }
    }
    case 'reformulate':
      return { text: reformulate(context, 'formal'), fromCloud: false }
    case 'explain':
      return {
        text: `[Mode local] Résumé du contenu :\n${summarizeText(context, 4)}\n\nPour une explication détaillée, configurez un fournisseur cloud dans Paramètres › IA.`,
        fromCloud: false,
      }
    case 'question':
    case 'chat':
      return { text: answerQuestion(context, lastUser), fromCloud: false }
    case 'cnb':
    case 'ccq':
    case 'rmu':
      return {
        text: `[Mode local] Je ne peux pas interroger les codes réglementaires sans connexion à un modèle IA. Configurez un fournisseur cloud dans Paramètres › IA.`,
        fromCloud: false,
      }
    default:
      return { text: answerQuestion(context, lastUser), fromCloud: false }
  }
}

// ─── OpenAI-compatible chat (OpenAI, Ollama) ──────────────────────────────────

async function callOpenAICompatible(
  messages: AIMessage[],
  config: AIConfig,
): Promise<string> {
  const endpoint = (config.endpoint || 'https://api.openai.com/v1').replace(/\/$/, '')
  const model = config.model || 'gpt-4o-mini'

  const res = await fetch(`${endpoint}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: config.maxTokens ?? 1024,
      temperature: config.temperature ?? 0.7,
    }),
    signal: AbortSignal.timeout(30_000),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`OpenAI API ${res.status}: ${body.slice(0, 200)}`)
  }

  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> }
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('Réponse vide du modèle')
  return text
}

// ─── Anthropic chat ────────────────────────────────────────────────────────────

async function callAnthropic(
  messages: AIMessage[],
  config: AIConfig,
): Promise<string> {
  const model = config.model || 'claude-haiku-4-5'

  // Separate system message from conversation
  const systemMsg = messages.find((m) => m.role === 'system')?.content ?? SYSTEM_PROMPTS.default
  const conversation = messages.filter((m) => m.role !== 'system')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      system: systemMsg,
      messages: conversation.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: config.maxTokens ?? 1024,
    }),
    signal: AbortSignal.timeout(30_000),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Anthropic API ${res.status}: ${body.slice(0, 200)}`)
  }

  const data = await res.json() as { content?: Array<{ type: string; text?: string }> }
  const text = data.content?.find((b) => b.type === 'text')?.text
  if (!text) throw new Error('Réponse vide du modèle')
  return text
}

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Send a chat request.
 * Never throws — always returns an AIResult with either text or error.
 *
 * @param messages  Conversation history (system + user + assistant)
 * @param config    AI configuration from aiStore
 * @param mode      Semantic mode (drives local fallback behavior)
 * @param context   Page/doc text for local fallback
 */
export async function aiChat(
  messages: AIMessage[],
  config: AIConfig,
  mode: AIMode = 'chat',
  context = '',
): Promise<AIResult> {
  // ── Security gate: never send without explicit user action ─────────────────
  // (This function is called only from onClick handlers, never automatically)

  const useCloud = config.cloudEnabled && config.provider !== 'local'

  if (!useCloud) {
    return localFallback(messages, mode, context)
  }

  try {
    let text: string
    if (config.provider === 'anthropic') {
      text = await callAnthropic(messages, config)
    } else {
      // openai + ollama both use OpenAI-compatible API
      text = await callOpenAICompatible(messages, config)
    }
    return { text, fromCloud: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    // Fallback to local on network/API error
    const fallback = localFallback(messages, mode, context)
    return {
      ...fallback,
      error: `Erreur cloud (${msg}) — réponse locale utilisée.`,
    }
  }
}

/**
 * Test the connection to the configured provider.
 * Returns { ok, latencyMs, error? }.
 */
export async function testAIConnection(config: AIConfig): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  if (config.provider === 'local') {
    return { ok: true, latencyMs: 0 }
  }

  const start = Date.now()
  try {
    const testMessages: AIMessage[] = [
      { role: 'user', content: 'Réponds uniquement "ok"' },
    ]
    const result = await aiChat(testMessages, { ...config, maxTokens: 8 }, 'chat', '')
    if (result.error) return { ok: false, latencyMs: Date.now() - start, error: result.error }
    return { ok: true, latencyMs: Date.now() - start }
  } catch (err) {
    return { ok: false, latencyMs: Date.now() - start, error: String(err) }
  }
}
