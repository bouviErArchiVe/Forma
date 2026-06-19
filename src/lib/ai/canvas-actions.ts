/**
 * FormAI Canvas Actions — actions contextuelles sur une page / un document.
 *
 * Actions locales-first :
 *   1. « Expliquer cette page »      → explanation via provider actif
 *   2. « Résumer le contenu »        → synthèse (page ou document) via provider actif
 *   3. « Expliquer la sélection »    → explication d'un extrait sélectionné (V2, préparé)
 *   4. « Créer une tâche »           → réutilise taskFromNote + createTask (confirmation obligatoire côté UI)
 *
 * Local-first : aucune action n'exige le cloud. Quand aucun provider cloud
 * n'est configuré, on retombe sur le provider `local` (extractif, honnête —
 * il n'invente jamais). Les builders de prompt sont PURS (testables) ; la
 * lecture Dexie et l'appel provider vivent dans `runCanvasAction`.
 *
 * Aucune écriture canvas : on lit les pages, on ne les modifie pas.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  CONTRAT « expliquer-sélection » (read-only) — à l'attention de Lane B
 * ─────────────────────────────────────────────────────────────────────────────
 *  Au moment de ce sprint, l'accesseur de sélection du canvas n'existe PAS
 *  encore sur `main`. Lane D ne l'importe donc PAS : elle accepte ici un
 *  paramètre `selectionText` (string optionnelle) et fournit un fallback propre
 *  quand aucune sélection n'est disponible.
 *
 *  Quand Lane B livrera son accesseur read-only de sélection, il devra exposer
 *  une fonction PURE/synchrone respectant ce contrat (signature indicative) :
 *
 *      // src/canvas/selection (Lane B) — read-only, aucun effet de bord
 *      export interface CanvasSelectionText {
 *        /** Texte concaténé des éléments sélectionnés (texte/blocs/cellules…). *\/
 *        text: string
 *        /** true si la sélection ne contient aucun texte exploitable. *\/
 *        isEmpty: boolean
 *      }
 *      export function getSelectionText(): CanvasSelectionText
 *
 *  Garanties attendues de l'accesseur Lane B :
 *   • read-only strict : NE modifie ni strokes/images/blocs/cotes/annotations/
 *     cartouches, ni l'état de sélection lui-même ;
 *   • synchrone et pur (pas d'I/O, pas d'await) ;
 *   • `text` déjà nettoyé (espaces normalisés) ; `isEmpty === (text.trim() === '')`.
 *
 *  Côté Lane D, la consommation se fera ultérieurement ainsi (NE PAS activer
 *  tant que l'accesseur n'est pas sur `main`) :
 *
 *      const sel = getSelectionText()            // Lane B, futur import
 *      runSelectionAction(pageId, title, {
 *        selectionText: sel.isEmpty ? undefined : sel.text,
 *      })
 *
 *  Tant que l'accesseur n'est pas branché, `runSelectionAction` appelé sans
 *  `selectionText` retombe proprement sur l'explication de la page entière
 *  (fallback documenté ci-dessous), sans jamais throw.
 * ─────────────────────────────────────────────────────────────────────────────
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
import {
  applyAgentToSystemPrompt,
  DEFAULT_PAGE_AGENT_ID,
  type PageAgentId,
} from './agents'
import type { Page } from '../../types'
import type { ProviderChatResult } from '../../services/ai/types'

export type CanvasActionKind =
  | 'explain'
  | 'summarize'
  | 'explain-selection'
  | 'reformulate'
  | 'translate'
  | 'outline'

/**
 * Langue cible pour l'action « traduire ». Local-first : ces libellés sont
 * passés tels quels dans le prompt (le provider local honnête ne traduit pas et
 * le dira). Liste volontairement courte et stable (testable).
 */
export type TranslateLanguage = 'en' | 'es' | 'de' | 'it' | 'fr'

/** Libellé humain (en français) d'une langue cible de traduction. */
export const TRANSLATE_LANGUAGE_LABELS: Record<TranslateLanguage, string> = {
  en: 'anglais',
  es: 'espagnol',
  de: 'allemand',
  it: 'italien',
  fr: 'français',
}

/** Langue cible par défaut de l'action « traduire ». */
export const DEFAULT_TRANSLATE_LANGUAGE: TranslateLanguage = 'en'

/** Résout le libellé humain d'une langue cible (repli : anglais). */
export function translateLanguageLabel(lang: TranslateLanguage | string): string {
  return TRANSLATE_LANGUAGE_LABELS[lang as TranslateLanguage] ?? TRANSLATE_LANGUAGE_LABELS.en
}

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

/** Libellé sûr d'un titre (repli si vide). */
function safeTitleOf(title: string): string {
  return title.trim() !== '' ? title.trim() : 'Document sans titre'
}

/** Enveloppe un contexte textuel dans un bloc délimité, libellé selon la portée. */
function contextBlock(context: string, label = 'Contenu de la page'): string {
  return `${label} :\n"""\n${context}\n"""`
}

/**
 * Construit le prompt d'explication d'un contenu. `title` situe la page ;
 * `context` est le texte déjà extrait (et idéalement tronqué). V2 : la
 * structure de sortie est explicite (de quoi il s'agit / idées clés / termes),
 * tout en restant strictement ancrée au texte fourni.
 */
export function buildExplainPrompt(title: string, context: string): BuiltPrompt {
  const safeTitle = safeTitleOf(title)
  return {
    system:
      "Tu es FormAI, l'assistant de Forma (architecture, design, construction). "
      + "Tu expliques à un étudiant le contenu d'une page de cours ou de projet. "
      + 'Structure ta réponse ainsi : (1) en une phrase, de quoi il s’agit ; '
      + '(2) les idées principales sous forme de points ; (3) les termes ou '
      + 'notions importants présents dans le texte, expliqués brièvement. '
      + 'Reste clair, pédagogique et concis. '
      + GROUNDING_RULES,
    user:
      `Explique le contenu de la page « ${safeTitle} ».\n\n`
      + contextBlock(context),
  }
}

/**
 * Construit le prompt d'explication d'un EXTRAIT sélectionné. À la différence
 * de `buildExplainPrompt`, l'analyse se concentre sur le passage choisi ;
 * `title` reste fourni pour situer l'extrait dans la page d'origine.
 */
export function buildExplainSelectionPrompt(title: string, selection: string): BuiltPrompt {
  const safeTitle = safeTitleOf(title)
  return {
    system:
      "Tu es FormAI, l'assistant de Forma (architecture, design, construction). "
      + "Tu expliques UNIQUEMENT l'extrait sélectionné par l'étudiant, délimité "
      + 'ci-dessous : ce qu’il signifie, pourquoi il est important, et les termes '
      + 'clés qu’il contient. Reste STRICTEMENT centré sur cet extrait : n’extrapole '
      + 'pas au reste de la page et n’ajoute aucune information absente de l’extrait. '
      + 'Si l’extrait est trop court ou ambigu pour être expliqué seul, dis-le '
      + 'clairement. Reste clair et bref. '
      + GROUNDING_RULES,
    user:
      `L'étudiant a sélectionné un extrait dans la page « ${safeTitle} ». `
      + 'Explique uniquement cet extrait, sans rien ajouter qui n’y figure pas.\n\n'
      + contextBlock(selection, 'Extrait sélectionné'),
  }
}

/**
 * Construit le prompt de résumé d'un contenu. V2 : `scope` adapte le libellé
 * (« page » vs « document ») et le format demandé (3 à 6 points clés fidèles).
 */
export function buildSummarizePrompt(
  title: string,
  context: string,
  scope: 'page' | 'document' = 'page',
): BuiltPrompt {
  const safeTitle = safeTitleOf(title)
  const noun = scope === 'document' ? 'document' : 'page'
  const label = scope === 'document' ? 'Contenu du document' : 'Contenu de la page'
  return {
    system:
      "Tu es FormAI, l'assistant de Forma. Tu produis un résumé fidèle et concis "
      + `du ${noun} fourni : 3 à 6 points clés, formulés simplement, sans détail `
      + 'superflu ni répétition. Conserve l’ordre logique du contenu. '
      + GROUNDING_RULES,
    user:
      `Résume le ${noun} « ${safeTitle} » en points clés.\n\n`
      + contextBlock(context, label),
  }
}

/**
 * Construit le prompt de REFORMULATION d'un contenu. Transformation (read-only,
 * aucune écriture) : on réécrit le texte fourni de façon plus claire et fluide
 * SANS en changer le sens, sans rien ajouter ni retirer d'information. `scope`
 * adapte le libellé (« page » / « document »).
 */
export function buildReformulatePrompt(
  title: string,
  context: string,
  scope: 'page' | 'document' = 'page',
): BuiltPrompt {
  const safeTitle = safeTitleOf(title)
  const noun = scope === 'document' ? 'document' : 'page'
  const label = scope === 'document' ? 'Contenu du document' : 'Contenu de la page'
  return {
    system:
      "Tu es FormAI, l'assistant de Forma. Tu REFORMULES le texte fourni pour le "
      + 'rendre plus clair, plus fluide et mieux structuré, SANS en modifier le sens '
      + 'ni le contenu. Tu n’ajoutes AUCUNE information, exemple, chiffre ou référence '
      + 'absente du texte, et tu n’en retires aucune information importante. Conserve la '
      + 'langue d’origine du texte et un niveau de détail équivalent. '
      + GROUNDING_RULES,
    user:
      `Reformule le ${noun} « ${safeTitle} » plus clairement, en gardant exactement le même sens.\n\n`
      + contextBlock(context, label),
  }
}

/**
 * Construit le prompt de TRADUCTION d'un contenu vers `language`. Transformation
 * stricte : on traduit UNIQUEMENT le texte fourni, sans rien ajouter ni
 * commenter. `scope` adapte le libellé. La consigne de langue de sortie REMPLACE
 * volontairement le « Réponds en français » des GROUNDING_RULES : la sortie doit
 * être dans la langue cible, l'ancrage anti-invention restant en vigueur.
 */
export function buildTranslatePrompt(
  title: string,
  context: string,
  language: TranslateLanguage | string = DEFAULT_TRANSLATE_LANGUAGE,
  scope: 'page' | 'document' = 'page',
): BuiltPrompt {
  const safeTitle = safeTitleOf(title)
  const noun = scope === 'document' ? 'document' : 'page'
  const label = scope === 'document' ? 'Contenu du document' : 'Contenu de la page'
  const langLabel = translateLanguageLabel(language)
  return {
    system:
      "Tu es FormAI, l'assistant de Forma. Tu TRADUIS fidèlement le texte fourni "
      + `vers ${langLabel}. Traduis UNIQUEMENT le texte fourni : n’ajoute aucune `
      + 'information, aucun commentaire, aucune note, aucune explication, et n’invente '
      + 'aucune donnée, chiffre ni référence absente du texte. Respecte le sens, le ton '
      + 'et la structure (titres, listes, paragraphes) du texte d’origine. Si un passage '
      + 'est ambigu ou intraduisible, conserve-le tel quel. '
      + `Rédige toute ta réponse en ${langLabel}.`,
    user:
      `Traduis le ${noun} « ${safeTitle} » vers ${langLabel}.\n\n`
      + contextBlock(context, label),
  }
}

/**
 * Construit le prompt de PLAN (« outline ») d'un contenu : extrait la structure
 * hiérarchique (titres / sous-points) du texte fourni, fidèlement et sans
 * invention. `scope` adapte le libellé (« page » / « document »).
 */
export function buildOutlinePrompt(
  title: string,
  context: string,
  scope: 'page' | 'document' = 'page',
): BuiltPrompt {
  const safeTitle = safeTitleOf(title)
  const noun = scope === 'document' ? 'document' : 'page'
  const label = scope === 'document' ? 'Contenu du document' : 'Contenu de la page'
  return {
    system:
      "Tu es FormAI, l'assistant de Forma. Tu produis le PLAN structuré du texte "
      + `fourni : dégage les grandes parties et leurs sous-points sous forme de liste `
      + 'hiérarchique (titres puis tirets), dans l’ordre du contenu. Reste fidèle au '
      + 'texte : n’invente aucune section, aucun titre ni aucun point qui n’y figure pas. '
      + 'Si le texte est trop court ou non structuré pour un plan, dis-le clairement '
      + 'plutôt que d’inventer une structure. Sois concis. '
      + GROUNDING_RULES,
    user:
      `Établis le plan structuré du ${noun} « ${safeTitle} ».\n\n`
      + contextBlock(context, label),
  }
}

/**
 * Route vers le builder adapté. `scope` affecte le résumé, la reformulation, la
 * traduction et le plan (libellé page/document). Pour `explain-selection`,
 * `context` est l'extrait sélectionné. `language` n'affecte que `translate`.
 *
 * `agentId` (optionnel, défaut `generic`) applique un PRESET d'agent spécialisé
 * (voir `agents.ts`) en préfixant le prompt système par la persona métier. Avec
 * `generic`, le prompt reste strictement identique au comportement historique.
 */
export function buildPrompt(
  kind: CanvasActionKind,
  title: string,
  context: string,
  scope: 'page' | 'document' = 'page',
  agentId: PageAgentId | string = DEFAULT_PAGE_AGENT_ID,
  language: TranslateLanguage | string = DEFAULT_TRANSLATE_LANGUAGE,
): BuiltPrompt {
  let built: BuiltPrompt
  switch (kind) {
    case 'explain':
      built = buildExplainPrompt(title, context)
      break
    case 'explain-selection':
      built = buildExplainSelectionPrompt(title, context)
      break
    case 'summarize':
      built = buildSummarizePrompt(title, context, scope)
      break
    case 'reformulate':
      built = buildReformulatePrompt(title, context, scope)
      break
    case 'translate':
      built = buildTranslatePrompt(title, context, language, scope)
      break
    case 'outline':
      built = buildOutlinePrompt(title, context, scope)
      break
  }
  return { ...built, system: applyAgentToSystemPrompt(built.system, agentId) }
}

// ─── Messages d'état vide / honnêteté locale ──────────────────────────────────

/** Message honnête quand la page n'a aucun texte exploitable. */
export const EMPTY_PAGE_MESSAGE =
  "Cette page ne contient pas de texte exploitable (dessin, image ou page vide). "
  + 'Ajoutez du texte, un document, un tableau ou un PDF pour que je puisse l’analyser.'

/** Note ajoutée quand seul l'OCR de l'encre a fourni du texte. */
export const INK_ONLY_NOTE =
  '(Texte reconnu depuis l’écriture manuscrite — la reconnaissance peut comporter des erreurs.)'

/**
 * Note ajoutée quand « expliquer la sélection » a été demandé mais qu'aucun
 * texte de sélection n'était disponible : on est retombé sur la page entière.
 */
export const SELECTION_FALLBACK_NOTE =
  'Aucune sélection de texte détectée — explication de la page entière à la place. '
  + 'Sélectionnez un passage pour une explication ciblée.'

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
  /** Portée (libellé page/document) pour résumé/reformulation/traduction/plan. */
  scope?: 'page' | 'document'
  /** Langue cible de la traduction. Sans effet hors `translate`. */
  language?: TranslateLanguage | string
  /** Note additionnelle à fusionner dans le résultat (ex. fallback sélection). */
  extraNote?: string
  /** Agent spécialisé appliqué au prompt système (défaut `generic`). */
  agentId?: PageAgentId | string
}

/** Fusionne deux notes optionnelles en une seule chaîne (séparateur espace). */
function mergeNotes(a: string | undefined, b: string | undefined): string | undefined {
  const parts = [a, b].filter((n): n is string => !!n && n.trim() !== '')
  return parts.length > 0 ? parts.join(' ') : undefined
}

/**
 * Exécute une action (« expliquer » / « résumer » / « expliquer-sélection »)
 * sur un contexte déjà extrait. Construit le prompt, appelle le provider actif
 * (cloud si configuré, sinon local honnête), et n'écrit jamais sur le canvas.
 * Ne throw jamais.
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
      ...(input.extraNote ? { note: input.extraNote } : {}),
    }
  }

  const budget = input.budget ?? DEFAULT_CONTEXT_BUDGET
  const context = truncateContext(input.context.text, budget)
  const { system, user } = buildPrompt(
    input.kind,
    input.title,
    context,
    input.scope ?? 'page',
    input.agentId ?? DEFAULT_PAGE_AGENT_ID,
    input.language ?? DEFAULT_TRANSLATE_LANGUAGE,
  )

  const result = await provider.chat({
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    settings,
    ...(input.signal ? { signal: input.signal } : {}),
  })

  const note = mergeNotes(
    input.context.inkOnly ? INK_ONLY_NOTE : undefined,
    input.extraNote,
  )

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
  opts: {
    signal?: AbortSignal
    budget?: number
    agentId?: PageAgentId | string
    language?: TranslateLanguage | string
  } = {},
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
    ...(opts.agentId ? { agentId: opts.agentId } : {}),
    ...(opts.language ? { language: opts.language } : {}),
  })
}

/**
 * Action sur un document complet : lit toutes les pages d'un carnet, agrège
 * leur contexte, exécute l'action. `scope: 'document'` est forcé pour adapter
 * le libellé des prompts de résumé.
 */
export async function runDocumentAction(
  notebookId: string,
  kind: CanvasActionKind,
  title: string,
  opts: {
    signal?: AbortSignal
    budget?: number
    agentId?: PageAgentId | string
    language?: TranslateLanguage | string
  } = {},
): Promise<CanvasActionResult> {
  const pages = await readNotebookPages(notebookId)
  const context = extractDocumentContext(pages)
  return runCanvasAction({
    kind,
    title,
    context,
    scope: 'document',
    ...(opts.signal ? { signal: opts.signal } : {}),
    ...(opts.budget !== undefined ? { budget: opts.budget } : {}),
    ...(opts.agentId ? { agentId: opts.agentId } : {}),
    ...(opts.language ? { language: opts.language } : {}),
  })
}

// ─── Expliquer la sélection (V2 — préparé, fallback page entière) ──────────────

export interface RunSelectionActionOptions {
  /**
   * Texte sélectionné sur le canvas. Optionnel : tant que l'accesseur de
   * sélection de Lane B n'est pas branché (voir contrat en tête de fichier),
   * laissez-le `undefined` — l'action retombe alors sur la page entière.
   * Une chaîne vide / blanche est traitée comme une absence de sélection.
   */
  selectionText?: string
  signal?: AbortSignal
  budget?: number
  /** Agent spécialisé appliqué au prompt système (défaut `generic`). */
  agentId?: PageAgentId | string
}

/**
 * « Expliquer la sélection » sur une page.
 *
 * - Si `selectionText` contient du texte exploitable : explique cet extrait
 *   (sans lire la page entière — pas d'accès Dexie nécessaire).
 * - Sinon (fallback propre) : lit la page et explique son contenu complet,
 *   en signalant via `note` (SELECTION_FALLBACK_NOTE) qu'aucune sélection
 *   n'était disponible. Retourne undefined seulement si la page est
 *   introuvable ET qu'aucune sélection n'était fournie.
 *
 * Lecture seule, ne throw jamais. NE consomme PAS l'accesseur de sélection de
 * Lane B (absent de `main` ce sprint) — voir le contrat documenté en tête.
 */
export async function runSelectionAction(
  pageId: string,
  title: string,
  opts: RunSelectionActionOptions = {},
): Promise<CanvasActionResult | undefined> {
  const selection = opts.selectionText?.trim() ?? ''

  // Chemin ciblé : on a une sélection → on l'explique directement.
  if (selection !== '') {
    const context: PageContext = {
      text: selection,
      segments: [{ source: 'text', text: selection }],
      isEmpty: false,
      charCount: selection.length,
      inkOnly: false,
    }
    return runCanvasAction({
      kind: 'explain-selection',
      title,
      context,
      ...(opts.signal ? { signal: opts.signal } : {}),
      ...(opts.budget !== undefined ? { budget: opts.budget } : {}),
      ...(opts.agentId ? { agentId: opts.agentId } : {}),
    })
  }

  // Fallback propre : aucune sélection → expliquer la page entière.
  const page = await readPage(pageId)
  if (!page) return undefined
  const context = extractPageContext(page)
  return runCanvasAction({
    kind: 'explain',
    title,
    context,
    extraNote: SELECTION_FALLBACK_NOTE,
    ...(opts.signal ? { signal: opts.signal } : {}),
    ...(opts.budget !== undefined ? { budget: opts.budget } : {}),
    ...(opts.agentId ? { agentId: opts.agentId } : {}),
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
