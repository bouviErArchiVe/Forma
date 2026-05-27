import { useEffect, useState } from 'react'
import { FC_CATEGORIES, FC_PRESETS, FC_PRIORITIES, FC_STATUSES, FC_REMINDER_OFFSETS, FC_DARK } from '@/lib/formatcal/constants'
import { createEvent, createChecklistItem, getCategoryMeta } from '@/lib/formatcal/model'
import { fmtDate, fmtTime } from '@/lib/formatcal/dates'
import ModalOverlay from '@/components/ui/ModalOverlay'
import GlassPanel from '@/components/ui/GlassPanel'

const fieldStyle = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 8,
  border: `1px solid ${FC_DARK.border}`,
  background: FC_DARK.surface,
  color: FC_DARK.ink,
  fontSize: 12,
  boxSizing: 'border-box',
}

export default function FormatcalEventModal({ open, event, defaultDate, onClose, onSave, onDelete }) {
  const [draft, setDraft] = useState(null)

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

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))
  const cat = getCategoryMeta(draft.category)

  const applyPreset = (preset) => {
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
    onSave?.({ ...draft, updatedAt: Date.now() })
    onClose?.()
  }

  return (
    <ModalOverlay onClose={onClose}>
      <GlassPanel
        T={{ ink: FC_DARK.ink, muted: FC_DARK.muted, border: FC_DARK.border, bg: FC_DARK.panel, surface: FC_DARK.surface, accent: FC_DARK.accent }}
        variant="modal"
        style={{ padding: 22, width: 520, maxWidth: '96vw', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 17, marginBottom: 14 }}>
          {event ? 'Modifier l\'événement' : 'Nouvel événement'}
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {FC_PRESETS.slice(0, 8).map((p) => (
            <button key={p.id} type="button" onClick={() => applyPreset(p)} style={chipBtn}>
              {p.icon} {p.label}
            </button>
          ))}
        </div>

        <label style={labelStyle}>Titre
          <input value={draft.title} onChange={(e) => set({ title: e.target.value })} style={{ ...fieldStyle, marginTop: 4 }} />
        </label>

        <label style={labelStyle}>Description
          <textarea value={draft.description} onChange={(e) => set({ description: e.target.value })} rows={3} style={{ ...fieldStyle, marginTop: 4, resize: 'vertical' }} />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          <label style={labelStyle}>Début
            <input type="datetime-local" value={toLocalInput(draft.startAt)} onChange={(e) => set({ startAt: fromLocalInput(e.target.value) })} style={{ ...fieldStyle, marginTop: 4 }} />
          </label>
          <label style={labelStyle}>Fin
            <input type="datetime-local" value={toLocalInput(draft.endAt)} onChange={(e) => set({ endAt: fromLocalInput(e.target.value) })} style={{ ...fieldStyle, marginTop: 4 }} />
          </label>
        </div>

        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <input type="checkbox" checked={!!draft.allDay} onChange={(e) => set({ allDay: e.target.checked })} />
          Journée entière
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          <label style={labelStyle}>Catégorie
            <select value={draft.category} onChange={(e) => {
              const c = getCategoryMeta(e.target.value)
              set({ category: e.target.value, color: c.color, icon: c.icon })
            }} style={{ ...fieldStyle, marginTop: 4 }}>
              {FC_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select>
          </label>
          <label style={labelStyle}>Couleur
            <input type="color" value={draft.color || cat.color} onChange={(e) => set({ color: e.target.value })} style={{ width: '100%', height: 32, marginTop: 4 }} />
          </label>
          <label style={labelStyle}>Priorité
            <select value={draft.priority} onChange={(e) => set({ priority: e.target.value })} style={{ ...fieldStyle, marginTop: 4 }}>
              {FC_PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </label>
          <label style={labelStyle}>Statut
            <select value={draft.status} onChange={(e) => set({ status: e.target.value, completed: e.target.value === 'done' })} style={{ ...fieldStyle, marginTop: 4 }}>
              {FC_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </label>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: FC_DARK.muted, marginBottom: 6 }}>RAPPELS</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {FC_REMINDER_OFFSETS.map((r) => {
              const on = (draft.reminderOffsets || []).includes(r.id)
              return (
                <button key={r.id} type="button" onClick={() => {
                  const cur = draft.reminderOffsets || []
                  set({ reminderOffsets: on ? cur.filter((x) => x !== r.id) : [...cur, r.id] })
                }} style={{ ...chipBtn, background: on ? `${FC_DARK.accent}33` : FC_DARK.surface, borderColor: on ? FC_DARK.accent : FC_DARK.border }}>
                  {r.label}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: FC_DARK.muted }}>CHECKLIST</div>
            <button type="button" onClick={() => set({ checklist: [...(draft.checklist || []), createChecklistItem('')] })} style={chipBtn}>+ Tâche</button>
          </div>
          {(draft.checklist || []).map((item) => (
            <div key={item.id} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
              <input type="checkbox" checked={item.done} onChange={() => set({ checklist: draft.checklist.map((c) => c.id === item.id ? { ...c, done: !c.done } : c) })} />
              <input value={item.text} onChange={(e) => set({ checklist: draft.checklist.map((c) => c.id === item.id ? { ...c, text: e.target.value } : c) })} style={{ ...fieldStyle, flex: 1 }} />
              <button type="button" onClick={() => set({ checklist: draft.checklist.filter((c) => c.id !== item.id) })} style={{ background: 'none', border: 'none', color: FC_DARK.danger, cursor: 'pointer' }}>×</button>
            </div>
          ))}
        </div>

        <label style={{ ...labelStyle, marginTop: 10 }}>Tags (virgules)
          <input value={(draft.tags || []).join(', ')} onChange={(e) => set({ tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })} style={{ ...fieldStyle, marginTop: 4 }} />
        </label>

        <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
          <button type="button" onClick={handleSave} style={{ ...primaryBtn, flex: 1 }}>Enregistrer</button>
          <button type="button" onClick={onClose} style={ghostBtn}>Annuler</button>
          {event && onDelete && (
            <button type="button" onClick={() => { onDelete(event.id); onClose() }} style={{ ...ghostBtn, color: FC_DARK.danger }}>Supprimer</button>
          )}
        </div>
      </GlassPanel>
    </ModalOverlay>
  )
}

function toLocalInput(ts) {
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromLocalInput(val) {
  return new Date(val).getTime()
}

const labelStyle = { display: 'block', fontSize: 10, fontWeight: 700, color: FC_DARK.muted, marginBottom: 2 }
const chipBtn = { padding: '5px 8px', fontSize: 10, borderRadius: 6, border: `1px solid ${FC_DARK.border}`, background: FC_DARK.surface, color: FC_DARK.ink, cursor: 'pointer' }
const primaryBtn = { padding: '10px 16px', borderRadius: 8, border: 'none', background: FC_DARK.accent, color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }
const ghostBtn = { padding: '10px 14px', borderRadius: 8, border: `1px solid ${FC_DARK.border}`, background: 'transparent', color: FC_DARK.muted, fontSize: 12, cursor: 'pointer' }
