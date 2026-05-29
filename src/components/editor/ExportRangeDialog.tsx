import { useState } from 'react'

interface ExportRangeDialogProps {
  pageCount: number
  defaultFrom?: number
  defaultTo?: number
  onClose: () => void
  onExport: (from: number, to: number) => void
}

export function ExportRangeDialog({
  pageCount,
  defaultFrom = 1,
  defaultTo,
  onClose,
  onExport,
}: ExportRangeDialogProps) {
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultTo ?? pageCount)

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-forma-surface dark:bg-gray-900 rounded-xl shadow-xl max-w-xs w-full p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold text-sm mb-3">Plage de pages</h3>
        <div className="flex gap-2 items-center text-sm mb-4">
          <label className="flex-1">
            De
            <input
              type="number"
              min={1}
              max={pageCount}
              value={from}
              onChange={(e) => setFrom(Math.max(1, Math.min(pageCount, +e.target.value || 1)))}
              className="mt-1 w-full border rounded px-2 py-1 dark:bg-gray-800"
            />
          </label>
          <label className="flex-1">
            À
            <input
              type="number"
              min={1}
              max={pageCount}
              value={to}
              onChange={(e) => setTo(Math.max(1, Math.min(pageCount, +e.target.value || 1)))}
              className="mt-1 w-full border rounded px-2 py-1 dark:bg-gray-800"
            />
          </label>
        </div>
        <p className="text-xs text-forma-muted mb-3">Sur {pageCount} page(s) au total</p>
        <div className="flex gap-2">
          <button type="button" className="flex-1 py-2 border rounded-lg text-sm" onClick={onClose}>
            Annuler
          </button>
          <button
            type="button"
            className="flex-1 py-2 bg-forma-accent text-white rounded-lg text-sm"
            onClick={() => {
              const a = Math.min(from, to)
              const b = Math.max(from, to)
              onExport(a, b)
              onClose()
            }}
          >
            Exporter
          </button>
        </div>
      </div>
    </div>
  )
}
