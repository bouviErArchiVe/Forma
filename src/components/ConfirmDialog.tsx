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
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4"
      onClick={() => answer(false)}
    >
      <div
        className="bg-forma-surface dark:bg-gray-900 rounded-xl shadow-xl max-w-sm w-full p-5 border border-forma-border"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold mb-2">{title}</h3>
        <p className="text-sm text-forma-muted mb-5 whitespace-pre-wrap">{message}</p>
        <div className="flex gap-2">
          <button
            type="button"
            className="flex-1 py-2 border rounded-lg text-sm dark:border-gray-600"
            onClick={() => answer(false)}
          >
            Annuler
          </button>
          <button
            type="button"
            className={`flex-1 py-2 rounded-lg text-sm text-white ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-forma-accent hover:bg-forma-accent-hover'
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
