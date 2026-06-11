import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatRelativeTime } from '../../lib/format-relative'
import { getRecentIds } from '../../lib/recent'
import { getNotebooksByIds } from '../../services/library'
import type { Notebook } from '../../types'

export function RecentStrip({ refreshKey = 0 }: { refreshKey?: number }) {
  const navigate = useNavigate()
  const [items, setItems] = useState<Notebook[]>([])

  useEffect(() => {
    getNotebooksByIds(getRecentIds().slice(0, 8)).then(setItems)
  }, [refreshKey])

  if (items.length === 0) return null

  return (
    <section className="mb-6">
      <h2 className="panel-section-title mb-2">Récents</h2>
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {items.map((nb) => (
          <button
            key={nb.id}
            type="button"
            onClick={() => navigate(`/document/${nb.id}`)}
            title={`Modifié ${formatRelativeTime(nb.updatedAt)}`}
            className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border border-forma-border bg-forma-surface hover:shadow-sm hover:border-forma-accent/30 text-left max-w-[200px] transition-all duration-150"
          >
            <span
              className="w-2.5 h-8 rounded-full shrink-0"
              style={{ backgroundColor: nb.coverColor }}
            />
            <span className="text-sm font-medium truncate text-forma-text">{nb.name}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
