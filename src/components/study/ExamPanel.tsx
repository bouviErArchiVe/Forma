/**
 * ExamPanel — examens blancs d'une matière (Study C3) + statistiques (C4).
 *
 * Génère un examen à partir des flashcards / quiz de la matière, permet de le
 * passer (saisie des réponses), le corrige, affiche le score et historise le
 * passage. En-tête de statistiques d'apprentissage (moyenne, meilleur, dernier,
 * tendance). Réutilise les conventions UI Study (forma-border, dark mode,
 * empty states). Aucun contenu inventé : sans matériel, génération impossible.
 */
import { useCallback, useEffect, useState } from 'react'
import { Icon } from '../ui/Icon'
import {
  deleteExam,
  examStats,
  generateExam,
  listAttempts,
  listExams,
  submitExam,
} from '../../services/exams'
import { EMPTY_EXAM_STATS, type ExamStats } from '../../lib/study/exam'
import { useToastStore } from '../../stores/toastStore'
import type { Exam, ExamAttempt } from '../../types'

const TREND_LABEL: Record<ExamStats['trend'], string> = {
  up: '▲ en progrès',
  down: '▼ en baisse',
  flat: '= stable',
  none: '',
}

function StatsHeader({ stats }: { stats: ExamStats }) {
  if (stats.attempts === 0) {
    return (
      <p className="text-[10px] text-forma-muted">
        Aucun passage encore. Générez un examen et passez-le pour suivre vos progrès.
      </p>
    )
  }
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="p-3 rounded-xl border border-forma-border bg-forma-surface">
        <p className="text-2xl font-semibold text-forma-text">{stats.averagePercent}%</p>
        <p className="text-xs text-forma-muted">moyenne ({stats.attempts})</p>
      </div>
      <div className="p-3 rounded-xl border border-forma-border bg-forma-surface">
        <p className="text-2xl font-semibold text-forma-text">{stats.bestPercent}%</p>
        <p className="text-xs text-forma-muted">meilleur</p>
      </div>
      <div className="p-3 rounded-xl border border-forma-border bg-forma-surface">
        <p className="text-2xl font-semibold text-forma-text">{stats.lastPercent}%</p>
        <p className="text-xs text-forma-muted">
          dernier{stats.trend !== 'none' ? ` · ${TREND_LABEL[stats.trend]}` : ''}
        </p>
      </div>
    </div>
  )
}

export function ExamPanel({ subjectId, subjectName }: { subjectId?: string; subjectName?: string }) {
  const [exams, setExams] = useState<Exam[]>([])
  const [attempts, setAttempts] = useState<ExamAttempt[]>([])
  const [stats, setStats] = useState<ExamStats>(EMPTY_EXAM_STATS)
  const [busy, setBusy] = useState(false)

  // Passage en cours.
  const [active, setActive] = useState<Exam | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ExamAttempt | null>(null)

  const filter = subjectId ? { subjectId } : {}

  const reload = useCallback(async () => {
    setExams(await listExams(filter))
    setAttempts(await listAttempts(filter))
    setStats(await examStats(filter))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId])

  useEffect(() => {
    void Promise.resolve().then(reload)
  }, [reload])

  const generate = async () => {
    setBusy(true)
    try {
      const title = subjectName ? `Examen — ${subjectName}` : 'Examen blanc'
      const exam = await generateExam(
        { title, ...(subjectId ? { subjectId } : {}) },
        { shuffle: (arr) => [...arr].sort(() => Math.random() - 0.5) },
      )
      if (!exam) {
        useToastStore
          .getState()
          .show('Pas assez de matériel — ajoutez des flashcards ou un quiz à la matière')
        return
      }
      await reload()
      useToastStore.getState().show(`Examen généré (${exam.questions.length} questions)`)
    } finally {
      setBusy(false)
    }
  }

  const startExam = (exam: Exam) => {
    setActive(exam)
    setAnswers({})
    setResult(null)
  }

  const submit = async () => {
    if (!active) return
    setBusy(true)
    try {
      const attempt = await submitExam({ examId: active.id, given: answers })
      if (!attempt) {
        useToastStore.getState().show('Examen introuvable')
        return
      }
      setResult(attempt)
      await reload()
    } finally {
      setBusy(false)
    }
  }

  const closeExam = () => {
    setActive(null)
    setAnswers({})
    setResult(null)
  }

  const removeExam = async (id: string) => {
    await deleteExam(id)
    if (active?.id === id) closeExam()
    await reload()
  }

  // ── Mode passage / résultat ─────────────────────────────────────────────────
  if (active) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-forma-accent">
            {result ? 'Résultat' : 'Examen'} — {active.title}
          </p>
          <button
            type="button"
            onClick={closeExam}
            className="text-xs text-forma-muted hover:text-forma-text inline-flex items-center gap-1"
          >
            <Icon name="close" className="w-3.5 h-3.5" />
            Fermer
          </button>
        </div>

        {result && (
          <div className="p-4 rounded-2xl border border-forma-accent/30 bg-forma-accent/5 text-center">
            <p className="text-3xl font-semibold text-forma-text">{result.percent}%</p>
            <p className="text-xs text-forma-muted mt-0.5">
              {result.score} / {result.total} points
            </p>
          </div>
        )}

        <div className="space-y-3">
          {active.questions.map((q, i) => {
            const ans = result?.answers.find((a) => a.questionId === q.id)
            return (
              <div
                key={q.id}
                className={`p-3 rounded-xl border bg-forma-surface ${
                  result
                    ? ans?.correct
                      ? 'border-green-400/50'
                      : 'border-red-400/50'
                    : 'border-forma-border'
                }`}
              >
                <p className="text-sm text-forma-text mb-2">
                  <span className="text-forma-muted">{i + 1}.</span> {q.question}
                </p>

                {!result ? (
                  q.type === 'mcq' && q.options ? (
                    <div className="space-y-1">
                      {q.options.map((opt, oi) => (
                        <label key={oi} className="flex items-center gap-2 text-sm text-forma-text">
                          <input
                            type="radio"
                            name={q.id}
                            checked={answers[q.id] === String(oi)}
                            onChange={() => setAnswers((a) => ({ ...a, [q.id]: String(oi) }))}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  ) : q.type === 'truefalse' ? (
                    <div className="flex gap-3">
                      {['vrai', 'faux'].map((v) => (
                        <label key={v} className="flex items-center gap-1.5 text-sm text-forma-text">
                          <input
                            type="radio"
                            name={q.id}
                            checked={answers[q.id] === v}
                            onChange={() => setAnswers((a) => ({ ...a, [q.id]: v }))}
                          />
                          {v === 'vrai' ? 'Vrai' : 'Faux'}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <input
                      value={answers[q.id] ?? ''}
                      onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                      placeholder="Votre réponse"
                      className="w-full text-sm px-3 py-2 rounded-lg border border-forma-border bg-forma-bg text-forma-text placeholder:text-forma-muted focus:outline-none focus:border-forma-accent/60"
                    />
                  )
                ) : (
                  <div className="text-xs space-y-0.5">
                    <p className={ans?.correct ? 'text-green-500' : 'text-red-500'}>
                      Votre réponse : {formatGiven(q, ans?.given ?? '')}
                      {ans?.correct ? ' ✓' : ' ✗'}
                    </p>
                    {!ans?.correct && (
                      <p className="text-forma-accent">Attendu : {formatAnswer(q)}</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {!result && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void submit()}
            className="w-full text-sm px-4 py-2.5 rounded-xl bg-forma-accent text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Corriger l’examen
          </button>
        )}
      </div>
    )
  }

  // ── Mode gestion ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <StatsHeader stats={stats} />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void generate()}
          className="text-xs px-3 py-1.5 rounded-lg border border-forma-border hover:border-forma-accent/60 text-forma-muted hover:text-forma-accent transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          <Icon name="sparkles" className="w-3.5 h-3.5" />
          Générer un examen blanc
        </button>
        <span className="text-[10px] text-forma-muted">
          À partir des flashcards et quiz de la matière
        </span>
      </div>

      {exams.length === 0 ? (
        <p className="text-xs text-forma-muted text-center py-6">
          Aucun examen. Générez-en un à partir de vos flashcards / quiz.
        </p>
      ) : (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-forma-muted">
            Examens ({exams.length})
          </p>
          {exams.map((e) => {
            const last = attempts.find((a) => a.examId === e.id)
            return (
              <div
                key={e.id}
                className="group flex items-center gap-2 px-3 py-2 rounded-xl border border-forma-border bg-forma-surface"
              >
                <Icon name="file-text" className="w-4 h-4 text-forma-accent shrink-0" />
                <button
                  type="button"
                  onClick={() => startExam(e)}
                  className="flex-1 text-left text-sm text-forma-text truncate hover:text-forma-accent"
                >
                  {e.title}
                </button>
                <span className="text-[10px] text-forma-muted shrink-0">
                  {e.questions.length} q.
                  {last ? ` · ${last.percent}%` : ''}
                </span>
                <button
                  type="button"
                  title="Supprimer"
                  onClick={() => void removeExam(e.id)}
                  className="p-1 text-forma-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >
                  <Icon name="trash" className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {attempts.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-forma-muted">
            Historique ({attempts.length})
          </p>
          {attempts.slice(0, 8).map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  a.percent >= 60 ? 'bg-green-500' : 'bg-orange-500'
                }`}
              />
              <span className="text-forma-text flex-1">
                {a.score} / {a.total} points
              </span>
              <span className="text-forma-muted shrink-0">{a.percent}%</span>
              <span className="text-forma-muted shrink-0">
                {new Date(a.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatGiven(q: Exam['questions'][number], given: string): string {
  if (given.trim() === '') return '(vide)'
  if (q.type === 'mcq' && q.options) {
    const idx = Number(given)
    return q.options[idx] ?? given
  }
  if (q.type === 'truefalse') return given === 'vrai' ? 'Vrai' : given === 'faux' ? 'Faux' : given
  return given
}

function formatAnswer(q: Exam['questions'][number]): string {
  if (q.type === 'mcq' && q.options) {
    const idx = Number(q.answer)
    return q.options[idx] ?? q.answer
  }
  if (q.type === 'truefalse') return q.answer === 'vrai' ? 'Vrai' : 'Faux'
  return q.answer
}
