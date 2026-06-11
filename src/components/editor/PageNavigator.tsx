import { useEffect, useState } from 'react'
import { PageListPopover } from './PageListPopover'

interface PageNavigatorProps {
  index: number
  total: number
  onPrev: () => void
  onNext: () => void
  onGoTo?: (index: number) => void
  statsLine?: string
  pageFavorites?: boolean[]
}

export function PageNavigator({
  index,
  total,
  onPrev,
  onNext,
  onGoTo,
  statsLine,
  pageFavorites,
}: PageNavigatorProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(index + 1))

  useEffect(() => {
    setValue(String(index + 1))
  }, [index])

  const commit = () => {
    const n = parseInt(value, 10)
    if (!Number.isNaN(n) && onGoTo) {
      onGoTo(Math.max(0, Math.min(total - 1, n - 1)))
    }
    setEditing(false)
  }

  return (
    <div className="flex items-center gap-0.5 bg-forma-surface/90 backdrop-blur rounded-full shadow border border-forma-border px-1 py-1">
      {onGoTo && (
        <PageListPopover
          total={total}
          currentIndex={index}
          onSelect={onGoTo}
          pageFavorites={pageFavorites}
        />
      )}
      <button
        type="button"
        disabled={index <= 0}
        onClick={onPrev}
        className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors"
        title="Page précédente (Alt+←)"
      >
        ‹
      </button>
      {editing && onGoTo ? (
        <input
          type="number"
          min={1}
          max={total}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          className="w-12 text-xs text-center border border-forma-border rounded bg-forma-surface text-forma-text"
          autoFocus
        />
      ) : (
        <button
          type="button"
          className="text-xs font-medium min-w-[48px] text-center hover:text-forma-accent"
          title={statsLine ? `${statsLine} · cliquer pour aller à une page` : 'Cliquer pour aller à une page'}
          onClick={() => {
            if (onGoTo) {
              setValue(String(index + 1))
              setEditing(true)
            }
          }}
        >
          {index + 1} / {total}
        </button>
      )}
      <button
        type="button"
        disabled={index >= total - 1}
        onClick={onNext}
        className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors"
        title="Page suivante (Alt+→)"
      >
        ›
      </button>
    </div>
  )
}
