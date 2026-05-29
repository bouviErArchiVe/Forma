import { useEffect } from 'react'
import { useConfirmStore } from '../stores/confirmStore'

export function ConfirmDialog() {
  const { open, title, message, confirmLabel, danger, answer } = useConfirmStore()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        answer(false)
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        answer(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, answer])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 forma-animate-in"
      onClick={() => answer(false)}
    >
      <div
        className="forma-glass-modal max-w-sm w-full p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold mb-2 text-forma-text">{title}</h3>
        <p className="text-sm text-forma-muted mb-5 whitespace-pre-wrap">{message}</p>
        <div className="flex gap-2">
          <button
            type="button"
            className="flex-1 py-2 forma-glass-btn rounded-xl text-sm"
            onClick={() => answer(false)}
          >
            Annuler
          </button>
          <button
            type="button"
            className={`flex-1 py-2 rounded-xl text-sm text-white ${
              danger ? 'forma-glass-btn-danger' : 'forma-glass-btn-accent'
            }`}
            onClick={() => answer(true)}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
