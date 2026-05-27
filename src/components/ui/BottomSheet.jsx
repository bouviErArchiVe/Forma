import ModalOverlay from '@/components/ui/ModalOverlay'
import GlassPanel from '@/components/ui/GlassPanel'
import { rgbaFromHex } from '@/theme/glass'
import { TOKENS } from '@/theme/tokens'

/** Bottom sheet iOS — réutilise ModalOverlay variant sheet. */
export default function BottomSheet({
  T,
  open,
  onClose,
  title,
  children,
  maxWidth = 560,
}) {
  if (!open) return null

  return (
    <ModalOverlay variant="sheet" onClose={onClose}>
      <GlassPanel
        T={T}
        variant="modal"
        style={{
          padding: '8px 20px 20px',
          width: '100%',
          maxWidth,
          maxHeight: 'min(88vh, 92dvh)',
          overflowY: 'auto',
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }}
      >
        <div
          style={{
            width: 40,
            height: 4,
            borderRadius: 99,
            background: rgbaFromHex(T.border, 0.65),
            margin: '6px auto 14px',
          }}
          aria-hidden
        />
        {title && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
            gap: 10,
          }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16, color: T.ink }}>
              {title}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="forma-btn-glass"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 22, lineHeight: 1, padding: '2px 6px' }}
            >
              ×
            </button>
          </div>
        )}
        {children}
      </GlassPanel>
    </ModalOverlay>
  )
}
