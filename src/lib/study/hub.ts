/**
 * hub.ts — agrégation transversale du Study Hub (Study Sprint #5).
 *
 * Logique PURE et déterministe (aucune dépendance Dexie/React). Construit la
 * vue d'ensemble du tableau de bord d'étude — flashcards + examens + objectifs,
 * toutes matières confondues ou filtrées par une matière — en RÉUTILISANT les
 * agrégateurs purs existants (`aggregateExamStats`, `countFlashcards`,
 * `summarizeGoals`). Rien n'est recalculé en doublon : ce module ne fait
 * qu'orchestrer le filtrage par matière et dériver quelques compteurs
 * additionnels propres à la vue Hub (dues, examens du jour, passages récents).
 *
 * L'appelant (service / page) fournit le matériel brut non filtré ; ce module
 * applique le filtre matière et agrège. La résolution des noms de matières
 * reste côté UI.
 */
import type { AcademicGoal, ExamAttempt, Flashcard } from '../../types'
import { aggregateExamStats, type ExamStats } from './exam'
import { countFlashcards, type FlashcardCounts } from './drilldown'
import { summarizeGoals, todayISO, type GoalsSummary } from './goals'

/** Un jour en millisecondes (fenêtre « aujourd'hui » des passages d'examens). */
const DAY_MS = 86_400_000

/** Matériel d'étude brut (non filtré) servant à construire le Hub. */
export interface HubMaterial {
  flashcards: Flashcard[]
  attempts: ExamAttempt[]
  goals: AcademicGoal[]
}

/** Passage récent résumé pour la liste « activité récente » du Hub. */
export interface RecentAttempt {
  id: string
  examId: string
  subjectId?: string
  percent: number
  createdAt: number
}

/** Vue d'ensemble agrégée du Study Hub (globale ou filtrée par matière). */
export interface StudyHubView {
  /** Matière active (`null` = toutes matières confondues). */
  subjectId: string | null
  flashcards: FlashcardCounts
  exams: ExamStats
  goals: GoalsSummary
  /** Flashcards dues maintenant (miroir de `flashcards.due`, pratique en surface). */
  dueCount: number
  /** Passages d'examens effectués dans les dernières 24 h. */
  examsToday: number
  /** Derniers passages, du plus récent au plus ancien (tronqué à `recentLimit`). */
  recentAttempts: RecentAttempt[]
}

export interface BuildHubOptions {
  /** Matière à isoler (`null`/absent = toutes). */
  subjectId?: string | null
  /** Horodatage de référence (testabilité). */
  now?: number
  /** Jour local `YYYY-MM-DD` (testabilité des échéances d'objectifs). */
  today?: string
  /** Nombre maximum de passages récents listés (défaut 5). */
  recentLimit?: number
}

/** Restreint un élément à la matière voulue (ou tout si `subjectId` est null). */
function inSubject<T extends { subjectId?: string }>(
  item: T,
  subjectId: string | null,
): boolean {
  return subjectId === null || item.subjectId === subjectId
}

/**
 * Construit la vue d'ensemble du Study Hub à partir du matériel brut, en
 * filtrant éventuellement par matière puis en déléguant l'agrégation aux
 * modules purs voisins. `now`/`today` injectables pour la testabilité. PURE.
 */
export function buildStudyHub(
  material: HubMaterial,
  opts: BuildHubOptions = {},
): StudyHubView {
  const subjectId = opts.subjectId ?? null
  const now = opts.now ?? Date.now()
  const today = opts.today ?? todayISO()
  const recentLimit = Math.max(1, opts.recentLimit ?? 5)

  const flashcards = material.flashcards.filter((c) => inSubject(c, subjectId))
  const attempts = material.attempts.filter((a) => inSubject(a, subjectId))
  const goals = material.goals.filter((g) => inSubject(g, subjectId))

  const flashcardCounts = countFlashcards(flashcards, now)
  const examsToday = attempts.filter((a) => now - a.createdAt <= DAY_MS).length

  const recentAttempts: RecentAttempt[] = [...attempts]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, recentLimit)
    .map((a) => ({
      id: a.id,
      examId: a.examId,
      ...(a.subjectId ? { subjectId: a.subjectId } : {}),
      percent: a.percent,
      createdAt: a.createdAt,
    }))

  return {
    subjectId,
    flashcards: flashcardCounts,
    exams: aggregateExamStats(attempts),
    goals: summarizeGoals(goals, today),
    dueCount: flashcardCounts.due,
    examsToday,
    recentAttempts,
  }
}

/** Matière sélectionnable dans le filtre du Hub (id + nom résolu). */
export interface HubSubject {
  id: string
  name: string
}

/**
 * Dérive la liste des matières exploitables (celles ayant au moins un élément
 * de matériel) à partir du matériel brut et d'une table id→nom. Triée par nom.
 * Les matières absentes de `names` sont ignorées (matière supprimée / inconnue).
 * PURE.
 */
export function hubSubjects(
  material: HubMaterial,
  names: Record<string, string>,
): HubSubject[] {
  const used = new Set<string>()
  for (const c of material.flashcards) if (c.subjectId) used.add(c.subjectId)
  for (const a of material.attempts) if (a.subjectId) used.add(a.subjectId)
  for (const g of material.goals) if (g.subjectId) used.add(g.subjectId)

  return [...used]
    .filter((id) => names[id] !== undefined)
    .map((id) => ({ id, name: names[id]! }))
    .sort((a, b) => a.name.localeCompare(b.name))
}
