import { STICKER_CATALOG } from '../../lib/stickers'

interface StickerPickerProps {
  onPick: (stickerId: string) => void
  onClose: () => void
}

export function StickerPicker({ onPick, onClose }: StickerPickerProps) {
  const categories = ['marks', 'study', 'arrows', 'fun'] as const
  return (
    <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-30 bg-white rounded-xl shadow-xl border border-forma-border p-3 w-72 max-h-64 overflow-y-auto">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">Éléments</span>
        <button type="button" onClick={onClose} className="text-forma-muted text-sm">
          ×
        </button>
      </div>
      {categories.map((cat) => (
        <div key={cat} className="mb-2">
          <p className="text-[10px] uppercase text-forma-muted mb-1">{cat}</p>
          <div className="flex flex-wrap gap-1">
            {STICKER_CATALOG.filter((s) => s.category === cat).map((s) => (
              <button
                key={s.id}
                type="button"
                title={s.label}
                onClick={() => onPick(s.id)}
                className="w-10 h-10 text-2xl hover:bg-gray-100 rounded"
              >
                {s.emoji}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
