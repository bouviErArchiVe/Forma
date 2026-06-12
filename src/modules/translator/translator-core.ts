/**
 * translator-core — logique pure du module Traduction (testable sans React).
 *
 * Contenu : types d'état persisté, construction des messages IA par mode,
 * gestion de l'historique (ajout / limite 50 / favoris en tête).
 */
import type { AIChatMessage } from '../../services/ai/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export type TranslationLang = 'fr' | 'en'
export type TranslationMode = 'simple' | 'professionnel' | 'technique'

export interface TranslationEntry {
  src: string
  dst: string
  from: TranslationLang
  mode: string
  ts: number
  favorite?: boolean
}

export interface TranslatorState {
  v: 1
  history: TranslationEntry[]
}

export const HISTORY_LIMIT = 50

export const MODE_LABELS: Record<TranslationMode, string> = {
  simple: 'Simple',
  professionnel: 'Professionnel',
  technique: 'Technique',
}

// ─── État persisté ────────────────────────────────────────────────────────────

export function emptyTranslatorState(): TranslatorState {
  return { v: 1, history: [] }
}

/** Parse le JSON persisté — tolérant (retombe sur l'état vide si invalide). */
export function parseTranslatorState(json: string): TranslatorState {
  if (json.trim() === '') return emptyTranslatorState()
  try {
    const raw = JSON.parse(json) as unknown
    if (
      typeof raw === 'object'
      && raw !== null
      && Array.isArray((raw as { history?: unknown }).history)
    ) {
      const history = ((raw as { history: unknown[] }).history)
        .filter((e): e is TranslationEntry => {
          if (typeof e !== 'object' || e === null) return false
          const entry = e as Partial<TranslationEntry>
          return (
            typeof entry.src === 'string'
            && typeof entry.dst === 'string'
            && (entry.from === 'fr' || entry.from === 'en')
            && typeof entry.mode === 'string'
            && typeof entry.ts === 'number'
          )
        })
        .slice(0, HISTORY_LIMIT)
      return { v: 1, history }
    }
  } catch {
    // JSON corrompu → état vide
  }
  return emptyTranslatorState()
}

// ─── Prompts par mode ─────────────────────────────────────────────────────────

const MODE_INSTRUCTIONS: Record<TranslationMode, string> = {
  simple:
    'Utilise un registre courant, naturel et facile à lire. '
    + 'Privilégie des tournures simples et idiomatiques.',
  professionnel:
    'Utilise un registre soutenu et professionnel, adapté à une correspondance '
    + "d'affaires ou à un document officiel. Soigne la syntaxe et la précision du vocabulaire.",
  technique:
    "Utilise la terminologie technique exacte du domaine du bâtiment et de l'architecture. "
    + 'Préserve la terminologie du bâtiment (CLT, pare-vapeur, solive, chevêtre, contreventement…) : '
    + "si un terme technique n'a pas d'équivalent certain, conserve-le tel quel. "
    + 'Laisse les unités, cotes et valeurs numériques inchangées.',
}

function langName(lang: TranslationLang): string {
  return lang === 'fr' ? 'français' : 'anglais'
}

/**
 * Construit les messages (system + user) envoyés au provider IA pour traduire
 * `text` depuis `from` (fr→en ou en→fr) selon le mode choisi.
 */
export function buildTranslationMessages(
  text: string,
  from: TranslationLang,
  mode: TranslationMode,
): AIChatMessage[] {
  const to: TranslationLang = from === 'fr' ? 'en' : 'fr'
  const system =
    `Tu es un traducteur professionnel ${langName(from)} → ${langName(to)}. `
    + `Traduis fidèlement le texte fourni du ${langName(from)} vers le ${langName(to)}. `
    + `${MODE_INSTRUCTIONS[mode]} `
    + 'Réponds uniquement avec la traduction, sans commentaire ni guillemets.'
  return [
    { role: 'system', content: system },
    { role: 'user', content: text },
  ]
}

// ─── Historique (fonctions pures) ─────────────────────────────────────────────

/** Favoris en tête, puis tri par date décroissante dans chaque groupe. */
export function sortHistory(history: TranslationEntry[]): TranslationEntry[] {
  return [...history].sort((a, b) => {
    const favA = a.favorite ? 1 : 0
    const favB = b.favorite ? 1 : 0
    if (favA !== favB) return favB - favA
    return b.ts - a.ts
  })
}

/**
 * Ajoute une entrée en tête d'historique en respectant la limite de 50 :
 * au-delà, les entrées non favorites les plus anciennes sont évincées en
 * premier (les favoris ne sont sacrifiés qu'en dernier recours).
 */
export function addHistoryEntry(
  history: TranslationEntry[],
  entry: TranslationEntry,
): TranslationEntry[] {
  const next = [entry, ...history]
  while (next.length > HISTORY_LIMIT) {
    // Cherche la plus ancienne entrée non favorite (depuis la fin).
    let dropIndex = -1
    for (let i = next.length - 1; i > 0; i--) {
      if (!next[i].favorite) {
        dropIndex = i
        break
      }
    }
    // Tout est favori → on évince la plus ancienne tout court.
    next.splice(dropIndex === -1 ? next.length - 1 : dropIndex, 1)
  }
  return next
}

/** Bascule le favori de l'entrée au timestamp donné. */
export function toggleHistoryFavorite(
  history: TranslationEntry[],
  ts: number,
): TranslationEntry[] {
  return history.map((e) => (e.ts === ts ? { ...e, favorite: !e.favorite } : e))
}

/** Supprime l'entrée au timestamp donné. */
export function removeHistoryEntry(
  history: TranslationEntry[],
  ts: number,
): TranslationEntry[] {
  return history.filter((e) => e.ts !== ts)
}

// ─── Export FormaDoc ──────────────────────────────────────────────────────────

/** Échappe le texte pour insertion sûre dans du HTML. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Contenu HTML du FormaDoc créé depuis une traduction. */
export function buildFormaDocContent(entry: TranslationEntry): string {
  const to = entry.from === 'fr' ? 'en' : 'fr'
  return (
    '<h1>Traduction</h1>'
    + `<p><strong>Source (${entry.from.toUpperCase()})</strong> : ${escapeHtml(entry.src)}</p>`
    + `<p><strong>Traduction (${to.toUpperCase()})</strong> : ${escapeHtml(entry.dst)}</p>`
  )
}
