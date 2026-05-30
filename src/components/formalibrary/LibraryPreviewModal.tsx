import { useNavigate } from 'react-router-dom'
import { GlassPanel } from '../ui/GlassPanel'
import { GlassButton } from '../ui/GlassButton'
import { categoryIcon, categoryLabel } from '../../lib/formalibrary/constants'
import { getItemUrl } from '../../services/formalibrary'
import type { LibraryItem } from '../../lib/formalibrary/model'

interface LibraryPreviewModalProps {
  item: LibraryItem
  onClose: () => void
  onDelete: (item: LibraryItem) => void
  onToggleFavorite: (item: LibraryItem) => void
}

export function LibraryPreviewModal({ item, onClose, onDelete, onToggleFavorite }: LibraryPreviewModalProps) {
  const navigate = useNavigate()
  const url = item.blob ? getItemUrl(item) : ''
  const isImage = !!url && (item.mimeType?.startsWith('image/') || item.category === 'svg')
  const isPdf = item.mimeType?.includes('pdf') || item.category === 'pdf'

  const openLinked = () => {
    if (item.refModule === 'doc') navigate('/formadoc')
    else if (item.refModule === 'sheet') navigate('/formatab')
  }

  return (
    <div
      className="fixed inset-0 z-[130] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <GlassPanel
        variant="modal"
        className="w-[640px] max-w-[94vw] max-h-[88vh] overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h3 className="text-lg font-bold break-words">{item.name}</h3>
            <p className="text-xs text-forma-muted">
              {categoryIcon(item.category)} {categoryLabel(item.category)}
              {item.size > 0 && ` · ${(item.size / 1024).toFixed(0)} Ko`}
              {item.pageCount > 1 && ` · ${item.pageCount} pages`}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-forma-muted text-xl leading-none">
            ×
          </button>
        </div>

        <div className="rounded-xl border border-forma-border/40 bg-forma-bg/40 mb-3 flex items-center justify-center min-h-[180px] max-h-[50vh] overflow-hidden">
          {isImage ? (
            <img src={url} alt={item.name} className="max-h-[50vh] object-contain" />
          ) : item.refModule ? (
            <div className="text-center p-8">
              <div className="text-5xl mb-2">{categoryIcon(item.category)}</div>
              <GlassButton accent size="sm" onClick={openLinked}>
                Ouvrir le {item.refModule === 'doc' ? 'FormaDoc' : 'FormaTab'}
              </GlassButton>
            </div>
          ) : (
            <div className="text-center p-8 text-forma-muted">
              <div className="text-5xl mb-2">{categoryIcon(item.category)}</div>
              {url && (
                <a href={url} target="_blank" rel="noreferrer" className="text-forma-accent text-sm hover:underline">
                  Ouvrir {isPdf ? 'le PDF' : 'le fichier'} ↗
                </a>
              )}
            </div>
          )}
        </div>

        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item.tags.map((t) => (
              <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-forma-accent/10 text-forma-accent">
                {t}
              </span>
            ))}
          </div>
        )}

        {item.textContent && !isImage && (
          <p className="text-xs text-forma-muted whitespace-pre-wrap line-clamp-6 mb-3">
            {item.textContent.slice(0, 600)}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <GlassButton size="sm" onClick={() => onToggleFavorite(item)}>
            {item.favorite ? '★ Retirer' : '☆ Favori'}
          </GlassButton>
          {url && !item.refModule && (
            <a href={url} download={item.metadata?.fileName ? String(item.metadata.fileName) : item.name}>
              <GlassButton size="sm">Télécharger</GlassButton>
            </a>
          )}
          <GlassButton size="sm" danger onClick={() => onDelete(item)}>
            Supprimer
          </GlassButton>
        </div>
      </GlassPanel>
    </div>
  )
}
