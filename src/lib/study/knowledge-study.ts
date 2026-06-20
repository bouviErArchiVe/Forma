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
 * Le type `KnowledgeEntry` provient désormais de la Lane K
 * (`src/lib/knowledge`, schéma canonique). On lit la définition et la source
 * via les accesseurs `entryDefinition` / `entrySourceLabel` (pas de champ
 * `definition`/`source` legacy). La `confidence` est un libellé qualitatif
 * (`KnowledgeConfidence`), pas un nombre.
 */
import {
  entryDefinition,
  entrySourceLabel,
  KNOWLEDGE_CONFIDENCE_LABEL,
  type KnowledgeEntry,
} from '../knowledge'
import type { CreateFlashcardInput } from '../../services/flashcards'
import type { ExamQuestion } from '../../types'
import { createId } from '../id'

const TAG_KNOWLEDGE = 'knowledge'

/** Normalise un libellé de tag : trim, casse basse, espaces compactés. */
function normalizeTag(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Tags dérivés d'une fiche : `knowledge`, le domaine, la source et les
 * synonymes. Dédupliqués, non vides, ordre stable (déterministe).
 */
export function tagsFromKnowledge(entry: KnowledgeEntry): string[] {
  const sourceLabel = entrySourceLabel(entry)
  const raw = [
    TAG_KNOWLEDGE,
    entry.domain,
    sourceLabel ? `source:${sourceLabel}` : '',
    ...entry.synonyms,
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
  const back = entryDefinition(entry).trim()
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
  const answer = entryDefinition(entry).trim()
  if (question === '' || answer === '') return null
  const id = (opts.idFn ?? createId)()
  const sourceLabel = entrySourceLabel(entry).trim() || 'inconnue'
  const confidenceLabel = KNOWLEDGE_CONFIDENCE_LABEL[entry.confidence]
  const notes = `source: ${sourceLabel} · confiance: ${confidenceLabel}`
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
