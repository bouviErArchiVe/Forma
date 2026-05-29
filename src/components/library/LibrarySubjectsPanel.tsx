import { useState } from 'react'
import { GlassPanel } from '../ui/GlassPanel'
import { FOLDER_COLORS, FOLDER_EMOJIS, type Subject } from '../../lib/subjects'
import type { Notebook } from '../../types'

interface LibrarySubjectsPanelProps {
  subjects: Subject[]
  notebooks: Notebook[]
  onAssignSubject: (notebookId: string, subjectId: string | undefined) => void
  onAddSubject: (label: string, emoji: string, color: string) => Promise<void>
  onFilterSubject: (subjectId: string | null) => void
  activeSubjectId: string | null
}

export function LibrarySubjectsPanel({
  subjects,
  notebooks,
  onAssignSubject,
  onAddSubject,
  onFilterSubject,
  activeSubjectId,
}: LibrarySubjectsPanelProps) {
  const [showAdd, setShowAdd] = useState(false)
  const [label, setLabel] = useState('')
  const [emoji, setEmoji] = useState('📚')
  const [color, setColor] = useState(FOLDER_COLORS[0])

  const countFor = (id: string) => notebooks.filter((n) => n.subjectId === id).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-forma-muted">
          Matières ({subjects.length})
        </h2>
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="text-xs px-3 py-1.5 bg-forma-accent text-white rounded-lg"
        >
          + Matière
        </button>
      </div>

      {showAdd && (
        <GlassPanel variant="surface" className="p-4 space-y-3">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Nom de la matière"
            className="w-full border border-forma-border rounded-lg px-3 py-1.5 text-sm"
          />
          <div className="flex flex-wrap gap-1">
            {FOLDER_EMOJIS.slice(0, 10).map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={`w-8 h-8 rounded-lg text-lg ${
                  emoji === e ? 'ring-2 ring-forma-accent bg-forma-accent/10' : 'hover:bg-white/30'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {FOLDER_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full border-2 ${
                  color === c ? 'border-forma-accent scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button
            type="button"
            disabled={!label.trim()}
            className="text-sm px-4 py-1.5 bg-forma-accent text-white rounded-lg disabled:opacity-40"
            onClick={async () => {
              await onAddSubject(label.trim(), emoji, color)
              setLabel('')
              setShowAdd(false)
            }}
          >
            Créer
          </button>
        </GlassPanel>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => onFilterSubject(null)}
          className={`p-4 rounded-xl border text-left forma-glass-card ${
            activeSubjectId === null ? 'ring-2 ring-forma-accent' : ''
          }`}
        >
          <span className="text-2xl">📓</span>
          <span className="block font-medium mt-1">Tous</span>
          <span className="text-xs text-forma-muted">{notebooks.length} carnets</span>
        </button>
        {subjects.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onFilterSubject(s.id)}
            className={`p-4 rounded-xl border text-left transition-all ${
              activeSubjectId === s.id ? 'ring-2 ring-forma-accent' : 'forma-glass-card border-forma-border'
            }`}
            style={{ backgroundColor: `${s.color}12` }}
          >
            <span className="text-2xl">{s.emoji}</span>
            <span className="block font-medium mt-1 truncate">{s.label}</span>
            <span className="text-xs text-forma-muted">{countFor(s.id)} carnet{countFor(s.id) !== 1 ? 's' : ''}</span>
          </button>
        ))}
      </div>

      {activeSubjectId && (
        <section>
          <h3 className="text-sm font-medium text-forma-muted mb-2">
            Assigner une matière aux carnets sans matière
          </h3>
          <ul className="space-y-1">
            {notebooks
              .filter((n) => !n.subjectId || n.subjectId !== activeSubjectId)
              .slice(0, 12)
              .map((nb) => (
                <li key={nb.id} className="flex items-center gap-2 text-sm">
                  <span className="truncate flex-1">{nb.name}</span>
                  <button
                    type="button"
                    className="text-xs text-forma-accent shrink-0"
                    onClick={() => onAssignSubject(nb.id, activeSubjectId)}
                  >
                    Assigner
                  </button>
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  )
}
