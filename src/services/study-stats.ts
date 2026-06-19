/**
 * Service statistiques d'étude — drilldown par matière (Study Sprint #4).
 *
 * Orchestre la lecture Dexie (examAttempts + flashcards + academicGoals filtrés
 * par matière) et délègue l'agrégation à la logique PURE
 * src/lib/study/drilldown.ts. Aucun calcul de stats ici : on réutilise les
 * agrégateurs purs (`subjectDrilldown`). Les matières exploitables sont les
 * notebooks de type 'subject' non supprimés.
 */
import { db } from '../db'
import { subjectDrilldown, type SubjectDrilldown } from '../lib/study/drilldown'
import {
  buildStudyHub,
  hubSubjects,
  type BuildHubOptions,
  type HubMaterial,
  type HubSubject,
  type StudyHubView,
} from '../lib/study/hub'
import { refreshAutoGoals } from './goals'

/** Matière sélectionnable dans le drilldown (id + nom résolu). */
export interface DrilldownSubject {
  id: string
  name: string
}

/**
 * Liste les matières (notebooks 'subject' non supprimés) qui possèdent au moins
 * un élément de matériel d'étude (passage d'examen, flashcard ou objectif).
 * Triées par nom. Évite de proposer des matières vides dans le sélecteur.
 */
export async function listDrilldownSubjects(): Promise<DrilldownSubject[]> {
  const [subjects, attempts, flashcards, goals] = await Promise.all([
    db.notebooks.filter((n) => n.type === 'subject' && !n.deletedAt).toArray(),
    db.examAttempts.toArray(),
    db.flashcards.toArray(),
    db.academicGoals.toArray(),
  ])
  const used = new Set<string>()
  for (const a of attempts) if (a.subjectId) used.add(a.subjectId)
  for (const c of flashcards) if (c.subjectId) used.add(c.subjectId)
  for (const g of goals) if (g.subjectId) used.add(g.subjectId)

  return subjects
    .filter((n) => used.has(n.id))
    .map((n) => ({ id: n.id, name: n.name }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Charge et agrège le matériel d'étude d'une matière (examens / flashcards /
 * objectifs). `now`/`today` injectables (testabilité). L'agrégation est pure.
 */
export async function loadSubjectDrilldown(
  subjectId: string,
  opts: { now?: number; today?: string } = {},
): Promise<SubjectDrilldown> {
  const [attempts, flashcards, goals] = await Promise.all([
    db.examAttempts.where('subjectId').equals(subjectId).toArray(),
    db.flashcards.where('subjectId').equals(subjectId).toArray(),
    db.academicGoals.where('subjectId').equals(subjectId).toArray(),
  ])
  return subjectDrilldown({ subjectId, attempts, flashcards, goals }, opts)
}

/** Résultat du chargement du Study Hub : vue agrégée + matières filtrables. */
export interface StudyHubData {
  view: StudyHubView
  subjects: HubSubject[]
}

/**
 * Charge le matériel d'étude complet (flashcards + passages + objectifs) en une
 * passe Dexie, resynchronise au préalable les objectifs `auto` depuis l'activité
 * réelle, puis délègue l'agrégation à la logique pure (`buildStudyHub`). Renvoie
 * aussi la liste des matières exploitables (résolues depuis les notebooks
 * 'subject' non supprimés) pour alimenter le filtre. `subjectId`/`now`/`today`
 * injectables. Aucun calcul de stats ici.
 */
export async function loadStudyHub(opts: BuildHubOptions = {}): Promise<StudyHubData> {
  // Met d'abord à jour les objectifs auto pour que les agrégats reflètent
  // la progression réelle (idempotent sans nouvelle activité).
  await refreshAutoGoals(opts.now)

  const [flashcards, attempts, goals, subjectNotebooks] = await Promise.all([
    db.flashcards.toArray(),
    db.examAttempts.toArray(),
    db.academicGoals.toArray(),
    db.notebooks.filter((n) => n.type === 'subject' && !n.deletedAt).toArray(),
  ])

  const material: HubMaterial = { flashcards, attempts, goals }
  const names = Object.fromEntries(subjectNotebooks.map((n) => [n.id, n.name]))

  return {
    view: buildStudyHub(material, opts),
    subjects: hubSubjects(material, names),
  }
}
