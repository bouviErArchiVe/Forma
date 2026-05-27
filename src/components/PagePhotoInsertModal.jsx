import { useState } from 'react'
import ModalOverlay from '@/components/ui/ModalOverlay'
import GlassPanel from '@/components/ui/GlassPanel'
import GlassButton from '@/components/ui/GlassButton'
import { PAGE_INSERT_LABELS } from '@/lib/pages/insert'
import { TOKENS } from '@/theme/tokens'
import { rgbaFromHex } from '@/theme/glass'

const POSITIONS = ['start', 'after-current', 'end']

export default function PagePhotoInsertModal({
  T,
  open,
  previewUrl,
  fileName,
  currentPage,
  pagesCount,
  onConfirm,
  onClose,
}) {
  const [position, setPosition] = useState('after-current')
  const [busy, setBusy] = useState(false)

  if (!open || !previewUrl) return null

  const handleConfirm = async () => {
    setBusy(true)
    try {
      await onConfirm(position)
    } finally {
      setBusy(false)
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <GlassPanel T={T} variant="modal" style={{ padding: 22, width: 420, maxWidth: '94vw' }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 17, marginBottom: 6 }}>
          Nouvelle page avec photo
        </div>
        <div style={{ fontSize: 11, color: T.muted, marginBottom: 14, lineHeight: 1.45 }}>
          {fileName || 'Image'} · page actuelle {currentPage}/{pagesCount}
        </div>

        <div style={{
          borderRadius: TOKENS.radius.lg,
          overflow: 'hidden',
          border: `1px solid ${rgbaFromHex(T.border, 0.4)}`,
          marginBottom: 16,
          maxHeight: 180,
          background: rgbaFromHex(T.bg, 0.5),
        }}>
          <img
            src={previewUrl}
            alt=""
            style={{ width: '100%', maxHeight: 180, objectFit: 'contain', display: 'block' }}
          />
        </div>

        <div style={{ fontSize: 9, fontWeight: 800, color: T.muted, letterSpacing: 0.8, marginBottom: 8 }}>
          POSITION
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
          {POSITIONS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setPosition(id)}
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: `1px solid ${position === id ? T.accent : T.border}`,
                background: position === id ? `${T.accent}12` : T.bg,
                color: position === id ? T.accent : T.ink,
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: 12,
                fontWeight: position === id ? 700 : 500,
              }}
            >
              {PAGE_INSERT_LABELS[id]}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <GlassButton T={T} onClick={onClose} style={{ flex: 1, padding: '10px 0', fontSize: 11 }}>
            Annuler
          </GlassButton>
          <GlassButton T={T} accent onClick={handleConfirm} disabled={busy} style={{ flex: 1, padding: '10px 0', fontSize: 11, fontWeight: 800 }}>
            {busy ? 'Création…' : 'Créer la page'}
          </GlassButton>
        </div>
      </GlassPanel>
    </ModalOverlay>
  )
}
