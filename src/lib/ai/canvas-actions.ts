/**
 * FormAI Canvas Actions — actions contextuelles sur une page / un document.
 *
 * Trois actions locales-first :
 *   1. « Expliquer cette page »  → explanation via provider actif
 *   2. « Résumer le contenu »    → synthèse via provider actif
 *   3. « Créer une tâche »       → réutilise taskFromNote + createTask (confirmation obligatoire côté UI)
 *
 * Local-first : aucune action n'exige le cloud. Quand aucun provider cloud
 * n'est configuré, on retombe sur le provider `local` (extractif, honnête —
 * il n'invente jamais). Les builders de prompt sont PURS (testables) ; la
 * lecture Dexie et l'appel provider vivent dans `runCanvasAction`.
 *
 * Aucune écriture canvas : on lit les pages, on ne les modifie pas.
 */
import { db } from '../../db'
import { normalizePage } from '../../types'
import { getProvider, resolveProviderSettings } from '../../services/ai/providers'
import { taskFromNote, type TaskSuggestion } from '../study-generators'
import { todayISO } from '../../services/tasks'
import {
  DEFAULT_CONTEXT_BUDGET,
  extractDocumentContext,
  extractPageContext,
  truncateContext,
  type PageContext,
} from './canvas-context'
import type { Page } from '../../types'
import type { ProviderChatResult } from '../../services/ai/types'

export type CanvasActionKind = 'explain' | 'summarize'

/** Note de prudence affichée pour toute sortie IA (jamais d'avis normatif final). */
export const AI_DISCLAIMER =
  'Analyse générée à partir du texte de cette page. '
  + 'À vérifier ; ne remplace pas une source officielle ni un avis professionnel.'

/** Consigne anti-hallucination commune injectée dans chaque prompt système. */
const GROUNDING_RULES =
  "Appuie-toi UNIQUEMENT sur le texte fourni ci-dessous. N'invente aucune donnée, "
  + "aucun chiffre, aucune référence normative (article, code, norme). Si une "
  + "information manque, dis-le clairement plutôt que de la deviner. Réponds en français."

// ─── Builders de prompt (purs) ────────────────────────────────────────────────

export interface BuiltPrompt {
  system: string
  user: string
}

/**
 * Construit le prompt d'explication d'un contenu. `title` situe la page ;
 * `context` est le texte déjà extrait (et idéalement tronqué).
 */
export function buildExplainPrompt(title: string, context: string): BuiltPrompt {
  const safeTitle = title.trim() !== '' ? title.trim() : 'Document sans titre'
  return {
    system:
      "Tu es FormAI, l'assistant de Forma (architecture, design, construction). "
      + "Tu expliques le contenu d'une page à un étudiant : de quoi il s'agit, les "
      + 'idées principales, les termes importants, dans un style clair et structuré. '
      + GROUNDING_RULES,
    user:
      `Explique le contenu de la page « ${safeTitle} ».\n\n`
      + `Contenu de la page :\n"""\n${context}\n"""`,
  }
}

/** Construit le prompt de résumé d'un contenu. */
export function buildSummarizePrompt(title: string, context: string): BuiltPrompt {
  const safeTitle = title.trim() !== '' ? title.trim() : 'Document sans titre'
  return {
    system:
      "Tu es FormAI, l'assistant de Forma. Tu produis un résumé fidèle et concis "
      + "du contenu fourni : 3 à 6 points clés, sans détail superflu. "
      + GROUNDING_RULES,
    user:
      `Résume le contenu de la page « ${safeTitle} » en points clés.\n\n`
      + `Contenu de la page :\n"""\n${context}\n"""`,
  }
}

export function buildPrompt(
  kind: CanvasActionKind,
  title: string,
  context: string,
): BuiltPrompt {
  return kind === 'explain'
    ? buildExplainPrompt(title, context)
    : buildSummarizePrompt(title, context)
}

// ─── Messages d'état vide / honnêteté locale ──────────────────────────────────

/** Message honnête quand la page n'a aucun texte exploitable. */
export const EMPTY_PAGE_MESSAGE =
  "Cette page ne contient pas de texte exploitable (dessin, image ou page vide). "
  + 'Ajoutez du texte, un document, un tableau ou un PDF pour que je puisse l’analyser.'

/** Note ajoutée quand seul l'OCR de l'encre a fourni du texte. */
export const INK_ONLY_NOTE =
  '(Texte reconnu depuis l’écriture manuscrite — la reconnaissance peut comporter des erreurs.)'

// ─── Résultat d'une action ────────────────────────────────────────────────────

export interface CanvasActionResult {
  /** Texte produit (explication / résumé), déjà prêt à afficher. */
  text: string
  /** Provider ayant produit la réponse. */
  providerId: ProviderChatResult['providerId']
  /** true si la réponse vient d'un service distant. */
  fromCloud: boolean
  /** true si la page était vide (aucun appel provider effectué). */
  empty: boolean
  /** Note de confiance optionnelle (ex. OCR manuscrit). */
  note?: string
  /** Erreur non bloquante (ex. échec cloud → fallback). */
  error?: string
}

// ─── Lecture Dexie (lecture seule — aucune écriture canvas) ───────────────────

/** Lit une page normalisée depuis Dexie (lecture seule). */
export async function readPage(pageId: string): Promise<Page | undefined> {
  const raw = await db.pages.get(pageId)
  return raw ? normalizePage(raw) : undefined
}

/** Lit toutes les pages d'un carnet, normalisées et ordonnées (lecture seule). */
export async function readNotebookPages(notebookId: string): Promise<Page[]> {
  const pages = await db.pages.where('notebookId').equals(notebookId).toArray()
  return pages.map(normalizePage).sort((a, b) => a.order - b.order)
}

// ─── Orchestration d'une action ───────────────────────────────────────────────

export interface RunCanvasActionInput {
  kind: CanvasActionKind
  title: string
  /** Contexte déjà extrait (page unique ou document complet). */
  context: PageContext
  signal?: AbortSignal
  /** Budget de caractères du contexte (défaut DEFAULT_CONTEXT_BUDGET). */
  budget?: number
}

/**
 * Exécute une action (« expliquer » / « résumer ») sur un contexte déjà
 * extrait. Construit le prompt, appelle le provider actif (cloud si configuré,
 * sinon local honnête), et n'écrit jamais sur le canvas. Ne throw jamais.
 */
export async function runCanvasAction(
  input: RunCanvasActionInput,
): Promise<CanvasActionResult> {
  const settings = resolveProviderSettings()
  const provider = getProvider(settings.providerId)
  const fromCloudCapable =
    settings.providerId !== 'local'
    && settings.providerId !== 'mock'
    && settings.providerId !== 'ollama'

  if (input.context.isEmpty) {
    return {
      text: EMPTY_PAGE_MESSAGE,
      providerId: settings.providerId,
      fromCloud: false,
      empty: true,
    }
  }

  const budget = input.budget ?? DEFAULT_CONTEXT_BUDGET
  const context = truncateContext(input.context.text, budget)
  const { system, user } = buildPrompt(input.kind, input.title, context)

  const result = await provider.chat({
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    settings,
    ...(input.signal ? { signal: input.signal } : {}),
  })

  const note = input.context.inkOnly ? INK_ONLY_NOTE : undefined

  return {
    text: result.text !== '' ? result.text : (result.error ?? 'Réponse vide.'),
    providerId: result.providerId,
    fromCloud: fromCloudCapable && result.fromCloud,
    empty: false,
    ...(note ? { note } : {}),
    ...(result.error ? { error: result.error } : {}),
  }
}

/**
 * Action sur une page : lit la page, extrait son contexte, exécute l'action.
 * Retourne undefined si la page est introuvable.
 */
export async function runPageAction(
  pageId: string,
  kind: CanvasActionKind,
  title: string,
  opts: { signal?: AbortSignal; budget?: number } = {},
): Promise<CanvasActionResult | undefined> {
  const page = await readPage(pageId)
  if (!page) return undefined
  const context = extractPageContext(page)
  return runCanvasAction({
    kind,
    title,
    context,
    ...(opts.signal ? { signal: opts.signal } : {}),
    ...(opts.budget !== undefined ? { budget: opts.budget } : {}),
  })
}

/**
 * Action sur un document complet : lit toutes les pages d'un carnet, agrège
 * leur contexte, exécute l'action.
 */
export async function runDocumentAction(
  notebookId: string,
  kind: CanvasActionKind,
  title: string,
  opts: { signal?: AbortSignal; budget?: number } = {},
): Promise<CanvasActionResult> {
  const pages = await readNotebookPages(notebookId)
  const context = extractDocumentContext(pages)
  return runCanvasAction({
    kind,
    title,
    context,
    ...(opts.signal ? { signal: opts.signal } : {}),
    ...(opts.budget !== undefined ? { budget: opts.budget } : {}),
  })
}

// ─── Tâche depuis une note (réutilise study-generators + tasks) ───────────────

/**
 * Propose une tâche à partir d'un texte libre (note manuscrite, sélection,
 * extrait de page). Pure : déléguée à `taskFromNote`. Aucune création ici —
 * la création passe par `createTask` APRÈS confirmation utilisateur (UI).
 */
export function suggestTaskFromText(text: string, today = todayISO()): TaskSuggestion | null {
  return taskFromNote(text, today)
}
