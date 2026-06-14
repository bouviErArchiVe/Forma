/**
 * TasksPanel — liste de tâches réutilisable (dashboard, matière, projet, page
 * tâches). Création rapide, groupement par statut, cycle de statut au clic,
 * priorité, échéance, suppression. Filtrage optionnel par matière/projet/doc.
 */
import { useCallback, useEffect, useState } from 'react'
import { Icon } from '../ui/Icon'
import { confirm } from '../../stores/confirmStore'
import {
  createTask,
  deleteTask,
  listTasks,
  nextStatus,
  setTaskStatus,
  todayISO,
  type ListTasksOptions,
} from '../../services/tasks'
import type { Task, TaskPriority, TaskStatus } from '../../types'

const STATUS_LABEL: Record<TaskStatus, string> = { todo: 'À faire', doing: 'En cours', done: 'Terminé' }
const STATUS_COLOR: Record<TaskStatus, string> = {
  todo: 'text-forma-muted',
  doing: 'text-blue-500',
  done: 'text-green-500',
}
const PRIORITY_DOT: Record<TaskPriority, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-400',
  low: 'bg-gray-300 dark:bg-gray-600',
}

export function TasksPanel({
  filter = {},
  /** Valeurs appliquées aux tâches créées ici (matière/projet/doc courants). */
  createDefaults = {},
  title = 'Tâches',
  compact = false,
}: {
  filter?: ListTasksOptions
  createDefaults?: { subjectId?: string; projectId?: string; documentId?: string }
  title?: string
  compact?: boolean
}) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newDue, setNewDue] = useState('')
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium')

  const filterKey = JSON.stringify(filter)
  const reload = useCallback(async () => {
    setTasks(await listTasks(filter))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey])

  useEffect(() => {
    void Promise.resolve().then(reload)
  }, [reload])

  const add = async () => {
    if (newTitle.trim() === '') return
    await createTask({
      title: newTitle,
      priority: newPriority,
      ...(newDue ? { dueDate: newDue } : {}),
      ...createDefaults,
    })
    setNewTitle('')
    setNewDue('')
    setNewPriority('medium')
    await reload()
  }

  const today = todayISO()
  const groups: { status: TaskStatus; items: Task[] }[] = (['todo', 'doing', 'done'] as TaskStatus[]).map(
    (status) => ({ status, items: tasks.filter((t) => t.status === status) }),
  )

  return (
    <div className="space-y-3">
      {/* Création rapide */}
      <div className="flex flex-wrap items-center gap-1.5">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void add() }}
          placeholder={`Nouvelle tâche${title !== 'Tâches' ? ` (${title.toLowerCase()})` : ''}…`}
          className="flex-1 min-w-40 text-sm border border-forma-border rounded-lg px-2.5 py-1.5 bg-forma-bg focus:outline-none focus:border-forma-accent"
        />
        <input
          type="date"
          value={newDue}
          onChange={(e) => setNewDue(e.target.value)}
          title="Échéance"
          className="text-xs border border-forma-border rounded-lg px-2 py-1.5 bg-forma-bg focus:outline-none focus:border-forma-accent"
        />
        <select
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
          title="Priorité"
          className="text-xs border border-forma-border rounded-lg px-2 py-1.5 bg-forma-bg focus:outline-none focus:border-forma-accent"
        >
          <option value="high">Haute</option>
          <option value="medium">Moyenne</option>
          <option value="low">Basse</option>
        </select>
        <button
          type="button"
          onClick={() => void add()}
          disabled={newTitle.trim() === ''}
          className="text-xs px-3 py-1.5 rounded-lg bg-forma-accent text-white hover:bg-forma-accent-hover disabled:opacity-40 transition-colors inline-flex items-center gap-1"
        >
          <Icon name="plus" className="w-3.5 h-3.5" />
          Ajouter
        </button>
      </div>

      {/* Listes par statut */}
      {tasks.length === 0 ? (
        <p className="text-xs text-forma-muted text-center py-4">Aucune tâche. Ajoutez-en une ci-dessus.</p>
      ) : (
        groups.map((g) =>
          g.items.length === 0 && compact ? null : (
            <div key={g.status}>
              <p className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${STATUS_COLOR[g.status]}`}>
                {STATUS_LABEL[g.status]} ({g.items.length})
              </p>
              <div className="space-y-1">
                {g.items.map((t) => {
                  const overdue = t.status !== 'done' && t.dueDate !== undefined && t.dueDate < today
                  return (
                    <div
                      key={t.id}
                      className="group flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-forma-border bg-forma-surface"
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[t.priority]}`} title={`Priorité ${t.priority}`} />
                      <button
                        type="button"
                        title="Changer le statut"
                        onClick={async () => { await setTaskStatus(t.id, nextStatus(t.status)); await reload() }}
                        className={`shrink-0 ${STATUS_COLOR[t.status]}`}
                      >
                        <Icon name={t.status === 'done' ? 'check' : 'chevron-right'} className="w-4 h-4" />
                      </button>
                      <span className={`flex-1 text-sm truncate ${t.status === 'done' ? 'line-through text-forma-muted' : 'text-forma-text'}`}>
                        {t.title}
                      </span>
                      {t.dueDate && (
                        <span className={`text-[10px] shrink-0 ${overdue ? 'text-red-500 font-medium' : 'text-forma-muted'}`}>
                          {overdue ? '⚠ ' : ''}{t.dueDate.slice(5)}
                        </span>
                      )}
                      <button
                        type="button"
                        title="Supprimer"
                        onClick={async () => {
                          const ok = await confirm(`Supprimer « ${t.title} » ?`, { confirmLabel: 'Supprimer', danger: true })
                          if (ok) { await deleteTask(t.id); await reload() }
                        }}
                        className="shrink-0 text-forma-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Icon name="trash" className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ),
        )
      )}
    </div>
  )
}
