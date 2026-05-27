import { useMemo, useState } from 'react'
import ModalOverlay from '@/components/ui/ModalOverlay'
import { FLB_DARK } from '@/lib/formalibrary/constants'
import { listInternalSources } from '@/lib/formalibrary/import'

const TABS = [
  { id: 'files', label: 'Fichiers' },
  { id: 'doc', label: 'FormaDoc' },
  { id: 'sheet', label: 'FormaTab' },
]

export default function LibraryImportModal({
  open, onClose, onImportFiles, onImportInternal, importing,
}) {
  const [tab, setTab] = useState('files')
  const [dragOver, setDragOver] = useState(false)
  const sources = useMemo(() => (open ? listInternalSources() : {}), [open])

  if (!open) return null

  const internalItems = tab === 'files' ? [] : (sources[tab] || [])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const files = e.dataTransfer?.files
    if (files?.length) onImportFiles?.(files)
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{
        width: 'min(540px, 92vw)', maxHeight: '75vh', background: FLB_DARK.surface,
        borderRadius: 12, border: `1px solid ${FLB_DARK.border}`, display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '16px 18px', borderBottom: `1px solid ${FLB_DARK.border}` }}>
          <h3 style={{ margin: 0, color: FLB_DARK.ink, fontSize: 16 }}>Importer dans FormaLibrary</h3>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: FLB_DARK.muted }}>
            PNG, JPG, PDF, SVG, DWG — import massif avec classement automatique
          </p>
        </div>

        <div style={{ display: 'flex', gap: 4, padding: '10px 12px', borderBottom: `1px solid ${FLB_DARK.border}`, flexWrap: 'wrap' }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              style={{
                padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: tab === t.id ? FLB_DARK.accent : FLB_DARK.panel,
                color: tab === t.id ? '#1a1e28' : FLB_DARK.muted, fontSize: 12, fontWeight: tab === t.id ? 700 : 400,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {tab === 'files' ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragOver ? FLB_DARK.accent : FLB_DARK.border}`,
                borderRadius: 12, padding: 32, textAlign: 'center',
                background: dragOver ? `${FLB_DARK.accent}18` : FLB_DARK.panel,
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 8 }}>📥</div>
              <p style={{ color: FLB_DARK.ink, fontSize: 14, margin: '0 0 8px' }}>
                Glissez vos fichiers ici
              </p>
              <p style={{ color: FLB_DARK.muted, fontSize: 12, marginBottom: 16 }}>
                ou sélectionnez plusieurs fichiers à la fois
              </p>
              <label style={{
                display: 'inline-block', padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                background: FLB_DARK.accent, color: '#1a1e28', fontWeight: 600, fontSize: 13,
              }}>
                {importing ? 'Import en cours…' : 'Parcourir…'}
                <input
                  type="file"
                  multiple
                  accept=".png,.jpg,.jpeg,.webp,.svg,.pdf,.dwg,.dxf"
                  style={{ display: 'none' }}
                  disabled={importing}
                  onChange={(e) => {
                    if (e.target.files?.length) onImportFiles?.(e.target.files)
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
          ) : (
            <>
              {internalItems.length === 0 && (
                <p style={{ color: FLB_DARK.muted, fontSize: 13, textAlign: 'center', padding: 24 }}>
                  Aucun élément disponible
                </p>
              )}
              {internalItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { onImportInternal?.(item); onClose() }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px',
                    marginBottom: 4, borderRadius: 8, border: `1px solid ${FLB_DARK.border}`,
                    background: FLB_DARK.panel, color: FLB_DARK.ink, cursor: 'pointer', fontSize: 13,
                  }}
                >
                  {item.name}
                </button>
              ))}
            </>
          )}
        </div>

        <div style={{ padding: 12, borderTop: `1px solid ${FLB_DARK.border}`, textAlign: 'right' }}>
          <button type="button" onClick={onClose} style={btnStyle}>Fermer</button>
        </div>
      </div>
    </ModalOverlay>
  )
}

const btnStyle = {
  padding: '8px 16px', borderRadius: 6, border: `1px solid ${FLB_DARK.border}`,
  background: FLB_DARK.panel, color: FLB_DARK.ink, cursor: 'pointer', fontSize: 13,
}
