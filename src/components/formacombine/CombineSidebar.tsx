import type { FormaCombinePage } from '../../types'
import { COMBINE_PAGE_TYPES } from '../../lib/formacombine/constants'

interface CombineSidebarProps {
  pages: FormaCombinePage[]
  selectedId: string | null
  onSelect: (id: string) => void
  onReorder: (from: number, to: number) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onRotate: (id: string) => void
}

export function CombineSidebar({
  pages,
  selectedId,
  onSelect,
  onReorder,
  onRename,
  onDelete,
  onDuplicate,
  onRotate,
}: CombineSidebarProps) {
  const dragIdx = { current: null as number | null }

  const handleDrop = (toIdx: number) => {
    const from = dragIdx.current
    if (from == null || from === toIdx) return
    onReorder(from, toIdx)
    dragIdx.current = null
  }

  return (
    <aside className="w-[280px] shrink-0 border-r border-forma-border/50 bg-forma-panel flex flex-col overflow-hidden">
      <div className="px-3.5 py-3 border-b border-forma-border/50 text-sm text-forma-muted">
        {pages.length} page{pages.length !== 1 ? 's' : ''}
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {pages.length === 0 && (
          <p className="text-forma-muted text-sm p-3 text-center">Importez des fichiers pour commencer</p>
        )}
        {pages.map((pg, idx) => (
          <div
            key={pg.id}
            draggable
            onDragStart={() => {
              dragIdx.current = idx
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(idx)}
            onClick={() => onSelect(pg.id)}
            className={`p-2 mb-1 rounded-lg cursor-grab border ${
              selectedId === pg.id
                ? 'bg-forma-accent/15 border-forma-accent'
                : 'border-transparent hover:bg-forma-surface'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-forma-muted text-[11px] min-w-[18px]">{idx + 1}</span>
              <input
                value={pg.name}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => onRename(pg.id, e.target.value)}
                className="flex-1 bg-transparent border-none text-sm outline-none"
              />
            </div>
            <div className="text-[11px] text-forma-muted mt-0.5 pl-6">
              {COMBINE_PAGE_TYPES[pg.type] || pg.type}
              {pg.rotation ? ` · ${pg.rotation}°` : ''}
              {pg.width && pg.height ? ` · ${pg.width}×${pg.height}` : ''}
            </div>
            <div className="flex gap-1 mt-1.5 pl-6">
              <SmallBtn onClick={(e) => { e.stopPropagation(); onRotate(pg.id) }}>↻</SmallBtn>
              <SmallBtn onClick={(e) => { e.stopPropagation(); onDuplicate(pg.id) }}>⧉</SmallBtn>
              <SmallBtn danger onClick={(e) => { e.stopPropagation(); onDelete(pg.id) }}>✕</SmallBtn>
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}

function SmallBtn({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode
  onClick: (e: React.MouseEvent) => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-1.5 py-0.5 text-[11px] rounded border border-forma-border ${
        danger ? 'text-red-400 bg-red-950/30' : 'bg-forma-surface'
      }`}
    >
      {children}
    </button>
  )
}
