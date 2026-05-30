/** FormaAI — provider IA (API optionnelle opt-in + fallbacks 100 % locaux). */

import { AI_ACTIONS } from './constants'

type Env = Record<string, string | undefined>
const env = (import.meta.env ?? {}) as Env

export type AiProvider = 'api' | 'mock'

export function getAIApiKey(): string {
  return env.VITE_AI_API_KEY || env.VITE_OPENAI_API_KEY || ''
}

export function getAIApiUrl(): string {
  return env.VITE_AI_API_URL || ''
}

export function getAIProvider(): AiProvider {
  const forced = (env.VITE_AI_PROVIDER || '').toLowerCase()
  if (forced === 'mock') return 'mock'
  if (forced === 'api') return 'api'
  return getAIApiKey() ? 'api' : 'mock'
}

export function isAIChatConfigured(): boolean {
  return !!getAIApiKey()
}

export function getAIProviderLabel(): string {
  const p = (env.VITE_AI_PROVIDER || 'openai').toLowerCase()
  if (p === 'claude' || p === 'anthropic') return 'Claude'
  if (p === 'openai') return 'OpenAI'
  return p || 'OpenAI'
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
}

interface ApiCallArgs {
  system?: string
  prompt?: string
  messages?: { role: string; content: string }[]
  maxTokens?: number
}

class NoApiError extends Error {
  code = 'NO_API' as const
}

async function callAIApi({ system, prompt, messages, maxTokens = 800 }: ApiCallArgs): Promise<string> {
  const apiKey = getAIApiKey()
  if (!apiKey) throw new NoApiError('Aucune clé API détectée.')
  const apiUrl = getAIApiUrl() || 'https://api.openai.com/v1/chat/completions'
  const model = env.VITE_AI_MODEL || 'gpt-4o-mini'

  const chatMessages = messages?.length
    ? [{ role: 'system', content: system || 'Assistant Forma architecture.' }, ...messages]
    : [
        { role: 'system', content: system || 'Assistant Forma architecture.' },
        { role: 'user', content: prompt ?? '' },
      ]

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, max_tokens: maxTokens, messages: chatMessages }),
  })
  if (!res.ok) throw new Error(`IA API : ${res.status}`)
  const data = (await res.json()) as {
    text?: string
    content?: string
    message?: string
    choices?: { message?: { content?: string }; text?: string }[]
  }
  return (
    data.text ||
    data.content ||
    data.message ||
    data.choices?.[0]?.message?.content ||
    data.choices?.[0]?.text ||
    ''
  )
}

export interface ConnectionTestResult {
  ok: true
  provider: string
  preview: string
}

export async function testAIConnection(): Promise<ConnectionTestResult> {
  if (!getAIApiKey()) {
    throw new NoApiError(
      'Aucune clé API détectée. Ajoutez VITE_AI_API_KEY dans .env.local puis relancez le serveur.',
    )
  }
  try {
    const out = await callAIApi({
      system: 'Test de connexion Forma.',
      prompt: 'Réponds uniquement par le mot OK.',
      maxTokens: 12,
    })
    if (!out?.trim()) throw new Error('Réponse vide du fournisseur.')
    return { ok: true, provider: getAIProviderLabel(), preview: out.trim().slice(0, 80) }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('401') || msg.includes('403')) {
      throw new Error('Clé API invalide ou refusée. Vérifiez la clé et les droits du compte.')
    }
    if (err instanceof NoApiError) throw err
    throw new Error(msg || 'Connexion impossible.')
  }
}

export async function runAIChat(history: ChatMessage[]): Promise<string> {
  const msgs = (history || [])
    .filter((m) => m.text?.trim())
    .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text.trim() }))
  if (!msgs.length) throw new Error('Message requis')
  if (!isAIChatConfigured()) {
    throw new NoApiError('Connecte une clé API pour activer le chat IA.')
  }
  const out = await callAIApi({
    system:
      'Tu es FormaAI, assistant de discussion pour étudiants en architecture. Réponds en français, de façon claire et utile.',
    messages: msgs,
    maxTokens: 1200,
  })
  if (out?.trim()) return out.trim()
  throw new Error('Réponse vide')
}

// ─── Fallbacks locaux (sans réseau) ────────────────────────────

function splitSentences(text: string): string[] {
  return String(text ?? '')
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
}

function localSummarize(text: string): string {
  const sentences = splitSentences(text)
  const take = sentences.slice(0, Math.min(3, Math.ceil(sentences.length / 3)))
  const bullets = sentences.slice(0, 5).map((s) => `• ${s.trim()}`)
  return `**Résumé**\n\n${take.join(' ')}\n\n**Points clés**\n${bullets.join('\n')}`
}

function localSpellcheck(text: string): string {
  const fixes: [RegExp, string][] = [
    [/\bapartement\b/gi, 'appartement'],
    [/\bbcp\b/gi, 'beaucoup'],
    [/\btt\b/gi, 'tout'],
    [/\bdeveloppement\b/gi, 'développement'],
    [/\bamenagement\b/gi, 'aménagement'],
    [/\barchitecure\b/gi, 'architecture'],
    [/\beclairage\b/gi, 'éclairage'],
    [/\bmateriaux\b/gi, 'matériaux'],
  ]
  let out = text
  const changes: string[] = []
  for (const [re, rep] of fixes) {
    if (re.test(out)) {
      changes.push(`${re.source} → ${rep}`)
      out = out.replace(re, rep)
    }
  }
  if (!changes.length) return `${text}\n\n— Aucune correction évidente détectée (mode local).`
  return `${out}\n\n— Corrections : ${changes.join(', ')}`
}

function localReformulate(text: string): string {
  const t = text.trim()
  return `${t.charAt(0).toUpperCase()}${t.slice(1).replace(/\s+/g, ' ')}\n\n(Formulation clarifiée — mode local. Connectez une API IA pour une reformulation avancée.)`
}

function localTechnicalNotes(text: string): string {
  return `## Notes techniques\n\n**Contexte**\n${text.slice(0, 300)}${text.length > 300 ? '…' : ''}\n\n**Points à vérifier**\n• Matériaux et performances\n• Conformité normative (CNB, NECB)\n• Détails constructifs\n• Cotes et tolérances`
}

function localTableHelp(text: string): string {
  return `**Aide tableau FormaTab**\n\nDonnées reçues (${text.split('\n').length} lignes).\n\n• Vérifier l'alignement des colonnes\n• Utiliser des en-têtes clairs\n• Formater les unités (m, m², kN)\n• Ajouter une ligne de totaux si pertinent`
}

function localDocHelp(text: string): string {
  return `**Aide document FormaDoc**\n\n• Structure : introduction → développement → conclusion\n• Ajouter des titres H2/H3\n• Insérer des visuels (plans, schémas)\n• Relire l'orthographe\n\nExtrait analysé : ${text.slice(0, 200)}…`
}

function localPresentHelp(text: string): string {
  return `**Aide présentation FormaPresent**\n\n• Slide titre : projet + auteur\n• 1 idée par slide\n• Visuels > texte\n• Notes présentateur pour chaque slide\n• Conclure par les enjeux clés\n\nContenu : ${text.slice(0, 150)}…`
}

function localClassify(text: string): string {
  const lower = text.toLowerCase()
  const tags: string[] = []
  if (/escalier|marche|giron|blondel/.test(lower)) tags.push('escaliers', 'circulation')
  if (/mur|cloison|coupe.?feu|rf/.test(lower)) tags.push('murs', 'feu', 'structure')
  if (/gypse|platre|plaque/.test(lower)) tags.push('cloisons sèches', 'gypse')
  if (/cnb|norme|code/.test(lower)) tags.push('normes', 'réglementation')
  if (/plan|coupe|facade|elevation/.test(lower)) tags.push('plans', 'architecture')
  if (/beton|acier|bois|structure/.test(lower)) tags.push('structure')
  if (!tags.length) tags.push('général', 'architecture')
  return `**Tags suggérés** : ${tags.map((t) => `#${t}`).join(' ')}\n\n**Dossier suggéré** : ${tags[0]}`
}

const LOCAL_HANDLERS: Record<string, (text: string) => string> = {
  summarize: localSummarize,
  spellcheck: localSpellcheck,
  reformulate: localReformulate,
  technical: localTechnicalNotes,
  tableHelp: localTableHelp,
  docHelp: localDocHelp,
  presentHelp: localPresentHelp,
  classify: localClassify,
}

const SYSTEM_PROMPTS: Record<string, string> = {
  summarize: 'Tu es un assistant architecture. Résume le texte en français, concis, avec des puces.',
  spellcheck: "Corrige l'orthographe et la grammaire en français. Retourne le texte corrigé uniquement.",
  reformulate: 'Reformule le texte en français, style professionnel architecture, plus clair.',
  technical: "Génère des notes techniques structurées en français pour un projet d'architecture.",
  tableHelp: 'Analyse ce tableau et suggère des améliorations (structure, unités, clarté).',
  docHelp: 'Améliore ce document : structure, clarté, suggestions concrètes.',
  presentHelp: 'Suggère une structure de présentation jury pour ce contenu.',
  classify: 'Propose des tags et un classement (dossier, matière) pour ce contenu architecture.',
}

/** Exécute une action IA : tente l'API si configurée, sinon fallback local garanti. */
export async function runAIAction(actionId: string, text: string): Promise<string> {
  const input = String(text ?? '').trim()
  if (!input) throw new Error('Texte requis')
  if (!(actionId in AI_ACTIONS)) throw new Error('Action inconnue')

  if (getAIProvider() === 'api') {
    try {
      const out = await callAIApi({ system: SYSTEM_PROMPTS[actionId], prompt: input })
      if (out?.trim()) return out.trim()
    } catch {
      /* fallback local */
    }
  }
  return LOCAL_HANDLERS[actionId](input)
}

export function isNoApiError(err: unknown): boolean {
  return err instanceof NoApiError || (err instanceof Error && err.message === 'NO_API')
}
