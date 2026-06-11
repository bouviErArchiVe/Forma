import { useEffect, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  /** Max-width Tailwind class, default max-w-sm */
  maxWidth?: string
  className?: string
}

export function Modal({ open, onClose, children, maxWidth = 'max-w-sm', className = '' }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        className={`bg-forma-surface dark:bg-gray-900 rounded-2xl shadow-xl w-full border border-forma-border
          animate-in fade-in zoom-in-95 duration-150 ${maxWidth} ${className}`}
        style={{
          animationTimingFunction: 'cubic-bezier(0.16,1,0.3,1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
