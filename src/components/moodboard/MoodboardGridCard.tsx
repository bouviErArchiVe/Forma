import { useState } from 'react'
import type { ResolvedMoodboardImage } from '../../services/moodboard'

interface MoodboardGridCardProps {
  image: ResolvedMoodboardImage
  onStar: () => void
  onDelete: () => void
  onOpen: () => void
}

export function MoodboardGridCard({ image, onStar, onDelete, onOpen }: MoodboardGridCardProps) {
  const [hover, setHover] = useState(false)

  return (
    <div
      className="relative rounded-xl overflow-hidden forma-glass-card cursor-pointer mb-3 transition-transform hover:-translate-y-0.5"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onOpen}
    >
      {image.url ? (
        <img src={image.url} alt={image.name} className="w-full block object-cover" />
      ) : (
        <div className="aspect-[4/3] bg-forma-border/30 flex items-center justify-center text-forma-muted text-sm">
          Image indisponible
        </div>
      )}
      {image.starred && !hover && (
        <span className="absolute top-2 right-2 text-amber-400 text-sm">★</span>
      )}
      {hover && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          <div className="absolute top-2 right-2 flex gap-1">
            <button
              type="button"
              className="text-xs px-1.5 py-0.5 rounded bg-black/50 text-white"
              onClick={(e) => {
                e.stopPropagation()
                onStar()
              }}
            >
              {image.starred ? '★' : '☆'}
            </button>
            <button
              type="button"
              className="text-xs px-1.5 py-0.5 rounded bg-black/50 text-white"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
            >
              ✕
            </button>
          </div>
          {(image.name || image.tags.length > 0) && (
            <div className="absolute bottom-2 left-2 right-2">
              {image.name && (
                <p className="text-white text-xs font-medium truncate">{image.name}</p>
              )}
              <div className="flex flex-wrap gap-1 mt-1">
                {image.tags.slice(0, 3).map((t) => (
                  <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/25 text-white">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
