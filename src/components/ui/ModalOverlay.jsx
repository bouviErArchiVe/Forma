import { TOKENS } from '@/theme/tokens'

/** Backdrop blur + slot animé pour modales FORMA */
export default function ModalOverlay({
  children,
  onClose,
  zIndex = TOKENS.zIndex.modal,
  align = 'center',
  style = {},
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.52)',
        backdropFilter: `blur(${TOKENS.blur.md}px)`,
        WebkitBackdropFilter: `blur(${TOKENS.blur.md}px)`,
        display: 'flex',
        alignItems: align === 'center' ? 'center' : align,
        justifyContent: 'center',
        zIndex,
        padding: 16,
        ...style,
      }}
    >
      <div className="forma-animate-scale" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '100%' }}>
        {children}
      </div>
    </div>
  )
}
