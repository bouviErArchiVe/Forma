import { SLIDE_SIZE, TRANSITIONS } from '../../lib/formapresent/constants'
import type { FormaDeck, FormaSlide } from '../../types'

interface PresentSidebarProps {
  deck: FormaDeck
  selectedSlideId: string | null
  onSelectSlide: (id: string) => void
  onAddSlide: () => void
  onDuplicateSlide: (id: string) => void
  onDeleteSlide: (id: string) => void
  onUpdateSlide: (id: string, patch: Partial<FormaSlide>) => void
  onReorder: (from: number, to: number) => void
}

export function PresentSidebar({
  deck,
  selectedSlideId,
  onSelectSlide,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onUpdateSlide,
  onReorder,
}: PresentSidebarProps) {
  const slides = deck.slides

  return (
    <aside className="w-52 shrink-0 flex flex-col forma-glass-panel border-r border-forma-border/50 h-full">
      <div className="p-3 border-b border-forma-border/40 flex items-center justify-between">
        <span className="text-xs text-forma-muted">Slides ({slides.length})</span>
        <button type="button" className="text-xs text-forma-accent" onClick={onAddSlide}>
          + Ajouter
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {slides.map((sl, i) => (
          <div
            key={sl.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelectSlide(sl.id)}
            onKeyDown={(e) => e.key === 'Enter' && onSelectSlide(sl.id)}
            className={`rounded-lg overflow-hidden cursor-pointer border-2 ${
              selectedSlideId === sl.id ? 'border-forma-accent' : 'border-forma-border/40'
            }`}
          >
            <div
              className="aspect-video relative text-[6px] overflow-hidden"
              style={{
                background: sl.bgColor || '#fff',
                backgroundImage: sl.bgImage ? `url(${sl.bgImage})` : undefined,
                backgroundSize: 'cover',
              }}
            >
              {sl.elements.slice(0, 4).map((el) => (
                <div
                  key={el.id}
                  className="absolute overflow-hidden opacity-70"
                  style={{
                    left: `${(el.x / SLIDE_SIZE.width) * 100}%`,
                    top: `${(el.y / SLIDE_SIZE.height) * 100}%`,
                    width: `${(el.w / SLIDE_SIZE.width) * 100}%`,
                    height: `${(el.h / SLIDE_SIZE.height) * 100}%`,
                    background: el.type === 'text' ? 'transparent' : '#ddd',
                  }}
                >
                  {el.type === 'text' && (
                    <span style={{ color: el.color, fontSize: 6 }}>
                      {String(el.content || '').slice(0, 16)}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="px-2 py-1.5 flex items-center gap-1 bg-white/50 dark:bg-black/20">
              <span className="text-[11px] font-medium truncate flex-1">
                {i + 1}. {sl.name}
              </span>
              <button
                type="button"
                className="text-[10px] text-forma-muted"
                onClick={(e) => {
                  e.stopPropagation()
                  if (i > 0) onReorder(i, i - 1)
                }}
              >
                ↑
              </button>
              <button
                type="button"
                className="text-[10px] text-forma-muted"
                onClick={(e) => {
                  e.stopPropagation()
                  if (i < slides.length - 1) onReorder(i, i + 1)
                }}
              >
                ↓
              </button>
              <button
                type="button"
                className="text-[10px] text-forma-muted"
                onClick={(e) => {
                  e.stopPropagation()
                  onDuplicateSlide(sl.id)
                }}
              >
                ⧉
              </button>
              {slides.length > 1 && (
                <button
                  type="button"
                  className="text-[10px] text-red-600"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteSlide(sl.id)
                  }}
                >
                  ×
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedSlideId && (
        <div className="p-3 border-t border-forma-border/40 space-y-2">
          <label className="text-[10px] text-forma-muted block">Notes présentateur</label>
          <textarea
            value={slides.find((s) => s.id === selectedSlideId)?.notes || ''}
            onChange={(e) => onUpdateSlide(selectedSlideId, { notes: e.target.value })}
            rows={3}
            className="w-full text-xs border rounded-lg px-2 py-1 resize-y"
            placeholder="Notes visibles en mode présentation…"
          />
          <label className="text-[10px] text-forma-muted block">Transition</label>
          <select
            value={slides.find((s) => s.id === selectedSlideId)?.transition || 'fade'}
            onChange={(e) =>
              onUpdateSlide(selectedSlideId, {
                transition: e.target.value as FormaSlide['transition'],
              })
            }
            className="w-full text-xs border rounded-lg px-2 py-1"
          >
            {Object.values(TRANSITIONS).map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </aside>
  )
}
