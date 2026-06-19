/**
 * StudyHubPage — tableau de bord global de l'étude (Study Sprint #5).
 *
 * Vue d'ensemble transversale du matériel d'apprentissage, toutes matières
 * confondues ou filtrées par une matière :
 *  - flashcards : total / dues / jamais vues ;
 *  - examens : passages, moyenne, meilleur, dernier, passages du jour ;
 *  - objectifs : total / atteints / en retard / avancement moyen ;
 *  - activité récente : derniers passages d'examens.
 *
 * Rien n'est recalculé ici : la page consomme `loadStudyHub`, qui délègue à la
 * logique PURE `buildStudyHub` (src/lib/study/hub.ts). Le filtre matière relance
 * simplement le chargement avec un `subjectId`. Composant exporté (named +
 * default) pour être routé par Lane E (aucune édition d'App.tsx).
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { loadStudyHub, type StudyHubData } from '../services/study-stats'
import type { ExamStats } from '../lib/study/exam'

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

function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon?: React.ComponentProps<typeof Icon>['name']
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-forma-muted inline-flex items-center gap-2">
        {icon && <Icon name={icon} className="w-4 h-4" />}
        {title}
      </h2>
      {children}
    </section>
  )
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })
}

export function StudyHubPage() {
  const [selectedSubject, setSelectedSubject] = useState('')
  const [data, setData] = useState<StudyHubData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    void (async () => {
      setLoading(true)
      const d = await loadStudyHub(
        selectedSubject ? { subjectId: selectedSubject } : {},
      )
      if (!alive) return
      setData(d)
      setLoading(false)
    })()
    return () => {
      alive = false
    }
  }, [selectedSubject])

  // Table id→nom pour étiqueter les passages récents (issue du filtre).
  const subjectNames = useMemo(
    () => Object.fromEntries((data?.subjects ?? []).map((s) => [s.id, s.name])),
    [data?.subjects],
  )

  const view = data?.view
  const subjects = data?.subjects ?? []

  return (
    <div className="min-h-full p-6 max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-forma-muted hover:text-forma-accent transition-colors"
        >
          <Icon name="chevron-left" className="w-4 h-4" />
          Tableau de bord
        </Link>
        <Link
          to="/study/stats"
          className="inline-flex items-center gap-1 text-sm text-forma-muted hover:text-forma-accent transition-colors"
        >
          Statistiques détaillées
          <Icon name="chevron-right" className="w-4 h-4" />
        </Link>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-semibold text-forma-text inline-flex items-center gap-2">
          <Icon name="zap" className="w-5 h-5 text-forma-accent" />
          Centre d'étude
        </h1>
        {subjects.length > 0 && (
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-lg border border-forma-border bg-forma-bg text-forma-text focus:outline-none focus:border-forma-accent/60"
            aria-label="Filtrer par matière"
          >
            <option value="">Toutes les matières</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading && !view ? (
        <p className="text-sm text-forma-muted">Chargement…</p>
      ) : !view ? (
        <p className="text-sm text-forma-muted">Aucune donnée d'étude.</p>
      ) : (
        <>
          <Section title="À réviser aujourd'hui" icon="book">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard value={String(view.dueCount)} label="cartes dues" />
              <StatCard value={String(view.flashcards.fresh)} label="jamais vues" />
              <StatCard value={String(view.examsToday)} label="examens du jour" />
              <StatCard value={String(view.flashcards.total)} label="cartes au total" />
            </div>
            {view.dueCount === 0 && view.flashcards.total === 0 && (
              <p className="text-xs text-forma-muted">
                Aucune flashcard pour l'instant. Créez-en depuis une matière pour démarrer la
                révision espacée.
              </p>
            )}
          </Section>

          <Section title="Examens blancs" icon="file-text">
            {view.exams.attempts === 0 ? (
              <p className="text-xs text-forma-muted">
                Aucun passage encore. Générez un examen depuis une matière et passez-le pour
                suivre vos progrès.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                  value={`${view.exams.averagePercent}%`}
                  label={`moyenne (${view.exams.attempts})`}
                />
                <StatCard value={`${view.exams.bestPercent}%`} label="meilleur" />
                <StatCard
                  value={`${view.exams.lastPercent}%`}
                  label={
                    view.exams.trend !== 'none'
                      ? `dernier · ${TREND_LABEL[view.exams.trend]}`
                      : 'dernier'
                  }
                />
                <StatCard value={String(view.exams.attempts)} label="passages" />
              </div>
            )}
          </Section>

          <Section title="Objectifs" icon="check">
            {view.goals.total === 0 ? (
              <p className="text-xs text-forma-muted">
                Aucun objectif défini{selectedSubject ? ' pour cette matière' : ''}.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard value={String(view.goals.total)} label="objectifs" />
                <StatCard value={String(view.goals.done)} label="atteints" />
                <StatCard value={String(view.goals.overdue)} label="en retard" />
                <StatCard value={`${view.goals.averagePercent}%`} label="avancement" />
              </div>
            )}
          </Section>

          <Section title="Activité récente" icon="sparkles">
            {view.recentAttempts.length === 0 ? (
              <p className="text-xs text-forma-muted">Aucun passage récent.</p>
            ) : (
              <div className="space-y-1">
                {view.recentAttempts.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-forma-surface border border-forma-border"
                  >
                    <span className="text-forma-text flex-1 truncate">
                      {a.subjectId ? (subjectNames[a.subjectId] ?? 'Matière') : 'Examen'}
                    </span>
                    <span className="text-forma-muted shrink-0">{formatDate(a.createdAt)}</span>
                    <span className="text-forma-text shrink-0 w-12 text-right font-medium">
                      {a.percent}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </>
      )}
    </div>
  )
}

export default StudyHubPage
