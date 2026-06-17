/**
 * StudyStatsPage — vue globale des statistiques d'apprentissage (Study C5).
 *
 * Agrège, sans rien recalculer en doublon, le matériel d'étude existant :
 *  - examens : examStats (global) + examStatsBySubject (par matière) ;
 *  - flashcards : flashcardStats (total / dues / fraîches) ;
 *  - objectifs académiques : summarizeGoals (logique pure C5).
 * Les noms de matières sont résolus depuis les notebooks de type 'subject'.
 * Composant de page exporté pour être routé par Lane E (aucune édition d'App.tsx).
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { db } from '../db'
import { examStats, examStatsBySubject } from '../services/exams'
import { flashcardStats, type FlashcardStats } from '../services/flashcards'
import { listGoals } from '../services/goals'
import {
  EMPTY_EXAM_STATS,
  type ExamStats,
  type SubjectExamStat,
} from '../lib/study/exam'
import {
  EMPTY_GOALS_SUMMARY,
  summarizeGoals,
  type GoalsSummary,
} from '../lib/study/goals'
import { GoalsPanel } from '../components/study/GoalsPanel'
import type { AcademicGoal } from '../types'

const TREND_LABEL: Record<ExamStats['trend'], string> = {
  up: '▲ en progrès',
  down: '▼ en baisse',
  flat: '= stable',
  none: '',
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="p-3 rounded-xl border border-forma-border bg-forma-surface">
      <p className="text-2xl font-semibold text-forma-text">{value}</p>
      <p className="text-xs text-forma-muted">{label}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-forma-muted">{title}</h2>
      {children}
    </section>
  )
}

export function StudyStatsPage() {
  const [exams, setExams] = useState<ExamStats>(EMPTY_EXAM_STATS)
  const [bySubject, setBySubject] = useState<SubjectExamStat[]>([])
  const [cards, setCards] = useState<FlashcardStats>({ total: 0, due: 0, fresh: 0 })
  const [goals, setGoals] = useState<AcademicGoal[]>([])
  const [goalsSummary, setGoalsSummary] = useState<GoalsSummary>(EMPTY_GOALS_SUMMARY)
  const [subjectNames, setSubjectNames] = useState<Record<string, string>>({})

  useEffect(() => {
    let alive = true
    void (async () => {
      const [e, s, c, g, subjects] = await Promise.all([
        examStats(),
        examStatsBySubject(),
        flashcardStats(),
        listGoals(),
        db.notebooks.filter((n) => n.type === 'subject' && !n.deletedAt).toArray(),
      ])
      if (!alive) return
      setExams(e)
      setBySubject(s)
      setCards(c)
      setGoals(g)
      setGoalsSummary(summarizeGoals(g))
      setSubjectNames(Object.fromEntries(subjects.map((n) => [n.id, n.name])))
    })()
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="min-h-full p-6 max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-forma-muted hover:text-forma-accent transition-colors"
        >
          <Icon name="chevron-left" className="w-4 h-4" />
          Tableau de bord
        </Link>
      </div>
      <h1 className="text-xl font-semibold text-forma-text inline-flex items-center gap-2">
        <Icon name="zap" className="w-5 h-5 text-forma-accent" />
        Statistiques d'apprentissage
      </h1>

      <Section title="Examens">
        {exams.attempts === 0 ? (
          <p className="text-xs text-forma-muted">
            Aucun passage encore. Générez un examen depuis une matière et passez-le pour suivre vos
            progrès.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard value={`${exams.averagePercent}%`} label={`moyenne (${exams.attempts})`} />
            <StatCard value={`${exams.bestPercent}%`} label="meilleur" />
            <StatCard
              value={`${exams.lastPercent}%`}
              label={exams.trend !== 'none' ? `dernier · ${TREND_LABEL[exams.trend]}` : 'dernier'}
            />
            <StatCard value={String(exams.attempts)} label="passages" />
          </div>
        )}

        {bySubject.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-forma-muted">
              Par matière
            </p>
            {bySubject
              .slice()
              .sort((a, b) => b.averagePercent - a.averagePercent)
              .map((s) => (
                <div
                  key={s.subjectId}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                >
                  <span className="text-forma-text flex-1 truncate">
                    {subjectNames[s.subjectId] ?? 'Matière'}
                  </span>
                  <span className="text-forma-muted shrink-0">{s.attempts} passage(s)</span>
                  <span className="text-forma-text shrink-0 w-12 text-right">
                    {s.averagePercent}%
                  </span>
                </div>
              ))}
          </div>
        )}
      </Section>

      <Section title="Flashcards">
        <div className="grid grid-cols-3 gap-3">
          <StatCard value={String(cards.total)} label="total" />
          <StatCard value={String(cards.due)} label="à réviser" />
          <StatCard value={String(cards.fresh)} label="jamais vues" />
        </div>
      </Section>

      <Section title="Objectifs">
        {goals.length === 0 ? null : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard value={String(goalsSummary.total)} label="objectifs" />
            <StatCard value={String(goalsSummary.done)} label="atteints" />
            <StatCard value={String(goalsSummary.overdue)} label="en retard" />
            <StatCard value={`${goalsSummary.averagePercent}%`} label="avancement" />
          </div>
        )}
        <GoalsPanel />
      </Section>
    </div>
  )
}

export default StudyStatsPage
