import { categoryIcon, categoryLabel } from '../../lib/formalibrary/constants'
import { HighlightText } from '../formaai/HighlightText'
import { getItemUrl } from '../../services/formalibrary'
import type { LibraryItem } from '../../lib/formalibrary/model'

interface LibraryItemCardProps {
  item: LibraryItem
  query: string
  onOpen: (item: LibraryItem) => void
  onToggleFavorite: (item: LibraryItem) => void
}

const IMAGE_CATEGORIES = new Set(['image', 'texture', 'material', 'palette', 'svg', 'block'])

export function LibraryItemCard({ item, query, onOpen, onToggleFavorite }: LibraryItemCardProps) {
  const showImage = !!item.blob && (IMAGE_CATEGORIES.has(item.category) || item.mimeType?.startsWith('image/'))
  const url = showImage ? getItemUrl(item) : ''

  return (
    <div className="forma-glass-card rounded-xl border border-forma-border/40 overflow-hidden flex flex-col group">
      <button
        type="button"
        onClick={() => onOpen(item)}
        className="aspect-square w-full bg-forma-bg/50 flex items-center justify-center overflow-hidden"
        title={item.name}
      >
        {url ? (
          <img src={url} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <span className="text-4xl opacity-70">{categoryIcon(item.category)}</span>
        )}
      </button>
      <div className="p-2 flex flex-col gap-1 min-h-0">
        <div className="flex items-start justify-between gap-1">
          <span className="text-xs font-medium leading-tight line-clamp-2 break-words">
            <HighlightText text={item.name} query={query} />
          </span>
          <button
            type="button"
            onClick={() => onToggleFavorite(item)}
            className="text-sm shrink-0"
            title="Favori"
          >
            {item.favorite ? '★' : '☆'}
          </button>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-forma-muted">
          <span>{categoryLabel(item.category)}</span>
          {item.refModule && <span className="text-forma-accent">· lié</span>}
          {item.pageCount > 1 && <span>· {item.pageCount} p.</span>}
        </div>
      </div>
    </div>
  )
}
