import { useEffect } from 'react'
import { useConfirmStore } from '../stores/confirmStore'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'

export function ConfirmDialog() {
  const { open, title, message, confirmLabel, danger, answer } = useConfirmStore()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') { e.preventDefault(); answer(true) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, answer])

  return (
    <Modal open={open} onClose={() => answer(false)}>
      <div className="p-5">
        <h3 className="font-semibold text-base mb-1.5">{title}</h3>
        <p className="text-sm text-forma-muted mb-5 whitespace-pre-wrap leading-relaxed">{message}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="md" className="flex-1" onClick={() => answer(false)}>
            Annuler
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            size="md"
            className="flex-1"
            onClick={() => answer(true)}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
