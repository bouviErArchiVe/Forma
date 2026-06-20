/**
 * FormAI Knowledge Actions — actions FormAI ANCRÉES sur une (ou deux) fiche(s)
 * de connaissance (`KnowledgeEntry`).
 *
 * Objectif (Lane D — Knowledge→FormAI) : permettre à FormAI de travailler à
 * partir d'une entrée de la base de connaissance plutôt que d'une page de
 * canvas, en conservant TOUTES les garanties anti-hallucination :
 *
 *   • Ancrage STRICT : la réponse s'appuie « uniquement à partir de la/les
 *     fiche(s) fournie(s) ». Aucun fait, chiffre, exemple ou référence absent
 *     des fiches ne doit apparaître. Si l'information manque, FormAI le dit.
 *   • Source + confiance TOUJOURS visibles : chaque fiche injectée porte sa
 *     `source` et son niveau de `confidence` (libellé humain), et la sortie est
 *     accompagnée d'un disclaimer rappelant la provenance et la fiabilité.
 *   • Local-first : aucun de ces builders n'exige le cloud ni de clé API. Sans
 *     provider cloud configuré, le provider local honnête répond (extractif).
 *   • Aucune écriture : lecture seule. Les builders sont PURS (testables) ;
 *     l'appel provider vit dans `runKnowledgeAction`.
 *
 * Le module `src/lib/knowledge` est importé en LECTURE SEULE (type
 * `KnowledgeEntry` + libellés de confiance). Il n'est jamais modifié.
 *
 * Actions :
 *   • expliquer        → explication pédagogique d'UNE fiche.
 *   • comparer         → comparaison de DEUX fiches (similitudes / différences).
 *   • résumer          → synthèse courte d'UNE fiche.
 *   • quiz-from-entry  → questions de révision tirées d'UNE fiche.
 */
import {
  entryDefinition,
  entrySourceLabel,
  KNOWLEDGE_CONFIDENCE_LABEL,
  type KnowledgeEntry,
} from '../knowledge'
import { getProvider, resolveProviderSettings } from '../../services/ai/providers'
import type { ProviderChatResult } from '../../services/ai/types'

/** Genre d'action FormAI ancrée sur une fiche de connaissance. */
export type KnowledgeActionKind =
  | 'explain'
  | 'compare'
  | 'summarize'
  | 'quiz'

/** Actions qui exigent EXACTEMENT deux fiches (sinon une seule). */
export const TWO_ENTRY_ACTIONS: readonly KnowledgeActionKind[] = ['compare'] as const

/** true si l'action requiert deux fiches (comparaison). */
export function requiresTwoEntries(kind: KnowledgeActionKind): boolean {
  return TWO_ENTRY_ACTIONS.includes(kind)
}

/**
 * Disclaimer affiché pour toute sortie FormAI ancrée sur des fiches.
 * Rappelle la nature extractive (réponse fondée uniquement sur les fiches) et
 * la nécessité de vérifier selon le niveau de confiance des fiches.
 */
export const KNOWLEDGE_AI_DISCLAIMER =
  'Réponse générée uniquement à partir de la/les fiche(s) fournie(s) (source et '
  + 'niveau de confiance indiqués ci-dessus). Aucune information n’a été ajoutée '
  + 'depuis une autre source. À vérifier selon le niveau de confiance ; ne '
  + 'remplace pas une source officielle ni un avis professionnel.'

/**
 * Garde anti-hallucination commune injectée dans chaque prompt système. Le
 * libellé « uniquement à partir de la/les fiche(s) fournie(s) » est central :
 * c'est le contrat d'ancrage de cette lane.
 */
const GROUNDING_RULES =
  'Réponds UNIQUEMENT à partir de la/les fiche(s) fournie(s) ci-dessous. '
  + 'N’ajoute AUCUNE information, définition, chiffre, exemple ni référence '
  + 'normative (article, code, norme) qui ne figure pas explicitement dans ces '
  + 'fiches. Si une information demandée est absente des fiches, dis-le '
  + 'clairement (« cette information n’est pas dans la fiche ») plutôt que de la '
  + 'deviner ou de la compléter avec des connaissances externes. Cite toujours '
  + 'le terme de la fiche dont provient ce que tu dis. Réponds en français.'

// ─── Builders de prompt (purs) ────────────────────────────────────────────────

export interface BuiltKnowledgePrompt {
  system: string
  user: string
}

/** Libellé humain du niveau de confiance d'une fiche. */
export function confidenceLabel(entry: KnowledgeEntry): string {
  return KNOWLEDGE_CONFIDENCE_LABEL[entry.confidence]
}

/**
 * Rend une fiche en bloc texte délimité et SOURCÉ : terme, domaine, définition,
 * et — toujours — `source` + `confidence` (libellé humain). C'est ce bloc qui
 * garantit que la provenance et la fiabilité accompagnent systématiquement le
 * contenu injecté dans le prompt.
 */
export function renderEntryBlock(entry: KnowledgeEntry, index?: number): string {
  const heading = index !== undefined ? `Fiche ${index} — « ${entry.term} »` : `Fiche — « ${entry.term} »`
  const lines = [
    `${heading} (domaine : ${entry.domain})`,
    `Définition : ${entryDefinition(entry)}`,
    `Source : ${entrySourceLabel(entry)}`,
    `Niveau de confiance : ${confidenceLabel(entry)}`,
  ]
  if (entry.tags && entry.tags.length > 0) {
    lines.push(`Étiquettes : ${entry.tags.join(', ')}`)
  }
  return `"""\n${lines.join('\n')}\n"""`
}

/**
 * Construit le prompt d'EXPLICATION pédagogique d'UNE fiche. La sortie
 * explicite : (1) de quoi il s'agit, (2) les points clés, (3) les termes
 * importants — strictement à partir de la fiche.
 */
export function buildExplainEntryPrompt(entry: KnowledgeEntry): BuiltKnowledgePrompt {
  return {
    system:
      "Tu es FormAI, l'assistant de Forma (architecture, design, construction). "
      + 'Tu expliques à un étudiant le contenu d’UNE fiche de connaissance, de façon '
      + 'pédagogique et claire : (1) en une phrase, de quoi il s’agit ; (2) les idées '
      + 'principales sous forme de points ; (3) les notions ou termes importants '
      + 'présents dans la fiche. Reste concis. '
      + GROUNDING_RULES,
    user:
      `Explique la fiche suivante « ${entry.term} », uniquement à partir de son contenu.\n\n`
      + renderEntryBlock(entry),
  }
}

/**
 * Construit le prompt de COMPARAISON de DEUX fiches : similitudes et
 * différences, strictement à partir des deux fiches fournies. Aucune fiche
 * tierce ni connaissance externe.
 */
export function buildCompareEntriesPrompt(
  a: KnowledgeEntry,
  b: KnowledgeEntry,
): BuiltKnowledgePrompt {
  return {
    system:
      "Tu es FormAI, l'assistant de Forma. Tu COMPARES deux fiches de connaissance "
      + '(« Fiche 1 » et « Fiche 2 ») : dégage d’abord ce qu’elles ont en commun, puis '
      + 'leurs différences, en t’appuyant exclusivement sur leur contenu. Structure ta '
      + 'réponse en deux parties (Similitudes / Différences). Ne compare que ce qui est '
      + 'présent dans les fiches ; si un aspect n’est documenté que dans une seule fiche, '
      + 'signale-le plutôt que de l’inférer pour l’autre. '
      + GROUNDING_RULES,
    user:
      `Compare ces deux fiches « ${a.term} » et « ${b.term} », uniquement à partir de leur contenu.\n\n`
      + `${renderEntryBlock(a, 1)}\n\n${renderEntryBlock(b, 2)}`,
  }
}

/**
 * Construit le prompt de RÉSUMÉ court d'UNE fiche : 2 à 4 points clés fidèles,
 * sans détail superflu ni ajout.
 */
export function buildSummarizeEntryPrompt(entry: KnowledgeEntry): BuiltKnowledgePrompt {
  return {
    system:
      "Tu es FormAI, l'assistant de Forma. Tu produis un résumé fidèle et concis "
      + 'd’UNE fiche de connaissance : 2 à 4 points clés, formulés simplement, sans '
      + 'détail superflu ni répétition, et sans rien ajouter qui ne figure pas dans la '
      + 'fiche. '
      + GROUNDING_RULES,
    user:
      `Résume la fiche « ${entry.term} » en points clés, uniquement à partir de son contenu.\n\n`
      + renderEntryBlock(entry),
  }
}

/**
 * Construit le prompt de QUIZ tiré d'UNE fiche : quelques questions de révision
 * dont les réponses sont entièrement contenues dans la fiche. Aucune question
 * dont la réponse n'est pas dans la fiche.
 */
export function buildQuizFromEntryPrompt(entry: KnowledgeEntry): BuiltKnowledgePrompt {
  return {
    system:
      "Tu es FormAI, l'assistant de Forma. Tu génères un court quiz de révision (3 à 5 "
      + 'questions) à partir d’UNE fiche de connaissance, pour aider un étudiant à se '
      + 'tester. Chaque question DOIT avoir sa réponse entièrement contenue dans la '
      + 'fiche ; fournis la réponse juste après chaque question (format « Q : … / R : … »). '
      + 'Ne pose AUCUNE question dont la réponse n’est pas dans la fiche, et n’invente '
      + 'aucun fait. '
      + GROUNDING_RULES,
    user:
      `Génère un quiz de révision à partir de la fiche « ${entry.term} », `
      + 'uniquement à partir de son contenu.\n\n'
      + renderEntryBlock(entry),
  }
}

/**
 * Route vers le builder adapté.
 *
 * - `compare` exige DEUX fiches : `entries` doit en contenir au moins deux ;
 *   sinon une erreur explicite est levée (l'UI doit garantir la sélection de
 *   deux fiches avant d'appeler cette action).
 * - Les autres actions opèrent sur la PREMIÈRE fiche fournie.
 *
 * Pur (aucune I/O). Lève une erreur si la liste de fiches est vide, ou si
 * `compare` reçoit moins de deux fiches.
 */
export function buildKnowledgePrompt(
  kind: KnowledgeActionKind,
  entries: readonly KnowledgeEntry[],
): BuiltKnowledgePrompt {
  if (entries.length === 0) {
    throw new Error('buildKnowledgePrompt : au moins une fiche est requise.')
  }
  if (kind === 'compare') {
    if (entries.length < 2) {
      throw new Error('L’action « comparer » requiert exactement deux fiches.')
    }
    return buildCompareEntriesPrompt(entries[0], entries[1])
  }
  const entry = entries[0]
  switch (kind) {
    case 'explain':
      return buildExplainEntryPrompt(entry)
    case 'summarize':
      return buildSummarizeEntryPrompt(entry)
    case 'quiz':
      return buildQuizFromEntryPrompt(entry)
  }
}

// ─── Résultat d'une action ────────────────────────────────────────────────────

export interface KnowledgeActionResult {
  /** Texte produit, prêt à afficher. */
  text: string
  /** Provider ayant produit la réponse. */
  providerId: ProviderChatResult['providerId']
  /** true si la réponse vient d'un service distant. */
  fromCloud: boolean
  /** Fiches utilisées (pour ré-afficher source + confiance dans l'UI). */
  entries: KnowledgeEntry[]
  /** Erreur non bloquante (ex. échec cloud → fallback local). */
  error?: string
}

// ─── Orchestration d'une action (lecture seule, ne throw jamais en runtime) ───

export interface RunKnowledgeActionInput {
  kind: KnowledgeActionKind
  /** Fiche(s) à traiter. `compare` en attend deux ; les autres en utilisent une. */
  entries: readonly KnowledgeEntry[]
  signal?: AbortSignal
}

/**
 * Exécute une action FormAI ancrée sur une/des fiche(s) : construit le prompt
 * (sourcé), appelle le provider actif (cloud si configuré, sinon local
 * honnête), et n'écrit jamais. Retourne une erreur portée dans le résultat
 * plutôt que de throw lorsque l'entrée d'orchestration est invalide.
 */
export async function runKnowledgeAction(
  input: RunKnowledgeActionInput,
): Promise<KnowledgeActionResult> {
  const settings = resolveProviderSettings()
  const fromCloudCapable =
    settings.providerId !== 'local'
    && settings.providerId !== 'mock'
    && settings.providerId !== 'ollama'

  const usedEntries: KnowledgeEntry[] = input.kind === 'compare'
    ? input.entries.slice(0, 2)
    : input.entries.slice(0, 1)

  // Garde d'orchestration : on renvoie une erreur portée plutôt que de throw.
  if (input.entries.length === 0) {
    return {
      text: 'Aucune fiche fournie : impossible de générer une réponse.',
      providerId: settings.providerId,
      fromCloud: false,
      entries: [],
      error: 'no-entry',
    }
  }
  if (requiresTwoEntries(input.kind) && input.entries.length < 2) {
    return {
      text: 'L’action « comparer » nécessite deux fiches. Sélectionnez une seconde fiche.',
      providerId: settings.providerId,
      fromCloud: false,
      entries: usedEntries,
      error: 'needs-two-entries',
    }
  }

  const provider = getProvider(settings.providerId)
  const { system, user } = buildKnowledgePrompt(input.kind, input.entries)

  const result = await provider.chat({
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    settings,
    ...(input.signal ? { signal: input.signal } : {}),
  })

  return {
    text: result.text !== '' ? result.text : (result.error ?? 'Réponse vide.'),
    providerId: result.providerId,
    fromCloud: fromCloudCapable && result.fromCloud,
    entries: usedEntries,
    ...(result.error ? { error: result.error } : {}),
  }
}
