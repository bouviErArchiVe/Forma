/**
 * MemoryPanel — panneau de mémoire locale FormAI.
 *
 * Liste les entrées de mémoire (faits, préférences, contexte projet),
 * permet l'ajout manuel, la suppression unitaire et l'effacement complet.
 * La mémoire pertinente est injectée automatiquement dans les prompts.
 */
import { useEffect, useState } from 'react'
import { Icon } from '../../../components/ui/Icon'
import {
  addMemory,
  clearMemories,
  deleteMemory,
  listMemories,
} from '../../../services/ai/memory'
import type { AIMemoryEntry } from '../../../services/ai/types'
import { confirm } from '../../../stores/confirmStore'
import { useToastStore } from '../../../stores/toastStore'

export function MemoryPanel({ onClose }: { onClose: () => void }) {
  const [entries, setEntries] = useState<AIMemoryEntry[]>([])
  const [input, setInput] = useState('')

  const reload = async () => setEntries(await listMemories())

  useEffect(() => {
    // setState après await (listMemories est asynchrone)
    void Promise.resolve().then(reload)
  }, [])

  const add = async () => {
    const text = input.trim()
    if (text === '') return
    await addMemory(text, { source: 'manual' })
    setInput('')
    await reload()
    useToastStore.getState().show('Ajouté à la mémoire')
  }

  return (
    <aside className="w-72 shrink-0 border-l border-forma-border bg-forma-surface flex flex-col min-h-0">
      <div className="flex items-center justify-between px-3 py-2 border-b border-forma-border shrink-0">
        <h3 className="text-xs font-semibold text-forma-text inline-flex items-center gap-1.5">
          <span className="text-forma-accent">⬡</span>
          Mémoire locale
        </h3>
        <div className="flex items-center gap-1">
          {entries.length > 0 && (
            <button
              type="button"
              onClick={async () => {
                const ok = await confirm('Effacer toute la mémoire locale ?', {
                  confirmLabel: 'Effacer',
                  danger: true,
                })
                if (ok) {
                  await clearMemories()
                  await reload()
                  useToastStore.getState().show('Mémoire effacée')
                }
              }}
              className="text-[10px] text-forma-muted hover:text-red-500 px-1"
            >
              Tout effacer
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            title="Fermer"
            className="p-1 text-forma-muted hover:text-forma-text"
          >
            <Icon name="close" className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <p className="text-[10px] text-forma-muted px-3 py-2 shrink-0">
        Les entrées pertinentes sont injectées automatiquement dans le contexte des réponses.
        Tout reste sur cet appareil.
      </p>

      <div className="flex-1 overflow-y-auto min-h-0 px-3 space-y-1">
        {entries.length === 0 && (
          <p className="text-[11px] text-forma-muted text-center py-6">Aucune mémoire enregistrée</p>
        )}
        {entries.map((m) => (
          <div
            key={m.id}
            className="group flex items-start gap-1.5 text-[11px] border border-forma-border rounded-lg px-2 py-1.5 bg-forma-bg"
          >
            <p className="flex-1 text-forma-text leading-snug break-words min-w-0">
              {m.content}
              {m.tags.length > 0 && (
                <span className="block text-[9px] text-forma-accent mt-0.5">{m.tags.join(' · ')}</span>
              )}
            </p>
            <button
              type="button"
              title="Supprimer"
              onClick={async () => {
                await deleteMemory(m.id)
                await reload()
              }}
              className="opacity-0 group-hover:opacity-100 text-forma-muted hover:text-red-500 shrink-0 transition-opacity"
            >
              <Icon name="close" className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="p-2 border-t border-forma-border shrink-0 flex gap-1.5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void add()
          }}
          placeholder="Ajouter à la mémoire…"
          className="flex-1 text-xs border border-forma-border rounded-lg px-2 py-1.5 bg-forma-bg focus:outline-none focus:border-forma-accent"
        />
        <button
          type="button"
          onClick={() => void add()}
          disabled={input.trim() === ''}
          title="Ajouter"
          className="shrink-0 w-8 h-8 rounded-lg bg-forma-accent text-white hover:bg-forma-accent-hover disabled:opacity-40 flex items-center justify-center transition-colors"
        >
          <Icon name="plus" className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  )
}
