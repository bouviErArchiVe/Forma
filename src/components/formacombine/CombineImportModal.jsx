import { useMemo, useState } from 'react'
import ModalOverlay from '@/components/ui/ModalOverlay'
import { FCMB_DARK } from '@/lib/formacombine/constants'
import { listInternalSources } from '@/lib/formacombine/import'

const TABS = [
  { id: 'proforma', label: 'Proforma' },
  { id: 'formadoc', label: 'FormaDoc' },
  { id: 'formatab', label: 'FormaTab' },
  { id: 'forma', label: 'Pages Forma' },
]

export default function CombineImportModal({ open, onClose, onImportInternal }) {
  const [tab, setTab] = useState('proforma')
  const sources = useMemo(() => (open ? listInternalSources() : {}), [open])

  if (!open) return null

  const items = sources[tab] || []

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{
        width: 'min(520px, 92vw)', maxHeight: '70vh', background: FCMB_DARK.surface,
        borderRadius: 12, border: `1px solid ${FCMB_DARK.border}`, display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '16px 18px', borderBottom: `1px solid ${FCMB_DARK.border}` }}>
          <h3 style={{ margin: 0, color: FCMB_DARK.ink, fontSize: 16 }}>Importer depuis Forma</h3>
        </div>
        <div style={{ display: 'flex', gap: 4, padding: '10px 12px', borderBottom: `1px solid ${FCMB_DARK.border}` }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              style={{
                padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: tab === t.id ? FCMB_DARK.accent : '#222833',
                color: tab === t.id ? '#fff' : FCMB_DARK.muted, fontSize: 12,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {items.length === 0 && (
            <p style={{ color: FCMB_DARK.muted, fontSize: 13, textAlign: 'center', padding: 24 }}>
              Aucun élément disponible
            </p>
          )}
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => { onImportInternal(item); onClose() }}
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px',
                marginBottom: 4, borderRadius: 8, border: `1px solid ${FCMB_DARK.border}`,
                background: '#1e2330', color: FCMB_DARK.ink, cursor: 'pointer', fontSize: 13,
              }}
            >
              {item.name}
            </button>
          ))}
        </div>
        <div style={{ padding: 12, borderTop: `1px solid ${FCMB_DARK.border}`, textAlign: 'right' }}>
          <button type="button" onClick={onClose} style={btnStyle}>Fermer</button>
        </div>
      </div>
    </ModalOverlay>
  )
}

const btnStyle = {
  padding: '8px 16px', borderRadius: 6, border: `1px solid ${FCMB_DARK.border}`,
  background: '#222833', color: '#e8ecf4', cursor: 'pointer', fontSize: 13,
}
