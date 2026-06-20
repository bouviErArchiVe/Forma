/**
 * knowledge-study.ts — passerelle Knowledge → Study (Sprint #6, Lane C).
 *
 * Helpers PURS et déterministes pour fabriquer du matériel d'étude
 * (flashcard, question d'examen) à partir d'une fiche Knowledge. Aucune
 * dépendance Dexie/React : la persistance se fait via les services existants
 * (services/flashcards.ts → createFlashcard).
 *
 * Contrat de type Knowledge (read-only)
 * -------------------------------------
 * La fiche Knowledge est la propriété de la Lane K (`src/lib/knowledge/*`,
 * mergée avant cette lane). Pour rester dans le périmètre autorisé de la
 * Lane C (interdit d'éditer `src/lib/knowledge/*`) et garder `tsc` propre tant
 * que la Lane K n'est pas mergée, on redéfinit ici le **contrat minimal**
 * read-only de `KnowledgeEntry` tel que documenté dans FORMA_PARALLEL_SPRINTS
 * (Sprint #6) : terme, domaine, définition, **source + confidence
 * obligatoires**. Une fois `src/lib/knowledge` disponible sur `main`, ce type
 * local pourra être remplacé par un `import type` direct sans changer la
 * logique ci-dessous (structurellement compatible).
 */
import type { CreateFlashcardInput } from '../../services/flashcards'
import type { ExamQuestion } from '../../types'
import { createId } from '../id'

/**
 * Contrat read-only minimal d'une fiche Knowledge (cf. Lane K).
 * Champs obligatoires conformes au cahier des charges : `term`, `domain`,
 * `definition`, `source`, `confidence`.
 */
export interface KnowledgeEntry {
  /** Terme / entrée (recto naturel d'une flashcard). */
  term: string
  /** Domaine / catégorie (ex. « Structure »). */
  domain: string
  /** Définition (verso naturel d'une flashcard). */
  definition: string
  /** Provenance de l'information (provider, glossaire local, etc.). */
  source: string
  /** Niveau de confiance 0..1 (grounding, anti-hallucination). */
  confidence: number
  /** Synonymes éventuels (utilisés comme tags additionnels). */
  synonyms?: string[]
  /** Exemple d'usage éventuel. */
  example?: string
}

const TAG_KNOWLEDGE = 'knowledge'

/** Normalise un libellé de tag : trim, casse basse, espaces compactés. */
function normalizeTag(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Arrondit une confidence dans [0,1] (tolère les entrées hors bornes). */
function clampConfidence(c: number): number {
  if (!Number.isFinite(c)) return 0
  return Math.min(1, Math.max(0, c))
}

/**
 * Tags dérivés d'une fiche : `knowledge`, le domaine, la source et les
 * synonymes. Dédupliqués, non vides, ordre stable (déterministe).
 */
export function tagsFromKnowledge(entry: KnowledgeEntry): string[] {
  const raw = [
    TAG_KNOWLEDGE,
    entry.domain,
    entry.source ? `source:${entry.source}` : '',
    ...(entry.synonyms ?? []),
  ]
  const seen = new Set<string>()
  const out: string[] = []
  for (const t of raw) {
    const n = normalizeTag(t)
    if (n === '' || seen.has(n)) continue
    seen.add(n)
    out.push(n)
  }
  return out
}

/**
 * Construit l'entrée de création de flashcard à partir d'une fiche Knowledge.
 * recto = terme, verso = définition, tags = domaine/source/synonymes.
 * PURE : renvoie l'input prêt pour `createFlashcard` (services/flashcards.ts).
 * `subjectId` optionnel lie la carte à une matière. Renvoie `null` si la fiche
 * n'a pas de terme + définition exploitables (pas de carte vide).
 */
export function flashcardFromKnowledge(
  entry: KnowledgeEntry,
  opts: { subjectId?: string } = {},
): CreateFlashcardInput | null {
  const front = entry.term.trim()
  const back = entry.definition.trim()
  if (front === '' || back === '') return null
  return {
    front,
    back,
    tags: tagsFromKnowledge(entry),
    ...(opts.subjectId ? { subjectId: opts.subjectId } : {}),
  }
}

/**
 * Construit une question d'examen « réponse courte » à partir d'une fiche :
 * énoncé = terme, réponse attendue = définition. La provenance Knowledge et
 * la confidence sont portées dans des notes pour la traçabilité (anti-
 * hallucination). PURE. Renvoie `null` si terme/définition manquants.
 */
export function examQuestionFromKnowledge(
  entry: KnowledgeEntry,
  opts: { points?: number; idFn?: () => string } = {},
): (ExamQuestion & { notes: string }) | null {
  const question = entry.term.trim()
  const answer = entry.definition.trim()
  if (question === '' || answer === '') return null
  const id = (opts.idFn ?? createId)()
  const confidence = clampConfidence(entry.confidence)
  const notes = `source: ${entry.source.trim() || 'inconnue'} · confiance: ${confidence.toFixed(2)}`
  return {
    id,
    type: 'short',
    question,
    answer,
    points: opts.points ?? 1,
    // Une question issue d'une fiche s'apparente à une flashcard (terme→déf).
    source: 'flashcard',
    notes,
  }
}
