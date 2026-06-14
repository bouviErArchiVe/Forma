/**
 * TaskFromNoteButton — « Créer une tâche avec FormAI » depuis une note en
 * langage naturel. Analyse locale déterministe (échéance + priorité) puis
 * confirmation OBLIGATOIRE avant création. Réutilisable (carnet, doc, projet).
 */
import { useState } from 'react'
import { Icon } from '../ui/Icon'
import { createTask, todayISO } from '../../services/tasks'
import { taskFromNote, type TaskSuggestion } from '../../lib/study-generators'
import { useToastStore } from '../../stores/toastStore'

export function TaskFromNoteButton({
  defaults = {},
  className = '',
}: {
  defaults?: { subjectId?: string; projectId?: string; documentId?: string }
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [suggestion, setSuggestion] = useState<TaskSuggestion | null>(null)

  const analyze = () => {
    const s = taskFromNote(note, todayISO())
    if (!s) { useToastStore.getState().show('Écrivez une note (ex. « remettre le rapport lundi »)'); return }
    setSuggestion(s)
  }

  const confirmCreate = async () => {
    if (!suggestion) return
    await createTask({
      title: suggestion.title,
      priority: suggestion.priority,
      ...(suggestion.dueDate ? { dueDate: suggestion.dueDate } : {}),
      ...defaults,
    })
    useToastStore.getState().show('Tâche créée')
    setOpen(false)
    setNote('')
    setSuggestion(null)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); setNote(''); setSuggestion(null) }}
        className={className || 'text-xs px-3 py-1.5 rounded-lg border border-forma-border hover:border-forma-accent/60 text-forma-muted hover:text-forma-accent transition-colors inline-flex items-center gap-1.5'}
      >
        <Icon name="sparkles" className="w-3.5 h-3.5" />
        Créer une tâche avec FormAI
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="bg-forma-surface border border-forma-border rounded-xl shadow-xl p-4 w-80 max-w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-forma-text mb-1 inline-flex items-center gap-1.5">
              <Icon name="sparkles" className="w-4 h-4 text-forma-accent" />
              Tâche depuis une note
            </h3>
            <p className="text-xs text-forma-muted mb-3">Décrivez l’action ; date et priorité sont détectées. Vous confirmez avant création.</p>
            <textarea
              value={note}
              autoFocus
              onChange={(e) => { setNote(e.target.value); setSuggestion(null) }}
              rows={2}
              placeholder="Ex. : remettre le rapport lundi"
              className="w-full text-sm border border-forma-border rounded-lg px-2.5 py-1.5 bg-forma-bg resize-none focus:outline-none focus:border-forma-accent"
            />

            {suggestion && (
              <div className="mt-3 p-2.5 rounded-lg border border-forma-accent/30 bg-forma-accent/5 text-xs space-y-0.5">
                <p className="text-forma-text"><span className="text-forma-muted">Titre :</span> {suggestion.title}</p>
                <p className="text-forma-text"><span className="text-forma-muted">Échéance :</span> {suggestion.dueDate ?? '—'}</p>
                <p className="text-forma-text"><span className="text-forma-muted">Priorité :</span> {suggestion.priority === 'high' ? 'haute' : suggestion.priority === 'low' ? 'basse' : 'moyenne'}</p>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <button type="button" onClick={() => setOpen(false)} className="flex-1 text-xs py-1.5 rounded-lg border border-forma-border text-forma-text hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Annuler</button>
              {suggestion ? (
                <button type="button" onClick={() => void confirmCreate()} className="flex-1 text-xs py-1.5 rounded-lg bg-forma-accent text-white hover:bg-forma-accent-hover transition-colors">Créer la tâche</button>
              ) : (
                <button type="button" onClick={analyze} disabled={note.trim() === ''} className="flex-1 text-xs py-1.5 rounded-lg bg-forma-accent text-white hover:bg-forma-accent-hover disabled:opacity-40 transition-colors">Analyser</button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
