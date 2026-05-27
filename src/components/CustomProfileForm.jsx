import { useState } from 'react'
import { PROFILE_TYPES, buildCustomProfile } from '@/lib/structuralProfiles'
import ProfileSketchCanvas from '@/components/ProfileSketchCanvas'

/** Formulaire création profil perso — dimensions ou dessin à la main. */
export default function CustomProfileForm({ T, onSave, onCancel }) {
  const [mode, setMode] = useState('dims')
  const [draft, setDraft] = useState({ name: '', profileType: 'HEA', w: 100, h: 100, tf: 8, tw: 5, t: 6 })
  const [sketchUrl, setSketchUrl] = useState(null)

  const canSave = mode === 'draw'
    ? draft.name.trim() && sketchUrl
    : draft.name.trim()

  const handleSave = () => {
    if (!canSave) return
    const base = buildCustomProfile(draft)
    onSave?.({
      ...base,
      mode,
      sketchUrl: mode === 'draw' ? sketchUrl : null,
    })
    setDraft({ name: '', profileType: 'HEA', w: 100, h: 100, tf: 8, tw: 5, t: 6 })
    setSketchUrl(null)
    setMode('dims')
  }

  return (
    <div style={{ padding: '6px 8px', borderBottom: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {[['dims', '📐 Dimensions'], ['draw', '✏ Dessin']].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            style={{
              flex: 1,
              padding: '4px 0',
              borderRadius: 7,
              border: `1px solid ${mode === id ? T.accent : T.border}`,
              background: mode === id ? `${T.accent}12` : T.bg,
              color: mode === id ? T.accent : T.muted,
              fontSize: 9,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <input
        value={draft.name}
        onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
        placeholder="Nom du profil"
        style={{
          width: '100%',
          padding: '4px 7px',
          borderRadius: 6,
          border: `1px solid ${T.border}`,
          fontSize: 10,
          background: T.bg,
          color: T.ink,
          boxSizing: 'border-box',
        }}
      />

      {mode === 'dims' ? (
        <>
          <select
            value={draft.profileType}
            onChange={(e) => setDraft((d) => ({ ...d, profileType: e.target.value }))}
            style={{
              width: '100%',
              padding: '4px 7px',
              borderRadius: 6,
              border: `1px solid ${T.border}`,
              fontSize: 10,
              background: T.bg,
              color: T.ink,
            }}
          >
            {PROFILE_TYPES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {[['w', 'Largeur mm'], ['h', 'Hauteur mm'], ['tf', 'Semelle tf'], ['tw', 'Âme tw']].map(([k, l]) => (
              <label key={k} style={{ fontSize: 8, color: T.muted }}>
                {l}
                <input
                  type="number"
                  min={2}
                  value={draft[k]}
                  onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))}
                  style={{
                    display: 'block',
                    width: '100%',
                    marginTop: 2,
                    padding: '3px 5px',
                    borderRadius: 5,
                    border: `1px solid ${T.border}`,
                    fontSize: 9,
                    background: T.bg,
                    color: T.ink,
                    boxSizing: 'border-box',
                  }}
                />
              </label>
            ))}
          </div>
        </>
      ) : (
        <ProfileSketchCanvas T={T} value={sketchUrl} onChange={setSketchUrl} />
      )}

      <div style={{ display: 'flex', gap: 6 }}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '5px 0',
              borderRadius: 7,
              border: `1px solid ${T.border}`,
              background: T.bg,
              color: T.muted,
              fontSize: 10,
              cursor: 'pointer',
            }}
          >
            Annuler
          </button>
        )}
        <button
          type="button"
          disabled={!canSave}
          onClick={handleSave}
          style={{
            flex: 2,
            padding: '5px 0',
            borderRadius: 7,
            border: 'none',
            background: canSave ? T.accent : T.border,
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            cursor: canSave ? 'pointer' : 'not-allowed',
            opacity: canSave ? 1 : 0.7,
          }}
        >
          Enregistrer
        </button>
      </div>
    </div>
  )
}
