import { useState } from 'react'
import useAppStore from '@/stores/useAppStore'
import { ANIM_TYPE_LABELS } from '@/config/appearance'

export default function VisualProfilesSection({ T }) {
  const {
    visualProfiles, activeVisualProfileId,
    createVisualProfile, renameVisualProfile, applyVisualProfile,
    duplicateVisualProfile, deleteVisualProfile, setDefaultVisualProfile,
    saveCurrentAsVisualProfile, addNotification,
  } = useAppStore()

  const [newName, setNewName] = useState('')

  const handleCreate = () => {
    const name = newName.trim() || `Profil ${visualProfiles.length + 1}`
    saveCurrentAsVisualProfile(name)
    setNewName('')
    addNotification(`Profil « ${name} » créé`, 'success')
  }

  const handleRename = (id, current) => {
    const name = prompt('Nouveau nom :', current)
    if (!name?.trim()) return
    renameVisualProfile(id, name.trim())
    addNotification('Profil renommé', 'success')
  }

  const handleApply = (id, name) => {
    applyVisualProfile(id)
    addNotification(`Profil « ${name} » appliqué`, 'success')
  }

  const handleDuplicate = (id) => {
    const copy = duplicateVisualProfile(id)
    if (copy) addNotification(`Profil dupliqué : ${copy.name}`, 'success')
  }

  const handleDelete = (id, name) => {
    if (!confirm(`Supprimer le profil « ${name} » ?`)) return
    deleteVisualProfile(id)
    addNotification('Profil supprimé', 'success')
  }

  const summary = (p) => {
    const s = p.settings || {}
    const anim = s.animType ? (ANIM_TYPE_LABELS[s.animType] || s.animType) : 'défaut'
    return `${s.appearanceMode || 'light'} · ${s.themeId || '—'} · ${s.animationsEnabled ? anim : 'sans anim'}`
  }

  return (
    <div style={card(T)}>
      <h3 style={sectionTitle}>Profils d&apos;apparence</h3>
      <p style={hint}>
        Sauvegardez des combinaisons thème, fond, animation et police. Créez, dupliquez ou appliquez un profil en un clic.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nom du nouveau profil…"
          style={{
            flex: 1, minWidth: 160, padding: '8px 10px', borderRadius: 8,
            border: `1px solid ${T.border}`, background: T.bg, color: T.ink, fontSize: 12,
          }}
        />
        <button type="button" onClick={handleCreate} style={primaryBtn(T)}>
          + Sauver l&apos;actuel
        </button>
        <button type="button" onClick={() => {
          const name = prompt('Nom du profil vide :', 'Nouveau profil')
          if (!name?.trim()) return
          createVisualProfile(name.trim())
          addNotification('Profil créé', 'success')
        }} style={ghostBtn(T)}>
          Profil vide
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visualProfiles.map((p) => {
          const active = p.id === activeVisualProfileId
          return (
            <div key={p.id} style={{
              padding: '10px 12px', borderRadius: 10,
              border: `1px solid ${active ? T.accent : T.border}`,
              background: active ? `${T.accent}12` : T.bg,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 13, color: T.ink, flex: 1 }}>{p.name}</strong>
                {p.isDefault && <span style={badge(T)}>Défaut</span>}
                {active && <span style={{ ...badge(T), background: `${T.accent}33` }}>Actif</span>}
              </div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{summary(p)}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                <MiniBtn T={T} onClick={() => handleApply(p.id, p.name)}>Appliquer</MiniBtn>
                <MiniBtn T={T} onClick={() => handleRename(p.id, p.name)}>Renommer</MiniBtn>
                <MiniBtn T={T} onClick={() => handleDuplicate(p.id)}>Dupliquer</MiniBtn>
                <MiniBtn T={T} onClick={() => setDefaultVisualProfile(p.id)}>Défaut</MiniBtn>
                <MiniBtn T={T} danger onClick={() => handleDelete(p.id, p.name)}>Supprimer</MiniBtn>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MiniBtn({ children, onClick, T, danger }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer',
      border: `1px solid ${danger ? '#e9456044' : T.border}`,
      background: danger ? '#e9456010' : T.surface,
      color: danger ? '#e94560' : T.ink,
    }}>
      {children}
    </button>
  )
}

const sectionTitle = { margin: '0 0 12px', fontSize: 14, fontWeight: 700 }
const hint = { margin: '0 0 12px', fontSize: 12, color: '#8b95a8', lineHeight: 1.45 }
const card = (T) => ({
  background: T.surface || '#151820',
  border: `1px solid ${T.border || '#2a3144'}`,
  borderRadius: 12,
  padding: 16,
  marginBottom: 16,
})
const primaryBtn = (T) => ({
  padding: '8px 12px', borderRadius: 8, border: 'none', background: T.accent,
  color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
})
const ghostBtn = (T) => ({
  padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.border}`,
  background: T.surface, color: T.ink, fontSize: 12, fontWeight: 600, cursor: 'pointer',
})
const badge = (T) => ({
  fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
  background: `${T.accent}22`, color: T.accent,
})
