/**
 * PageAIActionsButton — déclencheur compact pour PageAIActions.
 *
 * Affiche un bouton « FormAI » qui ouvre un popover contenant les actions
 * contextuelles (expliquer / résumer / créer une tâche). Pensé pour les
 * en-têtes de liseuse / document. Local-first : aucune clé requise.
 */
import { useEffect, useRef, useState } from 'react'
import { Icon } from '../ui/Icon'
import { PageAIActions, type PageAIActionsProps } from './PageAIActions'

export function PageAIActionsButton({
  label = 'FormAI',
  className = '',
  ...actionsProps
}: PageAIActionsProps & { label?: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Actions FormAI sur cette page"
        className={
          className
          || 'text-xs px-3 py-1.5 rounded-lg border border-forma-border hover:border-forma-accent/60 text-forma-muted hover:text-forma-accent transition-colors inline-flex items-center gap-1.5'
        }
      >
        <Icon name="sparkles" className="w-3.5 h-3.5" />
        {label}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-1.5 shadow-xl rounded-xl">
          <PageAIActions {...actionsProps} />
        </div>
      )}
    </div>
  )
}
