import type { FormaReviewSession } from '../../types'
import { REVIEW_MODES } from '../../lib/formareview/constants'

interface ReviewSidebarProps {
  session: FormaReviewSession
  selectedPageId: string | null
  onSelectPage: (id: string) => void
  onAddPages: (files: FileList) => void
  onDeletePage: (id: string) => void
}

export function ReviewSidebar({
  session,
  selectedPageId,
  onSelectPage,
  onAddPages,
  onDeletePage,
}: ReviewSidebarProps) {
  const mode = REVIEW_MODES[session.mode]

  return (
    <aside className="w-[220px] shrink-0 flex flex-col bg-forma-surface border-r border-forma-border/50 h-full">
      <div className="p-3 border-b border-forma-border/50">
        <div className="text-[11px] text-forma-muted">
          {mode.icon} {mode.label}
        </div>
        <div className="text-sm font-semibold mt-1">{session.title}</div>
        {session.description && (
          <div className="text-[11px] text-forma-muted mt-1">{session.description}</div>
        )}
      </div>

      <div className="px-3 py-2 flex items-center justify-between border-b border-forma-border/50">
        <span className="text-xs text-forma-muted">Pages ({session.pages.length})</span>
        <label className="text-[11px] text-forma-accent cursor-pointer">
          + Importer
          <input
            type="file"
            accept="image/*,application/pdf,.pdf"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) onAddPages(e.target.files)
              e.target.value = ''
            }}
          />
        </label>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {session.pages.map((pg, i) => (
          <button
            key={pg.id}
            type="button"
            onClick={() => onSelectPage(pg.id)}
            className={`block w-full text-left mb-1.5 p-2 rounded-lg border cursor-pointer ${
              selectedPageId === pg.id
                ? 'bg-forma-accent/20 border-forma-accent'
                : 'bg-forma-panel border-forma-border'
            }`}
          >
            <div className="text-xs font-semibold">Page {i + 1}</div>
            <div className="text-[10px] text-forma-muted truncate">{pg.name}</div>
            {pg.dataUrl && (
              <img
                src={pg.dataUrl}
                alt=""
                className="w-full h-[60px] object-cover rounded mt-1.5 opacity-85"
              />
            )}
            {session.pages.length > 1 && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation()
                  onDeletePage(pg.id)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.stopPropagation()
                    onDeletePage(pg.id)
                  }
                }}
                className="text-[10px] text-forma-muted mt-1 block hover:text-red-500"
              >
                Supprimer
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="p-2.5 border-t border-forma-border/50 text-[10px] text-forma-muted">
        {session.pins.length} pin(s) · {session.markups.length} annotation(s) ·{' '}
        {session.comments.length} commentaire(s)
      </div>
    </aside>
  )
}
