import { ANIMATIONS } from '../../lib/formapresent/constants'
import { GlassButton } from '../ui/GlassButton'
import type { FormaDeckSettings, FormaSlideElement } from '../../types'

interface PresentToolbarProps {
  onAddText: () => void
  onAddImage: () => void
  onAlign: (alignment: string) => void
  onToggleGrid: () => void
  onToggleGuides: () => void
  onToggleSnap: () => void
  settings: FormaDeckSettings
  selectedElement: FormaSlideElement | null
  onUpdateElement: (patch: Partial<FormaSlideElement>) => void
  onDeleteElement: () => void
  onPresent: () => void
}

export function PresentToolbar({
  onAddText,
  onAddImage,
  onAlign,
  onToggleGrid,
  onToggleGuides,
  onToggleSnap,
  settings,
  selectedElement,
  onUpdateElement,
  onDeleteElement,
  onPresent,
}: PresentToolbarProps) {
  const miniBtn = (label: string, onClick: () => void, active = false, disabled = false) => (
    <button
      key={label}
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`px-2 py-1 text-xs border rounded-lg ${
        active ? 'border-forma-accent bg-forma-accent/10' : 'hover:bg-white/40'
      } ${disabled ? 'opacity-40' : ''}`}
    >
      {label}
    </button>
  )

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 forma-glass-panel border-b border-forma-border/40">
      <GlassButton size="sm" onClick={onAddText}>
        T Texte
      </GlassButton>
      <GlassButton size="sm" onClick={onAddImage}>
        🖼 Image
      </GlassButton>

      <span className="w-px h-5 bg-forma-border/50" />

      {(['left', 'center', 'right', 'top', 'middle', 'bottom'] as const).map((a) =>
        miniBtn(a.slice(0, 1).toUpperCase(), () => onAlign(a), false, !selectedElement),
      )}

      <span className="w-px h-5 bg-forma-border/50" />

      {miniBtn('#', onToggleGrid, settings.showGrid, false)}
      {miniBtn('⊞', onToggleGuides, settings.showGuides, false)}
      {miniBtn('⊡', onToggleSnap, settings.snapToGrid, false)}

      {selectedElement && (
        <>
          <select
            value={selectedElement.animation || 'none'}
            onChange={(e) =>
              onUpdateElement({ animation: e.target.value as FormaSlideElement['animation'] })
            }
            className="text-xs border rounded-lg px-1 py-1"
          >
            {Object.values(ANIMATIONS).map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
          <button type="button" className="text-xs text-red-600 px-2" onClick={onDeleteElement}>
            Supprimer
          </button>
        </>
      )}

      <div className="flex-1" />

      <GlassButton accent onClick={onPresent}>
        ▶ Présenter
      </GlassButton>
    </div>
  )
}
