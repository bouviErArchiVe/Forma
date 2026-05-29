import { useEffect, useRef } from 'react'

export interface ContextMenuItem {
  id: string
  label: string
  emoji?: string
  danger?: boolean
  disabled?: boolean
  onClick: () => void
}

interface ContextMenuProps {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      className="fixed z-[150] min-w-[180px] py-1 forma-glass-modal shadow-xl forma-animate-in"
      style={{ left: x, top: y }}
      role="menu"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          disabled={item.disabled}
          className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-white/30 dark:hover:bg-white/10 disabled:opacity-40 ${
            item.danger ? 'text-red-600' : 'text-forma-text'
          }`}
          onClick={() => {
            item.onClick()
            onClose()
          }}
        >
          {item.emoji && <span>{item.emoji}</span>}
          {item.label}
        </button>
      ))}
    </div>
  )
}
