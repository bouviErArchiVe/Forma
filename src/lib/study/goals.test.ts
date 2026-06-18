/**
 * Tests logique pure objectifs : construction, bornes, patch, état dérivé,
 * agrégat. Aucune dépendance Dexie.
 */
import { describe, expect, it } from 'vitest'
import {
  EMPTY_GOALS_SUMMARY,
  adjustProgress,
  applyGoalPatch,
  buildGoal,
  goalView,
  progressFromActivity,
  summarizeGoals,
  syncedGoal,
  type GoalActivity,
} from './goals'
import type { AcademicGoal, ExamAttempt, Flashcard } from '../../types'

const ID = () => 'g1'

function attempt(p: Partial<ExamAttempt>): ExamAttempt {
  return {
    id: 'a',
    examId: 'e',
    answers: [],
    score: 0,
    total: 100,
    percent: 0,
    createdAt: 0,
    ...p,
  }
}

function card(p: Partial<Flashcard>): Flashcard {
  return {
    id: 'c',
    front: 'f',
    back: 'b',
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    dueDate: 0,
    createdAt: 0,
    updatedAt: 0,
    ...p,
  }
}

describe('buildGoal', () => {
  it('normalise titre, cible (≥1) et progression bornée', () => {
    const g = buildGoal(
      { title: '  Réviser  ', target: 5, progress: 2, unit: ' h ', createdAt: 100 },
      { idFn: ID },
    )
    expect(g.id).toBe('g1')
    expect(g.title).toBe('Réviser')
    expect(g.target).toBe(5)
    expect(g.progress).toBe(2)
    expect(g.unit).toBe('h')
    expect(g.completedAt).toBeUndefined()
    expect(g.createdAt).toBe(100)
    expect(g.updatedAt).toBe(100)
  })

  it('force target ≥ 1 et borne progress à target', () => {
    const g = buildGoal({ title: 'X', target: 0, progress: 99, createdAt: 1 })
    expect(g.target).toBe(1)
    expect(g.progress).toBe(1)
    expect(g.completedAt).toBe(1) // atteint d'emblée
  })

  it('omet les champs optionnels vides (pas de clé undefined persistée)', () => {
    const g = buildGoal({ title: 'X', target: 3, createdAt: 1 })
    expect('subjectId' in g).toBe(false)
    expect('unit' in g).toBe(false)
    expect('dueDate' in g).toBe(false)
    expect('completedAt' in g).toBe(false)
  })

  it('titre vide → fallback', () => {
    expect(buildGoal({ title: '   ', target: 2, createdAt: 1 }).title).toBe('Objectif')
  })
})

describe('applyGoalPatch', () => {
  const base = buildGoal(
    { title: 'A', target: 10, progress: 3, dueDate: '2026-07-01', createdAt: 1 },
    { idFn: ID },
  )

  it('met à jour la progression et rafraîchit updatedAt', () => {
    const next = applyGoalPatch(base, { progress: 7 }, 500)
    expect(next.progress).toBe(7)
    expect(next.updatedAt).toBe(500)
    expect(next.completedAt).toBeUndefined()
  })

  it('fige completedAt quand la cible est atteinte, l’efface si on redescend', () => {
    const done = applyGoalPatch(base, { progress: 10 }, 500)
    expect(done.completedAt).toBe(500)
    const reopened = applyGoalPatch(done, { progress: 4 }, 600)
    expect(reopened.completedAt).toBeUndefined()
  })

  it('conserve completedAt initial si déjà atteint', () => {
    const done = applyGoalPatch(base, { progress: 10 }, 500)
    const stillDone = applyGoalPatch(done, { title: 'B' }, 700)
    expect(stillDone.completedAt).toBe(500)
  })

  it('réduit la cible et re-borne la progression', () => {
    const next = applyGoalPatch(base, { target: 2 }, 500)
    expect(next.target).toBe(2)
    expect(next.progress).toBe(2) // 3 borné à 2
    expect(next.completedAt).toBe(500)
  })

  it('efface une échéance via dueDate vide', () => {
    const next = applyGoalPatch(base, { dueDate: '' }, 500)
    expect('dueDate' in next).toBe(false)
  })

  it('adjustProgress borne en bas à 0', () => {
    const next = adjustProgress(base, -10, 500)
    expect(next.progress).toBe(0)
  })
})

describe('goalView', () => {
  it('calcule le pourcentage borné 0-100', () => {
    const g = buildGoal({ title: 'A', target: 4, progress: 1, createdAt: 1 })
    expect(goalView(g, '2026-01-01').percent).toBe(25)
  })

  it('détecte l’état atteint', () => {
    const g = buildGoal({ title: 'A', target: 4, progress: 4, createdAt: 1 })
    const v = goalView(g, '2026-01-01')
    expect(v.done).toBe(true)
    expect(v.status).toBe('done')
    expect(v.percent).toBe(100)
  })

  it('détecte le retard (échéance passée et non atteint)', () => {
    const g = buildGoal({ title: 'A', target: 4, progress: 1, dueDate: '2026-06-10', createdAt: 1 })
    const v = goalView(g, '2026-06-17')
    expect(v.overdue).toBe(true)
    expect(v.status).toBe('overdue')
    expect(v.daysLeft).toBe(-7)
  })

  it('atteint mais échéance passée → done, pas overdue', () => {
    const g = buildGoal({ title: 'A', target: 4, progress: 4, dueDate: '2026-06-10', createdAt: 1 })
    const v = goalView(g, '2026-06-17')
    expect(v.done).toBe(true)
    expect(v.overdue).toBe(false)
  })

  it('daysLeft null sans échéance, positif dans le futur', () => {
    const noDue = buildGoal({ title: 'A', target: 4, progress: 1, createdAt: 1 })
    expect(goalView(noDue, '2026-06-17').daysLeft).toBeNull()
    const future = buildGoal({ title: 'A', target: 4, progress: 1, dueDate: '2026-06-20', createdAt: 1 })
    expect(goalView(future, '2026-06-17').daysLeft).toBe(3)
  })
})

describe('summarizeGoals', () => {
  it('agrège total / atteints / en retard / actifs + avancement moyen', () => {
    const today = '2026-06-17'
    const goals: AcademicGoal[] = [
      buildGoal({ title: 'done', target: 2, progress: 2, createdAt: 1 }),
      buildGoal({ title: 'late', target: 4, progress: 1, dueDate: '2026-06-01', createdAt: 1 }),
      buildGoal({ title: 'active', target: 4, progress: 2, createdAt: 1 }),
    ]
    const s = summarizeGoals(goals, today)
    expect(s.total).toBe(3)
    expect(s.done).toBe(1)
    expect(s.overdue).toBe(1)
    expect(s.active).toBe(1)
    // 100 + 25 + 50 = 175 / 3 ≈ 58
    expect(s.averagePercent).toBe(58)
  })

  it('liste vide → résumé vide', () => {
    expect(summarizeGoals([])).toEqual(EMPTY_GOALS_SUMMARY)
  })
})

describe('progressFromActivity', () => {
  const activity: GoalActivity = {
    attempts: [
      attempt({ subjectId: 'math', percent: 60 }),
      attempt({ subjectId: 'math', percent: 90 }),
      attempt({ subjectId: 'bio', percent: 40 }),
      attempt({ percent: 100 }), // sans matière
    ],
    flashcards: [
      card({ subjectId: 'math', repetitions: 0 }),
      card({ subjectId: 'math', repetitions: 1 }),
      card({ subjectId: 'math', repetitions: 3 }),
      card({ subjectId: 'bio', repetitions: 5 }),
    ],
  }

  it('objectif non-auto → progression inchangée (rien à dériver)', () => {
    const g = buildGoal({ title: 'manuel', target: 10, progress: 4, createdAt: 1 })
    expect(progressFromActivity(g, activity)).toBe(4)
  })

  it('exam-attempts compte les passages (filtré par matière)', () => {
    const g = buildGoal({ title: 'x', target: 5, auto: 'exam-attempts', subjectId: 'math', createdAt: 1 })
    expect(progressFromActivity(g, activity)).toBe(2)
  })

  it('exam-attempts sans matière compte tous les passages', () => {
    const g = buildGoal({ title: 'x', target: 5, auto: 'exam-attempts', createdAt: 1 })
    expect(progressFromActivity(g, activity)).toBe(4)
  })

  it('exam-best-percent prend le meilleur score de la matière', () => {
    const g = buildGoal({ title: 'x', target: 100, auto: 'exam-best-percent', subjectId: 'math', createdAt: 1 })
    expect(progressFromActivity(g, activity)).toBe(90)
  })

  it('exam-best-percent → 0 sans passage', () => {
    const g = buildGoal({ title: 'x', target: 100, auto: 'exam-best-percent', subjectId: 'chimie', createdAt: 1 })
    expect(progressFromActivity(g, activity)).toBe(0)
  })

  it('flashcards-reviewed compte les cartes vues au moins une fois', () => {
    const g = buildGoal({ title: 'x', target: 10, auto: 'flashcards-reviewed', subjectId: 'math', createdAt: 1 })
    expect(progressFromActivity(g, activity)).toBe(2) // repetitions 1 et 3
  })

  it('flashcards-mastered compte les cartes ≥ 2 répétitions', () => {
    const g = buildGoal({ title: 'x', target: 10, auto: 'flashcards-mastered', subjectId: 'math', createdAt: 1 })
    expect(progressFromActivity(g, activity)).toBe(1) // seul repetitions:3
  })

  it('activité vide par défaut → 0', () => {
    const g = buildGoal({ title: 'x', target: 5, auto: 'exam-attempts', createdAt: 1 })
    expect(progressFromActivity(g)).toBe(0)
  })
})

describe('syncedGoal', () => {
  it('met à jour progress + updatedAt quand la valeur dérivée change', () => {
    const g = buildGoal({ title: 'x', target: 5, auto: 'exam-attempts', progress: 0, createdAt: 1 })
    const activity: GoalActivity = { attempts: [attempt({}), attempt({})], flashcards: [] }
    const next = syncedGoal(g, activity, 999)
    expect(next).not.toBe(g)
    expect(next.progress).toBe(2)
    expect(next.updatedAt).toBe(999)
  })

  it('borne à la cible et fige completedAt', () => {
    const g = buildGoal({ title: 'x', target: 2, auto: 'exam-attempts', progress: 0, createdAt: 1 })
    const activity: GoalActivity = {
      attempts: [attempt({}), attempt({}), attempt({})],
      flashcards: [],
    }
    const next = syncedGoal(g, activity, 999)
    expect(next.progress).toBe(2)
    expect(next.completedAt).toBe(999)
  })

  it('inchangé (même référence) si la progression dérivée est identique', () => {
    const g = buildGoal({ title: 'x', target: 5, auto: 'exam-attempts', progress: 1, createdAt: 1 })
    const activity: GoalActivity = { attempts: [attempt({})], flashcards: [] }
    expect(syncedGoal(g, activity, 999)).toBe(g)
  })

  it('objectif non-auto → inchangé', () => {
    const g = buildGoal({ title: 'x', target: 5, progress: 1, createdAt: 1 })
    const activity: GoalActivity = { attempts: [attempt({}), attempt({})], flashcards: [] }
    expect(syncedGoal(g, activity, 999)).toBe(g)
  })
})
