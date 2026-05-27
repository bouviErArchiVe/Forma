import { TOKENS } from '@/theme/tokens'

/** Backdrop blur + slot animé pour modales FORMA */
export default function ModalOverlay({
  children,
  onClose,
  zIndex = TOKENS.zIndex.modal,
  variant = 'center',
  style = {},
}) {
  const isSheet = variant === 'sheet'

  return (
    <div
      className={`forma-modal-backdrop ${isSheet ? 'forma-modal-backdrop--sheet' : 'forma-modal-backdrop--center'}`}
      onClick={onClose}
      style={{
        background: 'rgba(0,0,0,.52)',
        backdropFilter: `blur(${TOKENS.blur.md}px)`,
        WebkitBackdropFilter: `blur(${TOKENS.blur.md}px)`,
        zIndex,
        ...style,
      }}
    >
      <div
        className={`forma-modal-panel ${isSheet ? 'forma-animate-sheet' : 'forma-animate-scale'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
