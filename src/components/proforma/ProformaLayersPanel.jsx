import { PF_DARK } from '@/lib/proforma/constants'
import { addLayer, deleteLayer, reorderLayers } from '@/lib/proforma/model'

export default function ProformaLayersPanel({ doc, setDoc, activeLayerId, setActiveLayerId, commitDoc }) {
  if (!doc) return null
  const layers = [...(doc.layers || [])].reverse()

  const update = (fn) => {
    commitDoc((prev) => fn(prev), { recordHistory: true })
  }

  return (
    <Panel title="Calques" count={doc.layers.length}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {layers.map((layer) => {
          const realIdx = doc.layers.findIndex((l) => l.id === layer.id)
          const active = layer.id === activeLayerId
          return (
            <div
              key={layer.id}
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                background: active ? `${PF_DARK.accent}18` : PF_DARK.surface,
                border: `1px solid ${active ? PF_DARK.accent : PF_DARK.border}`,
                cursor: 'pointer',
              }}
              onClick={() => setActiveLayerId(layer.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  title={layer.v ? 'Masquer' : 'Afficher'}
                  onClick={(e) => {
                    e.stopPropagation()
                    update((prev) => ({
                      ...prev,
                      layers: prev.layers.map((l) => (l.id === layer.id ? { ...l, v: !l.v } : l)),
                    }))
                  }}
                  style={iconBtn}
                >
                  {layer.v ? '👁' : '🚫'}
                </button>
                <button
                  type="button"
                  title={layer.locked ? 'Déverrouiller' : 'Verrouiller'}
                  onClick={(e) => {
                    e.stopPropagation()
                    update((prev) => ({
                      ...prev,
                      layers: prev.layers.map((l) => (l.id === layer.id ? { ...l, locked: !l.locked } : l)),
                    }))
                  }}
                  style={iconBtn}
                >
                  {layer.locked ? '🔒' : '🔓'}
                </button>
                <input
                  value={layer.n}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    const n = e.target.value
                    commitDoc((prev) => ({
                      ...prev,
                      layers: prev.layers.map((l) => (l.id === layer.id ? { ...l, n } : l)),
                    }), { recordHistory: false })
                  }}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: PF_DARK.ink,
                    fontSize: 11,
                    fontWeight: 600,
                    outline: 'none',
                  }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <span style={{ fontSize: 9, color: PF_DARK.muted }}>Opacité</span>
                <input
                  type="range"
                  min={0.05}
                  max={1}
                  step={0.05}
                  value={layer.opacity ?? 1}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    const opacity = parseFloat(e.target.value)
                    commitDoc((prev) => ({
                      ...prev,
                      layers: prev.layers.map((l) => (l.id === layer.id ? { ...l, opacity } : l)),
                    }), { recordHistory: false })
                  }}
                  style={{ flex: 1 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                <MiniBtn label="↑" title="Monter" onClick={(e) => { e.stopPropagation(); update((p) => reorderLayers(p, realIdx, Math.min(realIdx + 1, p.layers.length - 1))) }} />
                <MiniBtn label="↓" title="Descendre" onClick={(e) => { e.stopPropagation(); update((p) => reorderLayers(p, realIdx, Math.max(realIdx - 1, 0))) }} />
                <MiniBtn label="+" title="Dupliquer" onClick={(e) => {
                  e.stopPropagation()
                  update((p) => {
                    const copy = { ...layer, id: `pf_ly_${Date.now()}`, n: `${layer.n} copie` }
                    const layers = [...p.layers]
                    layers.splice(realIdx + 1, 0, copy)
                    const strokeCopies = p.strokes.filter((s) => s.layerId === layer.id).map((s) => ({ ...s, id: `st_${Date.now()}_${Math.random()}`, layerId: copy.id }))
                    return { ...p, layers, strokes: [...p.strokes, ...strokeCopies] }
                  })
                }} />
                {doc.layers.length > 1 && (
                  <MiniBtn label="🗑" title="Supprimer" onClick={(e) => { e.stopPropagation(); update((p) => deleteLayer(p, layer.id)) }} />
                )}
              </div>
            </div>
          )
        })}
      </div>
      <button
        type="button"
        onClick={() => update((p) => addLayer(p))}
        style={{
          marginTop: 10,
          width: '100%',
          padding: '8px 0',
          borderRadius: 8,
          border: `1px dashed ${PF_DARK.border}`,
          background: 'transparent',
          color: PF_DARK.accent,
          cursor: 'pointer',
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        + Calque
      </button>
    </Panel>
  )
}

function Panel({ title, count, children }) {
  return (
    <div style={{
      background: PF_DARK.panel,
      border: `1px solid ${PF_DARK.border}`,
      borderRadius: 10,
      padding: 12,
      marginBottom: 10,
    }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: PF_DARK.ink, marginBottom: 10, letterSpacing: 0.5 }}>
        {title}{count != null ? ` (${count})` : ''}
      </div>
      {children}
    </div>
  )
}

const iconBtn = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: 12,
  padding: 0,
  width: 22,
}

function MiniBtn({ label, title, onClick }) {
  return (
    <button type="button" title={title} onClick={onClick} style={{
      padding: '2px 6px',
      fontSize: 10,
      borderRadius: 4,
      border: `1px solid ${PF_DARK.border}`,
      background: PF_DARK.surface,
      color: PF_DARK.ink,
      cursor: 'pointer',
    }}>
      {label}
    </button>
  )
}

export { Panel }
