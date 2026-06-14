/**
 * ProjectChecklistPanel — génère et gère des checklists de projet avec FormAI.
 * Génération locale à partir des documents/tâches/événements du projet.
 */
import { useCallback, useEffect, useState } from 'react'
import { Icon } from '../ui/Icon'
import { collectProjectContext } from '../../lib/study-context'
import { generateChecklistLocal } from '../../lib/study-generators'
import {
  deleteChecklist,
  listChecklists,
  saveChecklist,
  toggleChecklistItem,
} from '../../services/study-content'
import { useToastStore } from '../../stores/toastStore'
import type { Checklist } from '../../types'

export function ProjectChecklistPanel({ projectId, projectName }: { projectId: string; projectName: string }) {
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [busy, setBusy] = useState(false)

  const reload = useCallback(async () => setChecklists(await listChecklists({ projectId })), [projectId])
  useEffect(() => { void Promise.resolve().then(reload) }, [reload])

  const generate = async () => {
    setBusy(true)
    try {
      const ctx = await collectProjectContext(projectId)
      const items = generateChecklistLocal(ctx)
      await saveChecklist({ title: `Checklist — ${projectName}`, projectId, items, source: 'local' })
      await reload()
      useToastStore.getState().show('Checklist générée')
    } finally { setBusy(false) }
  }

  return (
    <div className="space-y-3">
      <button type="button" disabled={busy} onClick={() => void generate()} className="text-xs px-3 py-1.5 rounded-lg border border-forma-border hover:border-forma-accent/60 text-forma-muted hover:text-forma-accent transition-colors inline-flex items-center gap-1.5 disabled:opacity-50">
        <Icon name="sparkles" className="w-3.5 h-3.5" />
        Générer une checklist
      </button>

      {checklists.length === 0 ? (
        <p className="text-xs text-forma-muted">Aucune checklist. Générez-en une à partir des documents et tâches du projet.</p>
      ) : (
        checklists.map((c) => {
          const done = c.items.filter((i) => i.done).length
          return (
            <div key={c.id} className="p-3 rounded-xl border border-forma-border bg-forma-surface">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-forma-text">{c.title} <span className="text-[10px] text-forma-muted">({done}/{c.items.length})</span></p>
                <button type="button" title="Supprimer" onClick={async () => { await deleteChecklist(c.id); await reload() }} className="p-1 text-forma-muted hover:text-red-500">
                  <Icon name="trash" className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-1">
                {c.items.map((it) => (
                  <button key={it.id} type="button" onClick={async () => { await toggleChecklistItem(c.id, it.id); await reload() }} className="w-full flex items-center gap-2 text-left text-sm hover:bg-forma-bg rounded-lg px-1.5 py-1">
                    <span className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center ${it.done ? 'bg-forma-accent border-forma-accent text-white' : 'border-forma-border'}`}>
                      {it.done && <Icon name="check" className="w-3 h-3" />}
                    </span>
                    <span className={it.done ? 'line-through text-forma-muted' : 'text-forma-text'}>{it.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
