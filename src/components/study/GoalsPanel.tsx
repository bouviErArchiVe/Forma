/**
 * GoalsPanel — objectifs académiques (Study C5).
 *
 * Crée / suit / met à jour des objectifs liés (optionnellement) à une matière :
 * titre, cible, unité, échéance, progression. L'état dérivé (pourcentage,
 * atteint, en retard) vient de la logique pure src/lib/study/goals.ts. Réutilise
 * les conventions UI Study (forma-border, dark mode, empty states).
 */
import { useCallback, useEffect, useState } from 'react'
import { Icon } from '../ui/Icon'
import { adjustGoalProgress, createGoal, deleteGoal, listGoals } from '../../services/goals'
import { goalView } from '../../lib/study/goals'
import type { AcademicGoal } from '../../types'

function GoalRow({
  goal,
  onChange,
  onDelete,
}: {
  goal: AcademicGoal
  onChange: () => void | Promise<void>
  onDelete: () => void | Promise<void>
}) {
  const view = goalView(goal)
  const barColor = view.done
    ? 'bg-green-500'
    : view.overdue
      ? 'bg-orange-500'
      : 'bg-forma-accent'

  return (
    <div className="group p-3 rounded-xl border border-forma-border bg-forma-surface space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-forma-text flex-1 truncate">{goal.title}</span>
        {view.done && <span className="text-[10px] text-green-500 shrink-0">atteint</span>}
        {view.overdue && <span className="text-[10px] text-orange-500 shrink-0">en retard</span>}
        <button
          type="button"
          title="Supprimer"
          onClick={() => void onDelete()}
          className="p-1 text-forma-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        >
          <Icon name="trash" className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="h-1.5 rounded-full bg-forma-bg overflow-hidden">
        <div className={`h-full ${barColor}`} style={{ width: `${view.percent}%` }} />
      </div>

      <div className="flex items-center gap-2 text-[11px] text-forma-muted">
        <button
          type="button"
          title="Diminuer"
          disabled={goal.progress <= 0}
          onClick={() => void Promise.resolve(adjustGoalProgress(goal.id, -1)).then(onChange)}
          className="px-1.5 rounded border border-forma-border hover:border-forma-accent/60 hover:text-forma-accent disabled:opacity-40"
        >
          −
        </button>
        <span className="text-forma-text">
          {goal.progress} / {goal.target}
          {goal.unit ? ` ${goal.unit}` : ''}
        </span>
        <button
          type="button"
          title="Augmenter"
          onClick={() => void Promise.resolve(adjustGoalProgress(goal.id, 1)).then(onChange)}
          className="px-1.5 rounded border border-forma-border hover:border-forma-accent/60 hover:text-forma-accent"
        >
          +
        </button>
        <span className="flex-1 text-right">
          {view.percent}%
          {goal.dueDate ? ` · ${goal.dueDate}` : ''}
        </span>
      </div>
    </div>
  )
}

export function GoalsPanel({ subjectId }: { subjectId?: string }) {
  const [goals, setGoals] = useState<AcademicGoal[]>([])
  const [title, setTitle] = useState('')
  const [target, setTarget] = useState('10')
  const [unit, setUnit] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [busy, setBusy] = useState(false)

  const reload = useCallback(async () => {
    setGoals(await listGoals(subjectId ? { subjectId } : {}))
  }, [subjectId])

  useEffect(() => {
    void Promise.resolve().then(reload)
  }, [reload])

  const add = async () => {
    const t = title.trim()
    const n = Number(target)
    if (t === '' || !Number.isFinite(n) || n <= 0) return
    setBusy(true)
    try {
      await createGoal({
        title: t,
        target: n,
        ...(subjectId ? { subjectId } : {}),
        ...(unit.trim() ? { unit: unit.trim() } : {}),
        ...(dueDate ? { dueDate } : {}),
      })
      setTitle('')
      setTarget('10')
      setUnit('')
      setDueDate('')
      await reload()
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id: string) => {
    await deleteGoal(id)
    await reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[140px]">
          <label className="text-[10px] text-forma-muted">Objectif</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Réviser 5 chapitres"
            className="w-full text-sm px-3 py-1.5 rounded-lg border border-forma-border bg-forma-bg text-forma-text placeholder:text-forma-muted focus:outline-none focus:border-forma-accent/60"
          />
        </div>
        <div className="w-16">
          <label className="text-[10px] text-forma-muted">Cible</label>
          <input
            type="number"
            min={1}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-full text-sm px-2 py-1.5 rounded-lg border border-forma-border bg-forma-bg text-forma-text focus:outline-none focus:border-forma-accent/60"
          />
        </div>
        <div className="w-20">
          <label className="text-[10px] text-forma-muted">Unité</label>
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="ch."
            className="w-full text-sm px-2 py-1.5 rounded-lg border border-forma-border bg-forma-bg text-forma-text placeholder:text-forma-muted focus:outline-none focus:border-forma-accent/60"
          />
        </div>
        <div className="w-36">
          <label className="text-[10px] text-forma-muted">Échéance</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full text-sm px-2 py-1.5 rounded-lg border border-forma-border bg-forma-bg text-forma-text focus:outline-none focus:border-forma-accent/60"
          />
        </div>
        <button
          type="button"
          disabled={busy || title.trim() === ''}
          onClick={() => void add()}
          className="text-xs px-3 py-2 rounded-lg bg-forma-accent text-white hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5"
        >
          <Icon name="plus" className="w-3.5 h-3.5" />
          Ajouter
        </button>
      </div>

      {goals.length === 0 ? (
        <p className="text-xs text-forma-muted text-center py-6">
          Aucun objectif. Fixez-vous une cible (heures, chapitres, cartes…) et suivez vos progrès.
        </p>
      ) : (
        <div className="space-y-2">
          {goals.map((g) => (
            <GoalRow key={g.id} goal={g} onChange={reload} onDelete={() => remove(g.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
