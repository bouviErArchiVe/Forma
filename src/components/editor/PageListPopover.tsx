import { useState } from 'react'

interface PageListPopoverProps {
  total: number
  currentIndex: number
  onSelect: (index: number) => void
  pageFavorites?: boolean[]
}

export function PageListPopover({
  total,
  currentIndex,
  onSelect,
  pageFavorites,
}: PageListPopoverProps) {
  const [open, setOpen] = useState(false)

  if (total <= 1) return null

  return (
    <div className="relative">
      <button
        type="button"
        className="w-7 h-8 rounded-full hover:bg-gray-100 text-xs text-forma-muted"
        title="Liste des pages"
        onClick={() => setOpen(!open)}
      >
        ☰
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 w-48 max-h-56 overflow-y-auto bg-forma-surface border border-forma-border rounded-lg shadow-lg py-1 text-xs">
            {Array.from({ length: total }, (_, i) => (
              <button
                key={i}
                type="button"
                className={`block w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  i === currentIndex ? 'bg-forma-accent/15 text-forma-accent font-medium' : ''
                }`}
                onClick={() => {
                  onSelect(i)
                  setOpen(false)
                }}
              >
                Page {i + 1}
                {pageFavorites?.[i] ? ' ★' : ''}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
