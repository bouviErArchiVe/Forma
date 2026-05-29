import { useEffect, useState } from 'react'
import { formatRelativeTime } from '../../lib/format-relative'
import { COVER_COLORS, type Notebook } from '../../types'

interface DocumentCardProps {
  notebook: Notebook
  viewMode: 'grid' | 'list'
  selected: boolean
  selectionMode: boolean
  focused?: boolean
  pageCount?: number
  thumbUrl?: string
  onClick: () => void
  onToggleSelect: () => void
  onRename?: (name: string) => void
  onCoverColor?: (color: string) => void
  locked?: boolean
}

export function DocumentCard({
  notebook,
  viewMode,
  selected,
  selectionMode,
  focused,
  pageCount,
  thumbUrl,
  onClick,
  onToggleSelect,
  onRename,
  onCoverColor,
  locked,
}: DocumentCardProps) {
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(notebook.name)

  useEffect(() => setName(notebook.name), [notebook.name])

  const commitRename = () => {
    const trimmed = name.trim()
    if (trimmed && trimmed !== notebook.name) onRename?.(trimmed)
    setRenaming(false)
  }
  const relative = formatRelativeTime(notebook.updatedAt)

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (selectionMode) onToggleSelect()
      else onClick()
    }
  }

  if (viewMode === 'list') {
    return (
      <div
        role="button"
        tabIndex={0}
        className={`flex items-center gap-3 p-3 rounded-lg border bg-forma-surface cursor-pointer hover:shadow-sm transition ${
          selected ? 'border-forma-accent ring-2 ring-forma-accent/30' : 'border-forma-border'
        }`}
        onClick={selectionMode ? onToggleSelect : onClick}
        onKeyDown={handleKey}
      >
        {selectionMode && (
          <input type="checkbox" checked={selected} readOnly className="w-4 h-4" />
        )}
        {thumbUrl ? (
          <img src={thumbUrl} alt="" className="w-10 h-12 rounded shrink-0 object-cover bg-forma-paper" />
        ) : (
          <div
            className="w-10 h-12 rounded shrink-0 shadow-sm"
            style={{ backgroundColor: notebook.coverColor }}
          />
        )}
        <div className="flex-1 min-w-0 text-left">
          {renaming ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename()
                if (e.key === 'Escape') {
                  setName(notebook.name)
                  setRenaming(false)
                }
              }}
              className="w-full text-sm border rounded px-1"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <p
              className="font-medium truncate"
              onDoubleClick={(e) => {
                if (!selectionMode && onRename) {
                  e.stopPropagation()
                  setRenaming(true)
                }
              }}
            >
              {notebook.name}
            </p>
          )}
          <p className="text-xs text-forma-muted">
            {notebook.type === 'pdf' ? 'PDF' : notebook.type === 'whiteboard' ? 'Whiteboard' : 'Carnet'}
            {pageCount != null ? ` · ${pageCount} p.` : ''} · {relative}
          </p>
        </div>
        <span className="flex gap-1 shrink-0">
          {locked && <span title="Verrouillé">🔒</span>}
          {notebook.favorite && <span className="text-amber-400">★</span>}
        </span>
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={`relative rounded-xl border bg-forma-surface overflow-hidden cursor-pointer hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-forma-accent/40 ${
        selected || focused
          ? 'border-forma-accent ring-2 ring-forma-accent/30'
          : 'border-forma-border'
      }`}
      onClick={selectionMode ? onToggleSelect : onClick}
      onKeyDown={handleKey}
    >
      {selectionMode && (
        <div className="absolute top-2 left-2 z-10">
          <input type="checkbox" checked={selected} readOnly className="w-4 h-4" />
        </div>
      )}
      {(notebook.favorite || locked) && (
        <span className="absolute top-2 right-2 z-10 text-sm flex gap-0.5">
          {locked && <span title="Verrouillé">🔒</span>}
          {notebook.favorite && <span className="text-amber-400">★</span>}
        </span>
      )}
      <div
        className="h-36 flex items-end p-3 relative overflow-hidden"
        style={{ backgroundColor: thumbUrl ? undefined : notebook.coverColor }}
      >
        {thumbUrl && (
          <img src={thumbUrl} alt="" className="absolute inset-0 w-full h-full object-cover object-top" />
        )}
        <div className="relative z-10 bg-white/90 dark:bg-gray-900/90 rounded px-2 py-1 text-xs font-medium truncate max-w-full">
          {renaming ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename()
                if (e.key === 'Escape') {
                  setName(notebook.name)
                  setRenaming(false)
                }
              }}
              className="w-full bg-transparent outline-none"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              onDoubleClick={(e) => {
                if (!selectionMode && onRename) {
                  e.stopPropagation()
                  setRenaming(true)
                }
              }}
            >
              {notebook.name}
            </span>
          )}
        </div>
        {!selectionMode && (onRename || onCoverColor) && (
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 opacity-0 group-hover:opacity-100">
            {onRename && (
              <button
                type="button"
                title="Renommer"
                className="text-xs bg-white/90 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-forma-border"
                onClick={(e) => {
                  e.stopPropagation()
                  setRenaming(true)
                }}
              >
                ✎
              </button>
            )}
            {onCoverColor && (
              <div
                className="flex gap-0.5 p-1 bg-white/90 dark:bg-gray-800 rounded border border-forma-border"
                onClick={(e) => e.stopPropagation()}
              >
                {COVER_COLORS.slice(0, 6).map((c) => (
                  <button
                    key={c}
                    type="button"
                    title="Couverture"
                    className={`w-4 h-4 rounded-full border ${
                      notebook.coverColor === c ? 'border-forma-accent ring-1 ring-forma-accent' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => onCoverColor(c)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="px-3 py-2 text-left">
        <p className="text-xs text-forma-muted">
          {notebook.type === 'pdf' ? 'PDF' : notebook.type === 'whiteboard' ? 'Whiteboard' : 'Carnet'}
          {pageCount != null ? ` · ${pageCount} p.` : ''} · {relative}
        </p>
      </div>
    </div>
  )
}
