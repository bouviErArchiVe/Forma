import type { Folder } from '../../types'

interface FolderCardProps {
  folder: Folder
  count: number
  viewMode: 'grid' | 'list'
  focused?: boolean
  onOpen: () => void
  onContextMenu?: (e: React.MouseEvent) => void
}

export function FolderCard({
  folder,
  count,
  viewMode,
  focused,
  onOpen,
  onContextMenu,
}: FolderCardProps) {
  const emoji = folder.emoji ?? '📁'
  const accent = folder.color ?? '#c8622a'

  if (viewMode === 'list') {
    return (
      <button
        type="button"
        onClick={onOpen}
        onContextMenu={onContextMenu}
        className={`w-full flex items-center gap-3 p-3 rounded-xl forma-glass-card text-left hover:shadow ${
          focused ? 'ring-2 ring-forma-accent/40' : ''
        }`}
      >
        <span
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
          style={{ backgroundColor: `${accent}22` }}
        >
          {emoji}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{folder.name}</p>
          <p className="text-xs text-forma-muted">
            {count} carnet{count !== 1 ? 's' : ''}
          </p>
        </div>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      onContextMenu={onContextMenu}
      className={`w-full p-4 rounded-xl border text-left hover:shadow transition-all ${
        focused
          ? 'ring-2 ring-forma-accent border-forma-accent'
          : 'border-forma-border forma-glass-card'
      }`}
      style={{ backgroundColor: `${accent}12` }}
    >
      <span className="text-2xl">{emoji}</span>
      <span className="block font-medium mt-1 truncate">{folder.name}</span>
      <span className="text-xs text-forma-muted">
        {count} carnet{count !== 1 ? 's' : ''}
      </span>
    </button>
  )
}
