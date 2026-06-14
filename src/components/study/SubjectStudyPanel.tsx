/**
 * SubjectStudyPanel — actions FormAI d'étude pour une matière : générer un
 * quiz et préparer une révision à partir du contenu des documents liés.
 * Fonctionne en local (extractif, honnête) ; quiz/révisions persistés.
 */
import { useEffect, useState } from 'react'
import { Icon } from '../ui/Icon'
import { collectSubjectText } from '../../lib/study-context'
import { generateQuizLocal, prepareRevisionLocal } from '../../lib/study-generators'
import { listQuizzes, saveQuiz, deleteQuiz } from '../../services/study-content'
import { useToastStore } from '../../stores/toastStore'
import type { Quiz } from '../../types'

export function SubjectStudyPanel({ subjectId, subjectName }: { subjectId: string; subjectName: string }) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [busy, setBusy] = useState(false)
  const [revision, setRevision] = useState<{ summary: string; concepts: string[]; points: string[] } | null>(null)
  const [openQuiz, setOpenQuiz] = useState<Quiz | null>(null)

  const reload = async () => setQuizzes(await listQuizzes({ subjectId }))
  useEffect(() => { void Promise.resolve().then(reload) }, [subjectId]) // eslint-disable-line react-hooks/exhaustive-deps

  const genQuiz = async () => {
    setBusy(true)
    try {
      const text = await collectSubjectText(subjectId)
      const questions = generateQuizLocal(text, 6)
      if (questions.length === 0) {
        useToastStore.getState().show('Pas assez de contenu — ajoutez des notes/documents à la matière')
        return
      }
      await saveQuiz({ title: `Quiz — ${subjectName}`, subjectId, questions, source: 'local' })
      await reload()
      useToastStore.getState().show(`Quiz généré (${questions.length} questions)`)
    } finally { setBusy(false) }
  }

  const genRevision = async () => {
    setBusy(true)
    try {
      const text = await collectSubjectText(subjectId)
      if (text.trim() === '') {
        useToastStore.getState().show('Pas assez de contenu pour préparer une révision')
        setRevision(null)
        return
      }
      setRevision(prepareRevisionLocal(text))
    } finally { setBusy(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => void genQuiz()} className="text-xs px-3 py-1.5 rounded-lg border border-forma-border hover:border-forma-accent/60 text-forma-muted hover:text-forma-accent transition-colors inline-flex items-center gap-1.5 disabled:opacity-50">
          <Icon name="sparkles" className="w-3.5 h-3.5" />
          Générer un quiz
        </button>
        <button type="button" disabled={busy} onClick={() => void genRevision()} className="text-xs px-3 py-1.5 rounded-lg border border-forma-border hover:border-forma-accent/60 text-forma-muted hover:text-forma-accent transition-colors inline-flex items-center gap-1.5 disabled:opacity-50">
          <Icon name="book" className="w-3.5 h-3.5" />
          Préparer une révision
        </button>
      </div>

      {/* Révision */}
      {revision && (
        <div className="p-3 rounded-xl border border-forma-accent/30 bg-forma-accent/5 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-forma-accent">Révision — {subjectName}</p>
          {revision.summary && <p className="text-xs text-forma-text leading-relaxed">{revision.summary}</p>}
          {revision.concepts.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {revision.concepts.map((c) => <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-forma-bg text-forma-muted">{c}</span>)}
            </div>
          )}
          {revision.points.length > 0 && (
            <ul className="text-xs text-forma-text list-disc pl-4 space-y-0.5">
              {revision.points.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          )}
        </div>
      )}

      {/* Quiz sauvegardés */}
      {quizzes.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-forma-muted mb-1.5">Quiz ({quizzes.length})</p>
          <div className="space-y-1">
            {quizzes.map((q) => (
              <div key={q.id} className="group flex items-center gap-2 px-3 py-2 rounded-xl border border-forma-border bg-forma-surface">
                <Icon name="check" className="w-4 h-4 text-forma-accent shrink-0" />
                <button type="button" onClick={() => setOpenQuiz(openQuiz?.id === q.id ? null : q)} className="flex-1 text-left text-sm text-forma-text truncate hover:text-forma-accent">
                  {q.title}
                </button>
                <span className="text-[10px] text-forma-muted shrink-0">{q.questions.length} q.</span>
                <button type="button" title="Supprimer" onClick={async () => { await deleteQuiz(q.id); await reload() }} className="p-1 text-forma-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Icon name="trash" className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          {openQuiz && (
            <div className="mt-2 p-3 rounded-xl border border-forma-border bg-forma-surface space-y-2">
              {openQuiz.questions.map((qq, i) => (
                <details key={qq.id} className="text-xs">
                  <summary className="cursor-pointer text-forma-text">
                    {i + 1}. {qq.question}{qq.type === 'truefalse' ? ' (Vrai / Faux)' : ''}
                  </summary>
                  <p className="text-forma-accent mt-0.5 pl-3">Réponse : {qq.answer}</p>
                </details>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
