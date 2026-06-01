import { STICKER_CATALOG } from '../../lib/stickers'

interface StickerPickerProps {
  onPick: (stickerId: string) => void
  onClose: () => void
}

const CATEGORY_LABELS: Record<string, string> = {
  marks: 'Repères',
  study: 'Étude',
  arrows: 'Flèches',
  fun: 'Expressions',
}

export function StickerPicker({ onPick, onClose }: StickerPickerProps) {
  const categories = ['marks', 'study', 'arrows', 'fun'] as const
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-20" onClick={onClose} />
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-30 bg-forma-surface border border-forma-border rounded-xl shadow-xl p-3 w-80 max-h-72 overflow-y-auto">
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-sm font-semibold text-forma-text">Éléments</span>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-md text-forma-muted hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-forma-text transition-colors text-base"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
        {categories.map((cat) => {
          const items = STICKER_CATALOG.filter((s) => s.category === cat)
          if (!items.length) return null
          return (
            <div key={cat} className="mb-2.5">
              <p className="panel-section-title">{CATEGORY_LABELS[cat] ?? cat}</p>
              <div className="flex flex-wrap gap-1">
                {items.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    title={s.label}
                    onClick={() => onPick(s.id)}
                    className="w-10 h-10 text-xl rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center"
                  >
                    {s.emoji}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
