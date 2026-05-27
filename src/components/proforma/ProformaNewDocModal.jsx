import { PAGE_FORMATS } from '@/lib/pageFormats'
import { PF_PRESETS } from '@/lib/proforma/constants'
import { PF_DARK } from '@/lib/proforma/constants'
import ModalOverlay from '@/components/ui/ModalOverlay'
import GlassPanel from '@/components/ui/GlassPanel'

export default function ProformaNewDocModal({ open, onClose, onCreate }) {
  if (!open) return null

  return (
    <ModalOverlay onClose={onClose}>
      <GlassPanel
        T={{ ink: PF_DARK.ink, muted: PF_DARK.muted, border: PF_DARK.border, bg: PF_DARK.panel, surface: PF_DARK.surface, accent: PF_DARK.accent }}
        variant="modal"
        style={{ padding: 22, width: 480, maxWidth: '94vw', maxHeight: '85vh', overflowY: 'auto' }}
      >
        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, color: PF_DARK.ink, marginBottom: 4 }}>
          Nouveau Proforma
        </div>
        <div style={{ fontSize: 11, color: PF_DARK.muted, marginBottom: 16 }}>
          Dessin de précision — architecture & design
        </div>

        <div style={{ fontSize: 10, fontWeight: 800, color: PF_DARK.muted, marginBottom: 8 }}>PRÉRÉGLAGES</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
          {PF_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onCreate({ presetId: p.id, formatId: p.formatId, name: p.label })}
              style={cardBtn}
            >
              <div style={{ fontWeight: 700, fontSize: 12 }}>{p.label}</div>
              <div style={{ fontSize: 9, color: PF_DARK.muted, marginTop: 2 }}>{p.formatId.toUpperCase()}</div>
            </button>
          ))}
        </div>

        <div style={{ fontSize: 10, fontWeight: 800, color: PF_DARK.muted, marginBottom: 8 }}>FORMATS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 16 }}>
          {PAGE_FORMATS.filter((f) => !f.custom).slice(0, 12).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onCreate({ formatId: f.id, name: `Proforma ${f.l}` })}
              style={{ ...cardBtn, padding: '8px 6px' }}
            >
              <div style={{ fontWeight: 700, fontSize: 11 }}>{f.l}</div>
            </button>
          ))}
        </div>

        <button type="button" onClick={onClose} style={{
          width: '100%',
          padding: '9px 0',
          borderRadius: 8,
          border: `1px solid ${PF_DARK.border}`,
          background: 'transparent',
          color: PF_DARK.muted,
          cursor: 'pointer',
          fontSize: 12,
        }}>
          Annuler
        </button>
      </GlassPanel>
    </ModalOverlay>
  )
}

const cardBtn = {
  padding: '12px 10px',
  borderRadius: 10,
  border: `1px solid ${PF_DARK.border}`,
  background: PF_DARK.surface,
  color: PF_DARK.ink,
  cursor: 'pointer',
  textAlign: 'left',
}
