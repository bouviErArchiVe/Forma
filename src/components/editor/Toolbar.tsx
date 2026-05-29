import { useRef } from 'react'
import { useEditorStore } from '../../stores/editorStore'
import { DEFAULT_TOOL_PRESETS, PEN_COLORS, type ShapeType, type ToolType } from '../../types'

const TOOL_META: Record<ToolType, { label: string; icon: string }> = {
  pen: { label: 'Stylo', icon: '✏️' },
  pencil: { label: 'Crayon', icon: '✎' },
  highlighter: { label: 'Surligneur', icon: '🖍️' },
  eraser: { label: 'Gomme', icon: '🧹' },
  lasso: { label: 'Lasso', icon: '⭕' },
  shapes: { label: 'Formes', icon: '▢' },
  text: { label: 'Texte', icon: 'T' },
  image: { label: 'Image', icon: '🖼' },
  elements: { label: 'Éléments', icon: '⭐' },
  tape: { label: 'Ruban', icon: '📎' },
  laser: { label: 'Laser', icon: '🔴' },
}

interface ToolbarProps {
  onUndo?: () => void
  onRedo?: () => void
  canUndo?: boolean
  canRedo?: boolean
  onInsertImage?: (dataUrl: string) => void
  onScanner?: () => void
  onElements?: () => void
  onCustomize?: () => void
  onRevealAllTapes?: () => void
  onHideAllTapes?: () => void
}

export function Toolbar({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onInsertImage,
  onScanner,
  onElements,
  onCustomize,
  onRevealAllTapes,
  onHideAllTapes,
}: ToolbarProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const {
    activeTool,
    toolbarOrder,
    shapeType,
    penColor,
    penWidth,
    pencilWidth,
    highlighterColor,
    highlighterWidth,
    eraserSize,
    tapeColor,
    readMode,
    setTool,
    restoreStickyTool,
    setShapeType,
    penPresets,
    setPenColor,
    setPenWidth,
    pencilColor,
    setPencilColor,
    setPencilWidth,
    applyPreset,
    saveCurrentToPreset,
    setHighlighterColor,
    setHighlighterWidth,
    setEraserSize,
    setEraserMode,
    eraserMode,
    setTapeColor,
    toggleReadMode,
  } = useEditorStore()

  const handleImageFile = (file: File) => {
    const r = new FileReader()
    r.onload = () => {
      onInsertImage?.(r.result as string)
      restoreStickyTool()
    }
    r.readAsDataURL(file)
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-forma-surface border-b border-forma-border flex-wrap shrink-0">
      <button
        type="button"
        onClick={toggleReadMode}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
          readMode ? 'bg-forma-accent text-white' : 'bg-gray-100 text-forma-muted'
        }`}
      >
        {readMode ? 'Lecture' : 'Édition'}
      </button>
      {readMode && onRevealAllTapes && (
        <>
          <button type="button" onClick={onRevealAllTapes} className="text-xs px-2 py-1 border rounded-lg">
            Révéler rubans
          </button>
          {onHideAllTapes && (
            <button type="button" onClick={onHideAllTapes} className="text-xs px-2 py-1 border rounded-lg">
              Masquer rubans
            </button>
          )}
        </>
      )}

      <button type="button" disabled={!canUndo} onClick={onUndo} className="w-9 h-9 rounded hover:bg-gray-100 disabled:opacity-30" title="Annuler">
        ↶
      </button>
      <button type="button" disabled={!canRedo} onClick={onRedo} className="w-9 h-9 rounded hover:bg-gray-100 disabled:opacity-30" title="Rétablir">
        ↷
      </button>

      <div className="w-px h-8 bg-forma-border" />

      {toolbarOrder.map((toolId) => {
        const t = TOOL_META[toolId]
        if (!t) return null
        if (toolId === 'elements') {
          return (
            <button
              key={toolId}
              type="button"
              disabled={readMode}
              title={t.label}
              onClick={() => {
                setTool('elements')
                onElements?.()
              }}
              className={`w-10 h-10 rounded-lg text-lg flex items-center justify-center ${
                activeTool === 'elements' && !readMode ? 'bg-forma-accent/15 ring-2 ring-forma-accent' : 'hover:bg-gray-100'
              }`}
            >
              {t.icon}
            </button>
          )
        }
        if (toolId === 'image') {
          return (
            <button
              key={toolId}
              type="button"
              disabled={readMode}
              title={t.label}
              onClick={() => {
                setTool('image')
                fileRef.current?.click()
              }}
              className={`w-10 h-10 rounded-lg text-lg flex items-center justify-center ${
                activeTool === 'image' && !readMode ? 'bg-forma-accent/15 ring-2 ring-forma-accent' : 'hover:bg-gray-100'
              }`}
            >
              {t.icon}
            </button>
          )
        }
        return (
          <button
            key={toolId}
            type="button"
            disabled={readMode}
            onClick={() => setTool(toolId)}
            title={t.label}
            className={`w-10 h-10 rounded-lg text-lg flex items-center justify-center ${
              activeTool === toolId && !readMode ? 'bg-forma-accent/15 ring-2 ring-forma-accent' : 'hover:bg-gray-100 disabled:opacity-40'
            }`}
          >
            {toolId === 'text' ? (
              <span className="font-bold text-sm">T</span>
            ) : (
              t.icon
            )}
          </button>
        )
      })}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleImageFile(f)
          e.target.value = ''
        }}
      />

      <div className="w-px h-8 bg-forma-border" />

      {!readMode && (activeTool === 'pen' || activeTool === 'pencil' || activeTool === 'highlighter') && (
        <div className="flex gap-0.5 items-center" title="Trousse (clic droit = enregistrer)">
          {(penPresets?.length ? penPresets : DEFAULT_TOOL_PRESETS).map((p, i) => (
            <button
              key={i}
              type="button"
              title={`${p.tool} ${p.width}px`}
              onClick={() => applyPreset(i)}
              onContextMenu={(e) => {
                e.preventDefault()
                saveCurrentToPreset(i)
              }}
              className="w-7 h-7 rounded border-2 border-gray-200 hover:border-forma-accent"
              style={{ backgroundColor: p.color }}
            />
          ))}
        </div>
      )}
      {!readMode && activeTool === 'pen' && (
        <>
          <ColorDots colors={PEN_COLORS} active={penColor} onPick={setPenColor} />
          <input type="range" min={1} max={8} value={penWidth} onChange={(e) => setPenWidth(+e.target.value)} className="w-20" />
        </>
      )}
      {!readMode && activeTool === 'pencil' && (
        <>
          <input type="color" value={pencilColor} onChange={(e) => setPencilColor(e.target.value)} className="w-8 h-8" />
          <input type="range" min={0.5} max={4} step={0.5} value={pencilWidth} onChange={(e) => setPencilWidth(+e.target.value)} className="w-20" />
        </>
      )}
      {!readMode && activeTool === 'highlighter' && (
        <>
          <input type="color" value={highlighterColor} onChange={(e) => setHighlighterColor(e.target.value)} className="w-8 h-8" />
          <input type="range" min={12} max={40} value={highlighterWidth} onChange={(e) => setHighlighterWidth(+e.target.value)} className="w-20" />
        </>
      )}
      {!readMode && activeTool === 'eraser' && (
        <>
          <select
            value={eraserMode}
            onChange={(e) => setEraserMode(e.target.value as typeof eraserMode)}
            className="text-xs border rounded px-2 py-1"
          >
            <option value="all">Tout</option>
            <option value="pen">Encre</option>
            <option value="highlighter">Surligneur</option>
            <option value="shapes">Formes</option>
            <option value="tape">Ruban</option>
          </select>
          <input type="range" min={8} max={48} value={eraserSize} onChange={(e) => setEraserSize(+e.target.value)} className="w-20" />
        </>
      )}
      {!readMode && activeTool === 'shapes' && (
        <select
          value={shapeType}
          onChange={(e) => setShapeType(e.target.value as ShapeType)}
          className="text-sm border rounded px-2 py-1"
        >
          <option value="rectangle">Rectangle</option>
          <option value="ellipse">Ellipse</option>
          <option value="line">Ligne</option>
          <option value="arrow">Flèche</option>
        </select>
      )}
      {!readMode && activeTool === 'tape' && (
        <input type="color" value={tapeColor} onChange={(e) => setTapeColor(e.target.value)} className="w-8 h-8" title="Couleur ruban" />
      )}

      {onScanner && (
        <button type="button" onClick={onScanner} className="text-xs px-2 py-1 border rounded-lg" title="Scanner caméra">
          📷
        </button>
      )}
      {onCustomize && (
        <button type="button" onClick={onCustomize} className="ml-auto text-xs text-forma-muted hover:text-forma-accent">
          Personnaliser
        </button>
      )}
    </div>
  )
}

function ColorDots({
  colors,
  active,
  onPick,
}: {
  colors: readonly string[]
  active: string
  onPick: (c: string) => void
}) {
  return (
    <div className="flex gap-1">
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onPick(c)}
          className={`w-6 h-6 rounded-full border-2 ${active === c ? 'border-forma-accent' : 'border-gray-300'}`}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  )
}
