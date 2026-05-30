import { useEffect, useState } from 'react'
import type { FormaCalEvent } from '../../types'
import {
  FC_CATEGORIES,
  FC_PRESETS,
  FC_PRIORITIES,
  FC_REMINDER_OFFSETS,
  FC_STATUSES,
} from '../../lib/formatcal/constants'
import { createChecklistItem, createEvent, getCategoryMeta } from '../../lib/formatcal/model'
import { GlassButton } from '../ui/GlassButton'

interface FormatcalEventModalProps {
  open: boolean
  event: FormaCalEvent | null
  defaultDate: number | null
  onClose: () => void
  onSave: (ev: FormaCalEvent) => void
  onDelete?: (id: string) => void
}

export function FormatcalEventModal({
  open,
  event,
  defaultDate,
  onClose,
  onSave,
  onDelete,
}: FormatcalEventModalProps) {
  const [draft, setDraft] = useState<FormaCalEvent | null>(null)

  useEffect(() => {
    if (!open) return
    if (event) {
      setDraft({ ...event })
    } else {
      const day = defaultDate ? new Date(defaultDate) : new Date()
      day.setHours(9, 0, 0, 0)
      setDraft(createEvent({ startAt: day.getTime(), endAt: day.getTime() + 3600000 }))
    }
  }, [open, event, defaultDate])

  if (!open || !draft) return null

  const set = (patch: Partial<FormaCalEvent>) => setDraft((d) => (d ? { ...d, ...patch } : d))
  const cat = getCategoryMeta(draft.category)

  const applyPreset = (preset: (typeof FC_PRESETS)[number]) => {
    const meta = getCategoryMeta(preset.category)
    set({
      presetId: preset.id,
      title: preset.label,
      category: preset.category,
      icon: preset.icon,
      color: meta.color,
      endAt: draft.startAt + preset.durationMin * 60000,
    })
  }

  const handleSave = () => {
    onSave({ ...draft, updatedAt: Date.now() })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="forma-glass-modal max-w-lg w-full max-h-[90vh] overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-bold text-lg mb-3">
          {event ? "Modifier l'événement" : 'Nouvel événement'}
        </h2>

        <div className="flex gap-1.5 flex-wrap mb-3">
          {FC_PRESETS.slice(0, 8).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p)}
              className="px-2 py-1 text-[10px] rounded-md border border-forma-border bg-forma-surface"
            >
              {p.icon} {p.label}
            </button>
          ))}
        </div>

        <label className="block text-[10px] font-bold text-forma-muted mb-1">
          Titre
          <input
            value={draft.title}
            onChange={(e) => set({ title: e.target.value })}
            className="w-full mt-1 px-2.5 py-2 rounded-lg border border-forma-border bg-forma-surface text-sm"
          />
        </label>

        <label className="block text-[10px] font-bold text-forma-muted mt-3 mb-1">
          Description
          <textarea
            value={draft.description}
            onChange={(e) => set({ description: e.target.value })}
            rows={3}
            className="w-full mt-1 px-2.5 py-2 rounded-lg border border-forma-border bg-forma-surface text-sm resize-y"
          />
        </label>

        <div className="grid grid-cols-2 gap-2.5 mt-3">
          <label className="block text-[10px] font-bold text-forma-muted">
            Début
            <input
              type="datetime-local"
              value={toLocalInput(draft.startAt)}
              onChange={(e) => set({ startAt: fromLocalInput(e.target.value) })}
              className="w-full mt-1 px-2.5 py-2 rounded-lg border border-forma-border bg-forma-surface text-sm"
            />
          </label>
          <label className="block text-[10px] font-bold text-forma-muted">
            Fin
            <input
              type="datetime-local"
              value={toLocalInput(draft.endAt)}
              onChange={(e) => set({ endAt: fromLocalInput(e.target.value) })}
              className="w-full mt-1 px-2.5 py-2 rounded-lg border border-forma-border bg-forma-surface text-sm"
            />
          </label>
        </div>

        <label className="flex items-center gap-2 mt-2 text-sm">
          <input
            type="checkbox"
            checked={!!draft.allDay}
            onChange={(e) => set({ allDay: e.target.checked })}
          />
          Journée entière
        </label>

        <div className="grid grid-cols-2 gap-2.5 mt-3">
          <label className="block text-[10px] font-bold text-forma-muted">
            Catégorie
            <select
              value={draft.category}
              onChange={(e) => {
                const c = getCategoryMeta(e.target.value)
                set({ category: e.target.value as FormaCalEvent['category'], color: c.color, icon: c.icon })
              }}
              className="w-full mt-1 px-2.5 py-2 rounded-lg border border-forma-border bg-forma-surface text-sm"
            >
              {FC_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[10px] font-bold text-forma-muted">
            Couleur
            <input
              type="color"
              value={draft.color || cat.color}
              onChange={(e) => set({ color: e.target.value })}
              className="w-full h-8 mt-1"
            />
          </label>
          <label className="block text-[10px] font-bold text-forma-muted">
            Priorité
            <select
              value={draft.priority}
              onChange={(e) => set({ priority: e.target.value as FormaCalEvent['priority'] })}
              className="w-full mt-1 px-2.5 py-2 rounded-lg border border-forma-border bg-forma-surface text-sm"
            >
              {FC_PRIORITIES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[10px] font-bold text-forma-muted">
            Statut
            <select
              value={draft.status}
              onChange={(e) =>
                set({
                  status: e.target.value as FormaCalEvent['status'],
                  completed: e.target.value === 'done',
                })
              }
              className="w-full mt-1 px-2.5 py-2 rounded-lg border border-forma-border bg-forma-surface text-sm"
            >
              {FC_STATUSES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-3">
          <div className="text-[10px] font-bold text-forma-muted mb-1.5">RAPPELS</div>
          <div className="flex flex-wrap gap-1.5">
            {FC_REMINDER_OFFSETS.map((r) => {
              const on = (draft.reminderOffsets || []).includes(r.id)
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    const cur = draft.reminderOffsets || []
                    set({
                      reminderOffsets: on ? cur.filter((x) => x !== r.id) : [...cur, r.id],
                    })
                  }}
                  className={`px-2 py-1 text-[10px] rounded-md border ${on ? 'border-forma-accent bg-forma-accent/20' : 'border-forma-border bg-forma-surface'}`}
                >
                  {r.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-3">
          <div className="flex justify-between items-center mb-2">
            <div className="text-[10px] font-bold text-forma-muted">CHECKLIST</div>
            <button
              type="button"
              onClick={() =>
                set({ checklist: [...(draft.checklist || []), createChecklistItem('')] })
              }
              className="px-2 py-1 text-[10px] rounded-md border border-forma-border"
            >
              + Tâche
            </button>
          </div>
          {(draft.checklist || []).map((item) => (
            <div key={item.id} className="flex gap-2 mb-1.5 items-center">
              <input
                type="checkbox"
                checked={item.done}
                onChange={() =>
                  set({
                    checklist: draft.checklist.map((c) =>
                      c.id === item.id ? { ...c, done: !c.done } : c,
                    ),
                  })
                }
              />
              <input
                value={item.text}
                onChange={(e) =>
                  set({
                    checklist: draft.checklist.map((c) =>
                      c.id === item.id ? { ...c, text: e.target.value } : c,
                    ),
                  })
                }
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-forma-border bg-forma-surface text-sm"
              />
              <button
                type="button"
                onClick={() =>
                  set({ checklist: draft.checklist.filter((c) => c.id !== item.id) })
                }
                className="text-red-500"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <label className="block text-[10px] font-bold text-forma-muted mt-3">
          Tags (virgules)
          <input
            value={(draft.tags || []).join(', ')}
            onChange={(e) =>
              set({
                tags: e.target.value
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean),
              })
            }
            className="w-full mt-1 px-2.5 py-2 rounded-lg border border-forma-border bg-forma-surface text-sm"
          />
        </label>

        <div className="flex gap-2 mt-4 flex-wrap">
          <GlassButton accent className="flex-1" onClick={handleSave}>
            Enregistrer
          </GlassButton>
          <GlassButton onClick={onClose}>Annuler</GlassButton>
          {event && onDelete && (
            <button
              type="button"
              className="text-sm text-red-600 px-3"
              onClick={() => {
                onDelete(event.id)
                onClose()
              }}
            >
              Supprimer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function toLocalInput(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromLocalInput(val: string): number {
  return new Date(val).getTime()
}
