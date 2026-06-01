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
  /** Verrou multi-onglets : force lecture seule, désactive bascule édition. */
  readOnlyLocked?: boolean
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
  readOnlyLocked = false,
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

  const activeToolClass = 'bg-forma-accent text-white shadow-sm scale-105'
  const inactiveToolClass =
    'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-35'

  return (
    <div className="flex items-center gap-1.5 px-3 py-2 bg-forma-surface border-b border-forma-border flex-wrap shrink-0 min-h-[52px]">
      {/* Mode édition / lecture */}
      <button
        type="button"
        onClick={() => {
          if (readOnlyLocked) return
          toggleReadMode()
        }}
        disabled={readOnlyLocked}
        title={readOnlyLocked ? 'Ouvert dans un autre onglet — lecture seule' : undefined}
        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
          readMode || readOnlyLocked
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
        } ${readOnlyLocked ? 'opacity-80 cursor-not-allowed' : ''}`}
      >
        {readOnlyLocked ? '🔒 Lecture' : readMode ? '📖 Lecture' : '✏️ Édition'}
      </button>
      {readMode && onRevealAllTapes && (
        <>
          <button
            type="button"
            onClick={onRevealAllTapes}
            className="text-xs px-2 py-1.5 border border-forma-border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Révéler rubans
          </button>
          {onHideAllTapes && (
            <button
              type="button"
              onClick={onHideAllTapes}
              className="text-xs px-2 py-1.5 border border-forma-border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Masquer
            </button>
          )}
        </>
      )}

      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5 ml-1">
        <button
          type="button"
          disabled={!canUndo}
          onClick={onUndo}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-base hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-25 transition-colors"
          title="Annuler (⌘Z)"
        >
          ↶
        </button>
        <button
          type="button"
          disabled={!canRedo}
          onClick={onRedo}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-base hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-25 transition-colors"
          title="Rétablir (⌘⇧Z)"
        >
          ↷
        </button>
      </div>

      <div className="w-px h-7 bg-forma-border mx-1" />

      {/* Outils */}
      {toolbarOrder.map((toolId) => {
        const t = TOOL_META[toolId]
        if (!t) return null
        const isActive = activeTool === toolId && !readMode

        if (toolId === 'elements') {
          return (
            <button
              key={toolId}
              type="button"
              disabled={readMode}
              title={`${t.label} (M)`}
              onClick={() => {
                setTool('elements')
                onElements?.()
              }}
              className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all ${
                isActive ? activeToolClass : inactiveToolClass
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
              title={`${t.label} (I)`}
              onClick={() => {
                setTool('image')
                fileRef.current?.click()
              }}
              className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all ${
                isActive ? activeToolClass : inactiveToolClass
              }`}
            >
              {t.icon}
            </button>
          )
        }
        const shortcut = Object.entries({ p:'pen', c:'pencil', h:'highlighter', e:'eraser', l:'lasso', s:'shapes', t:'text', i:'image', m:'elements', r:'tape', k:'laser' }).find(([,v]) => v === toolId)?.[0]
        return (
          <button
            key={toolId}
            type="button"
            disabled={readMode}
            onClick={() => setTool(toolId)}
            title={`${t.label}${shortcut ? ` (${shortcut.toUpperCase()})` : ''}`}
            className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all ${
              isActive ? activeToolClass : inactiveToolClass
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

      <div className="w-px h-7 bg-forma-border mx-1" />

      {/* Presets trousse */}
      {!readMode && (activeTool === 'pen' || activeTool === 'pencil' || activeTool === 'highlighter') && (
        <div className="flex gap-1 items-center" title="Trousse — clic = appliquer, clic droit = enregistrer">
          {(penPresets?.length ? penPresets : DEFAULT_TOOL_PRESETS).map((p, i) => (
            <button
              key={i}
              type="button"
              title={`${p.tool} ${p.width}px — clic droit pour enregistrer`}
              onClick={() => applyPreset(i)}
              onContextMenu={(e) => { e.preventDefault(); saveCurrentToPreset(i) }}
              className="w-7 h-7 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform shadow-sm"
              style={{ backgroundColor: p.color }}
            />
          ))}
        </div>
      )}

      {/* Contrôles stylo */}
      {!readMode && activeTool === 'pen' && (
        <div className="flex items-center gap-2 ml-1">
          <ColorDots colors={PEN_COLORS} active={penColor} onPick={setPenColor} />
          <div className="flex items-center gap-1">
            <span className="text-xs text-forma-muted w-4 text-right">{penWidth}</span>
            <input type="range" min={1} max={8} value={penWidth} onChange={(e) => setPenWidth(+e.target.value)} className="w-20 accent-forma-accent" />
          </div>
        </div>
      )}
      {!readMode && activeTool === 'pencil' && (
        <div className="flex items-center gap-2 ml-1">
          <input type="color" value={pencilColor} onChange={(e) => setPencilColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
          <input type="range" min={0.5} max={4} step={0.5} value={pencilWidth} onChange={(e) => setPencilWidth(+e.target.value)} className="w-20 accent-forma-accent" />
        </div>
      )}
      {!readMode && activeTool === 'highlighter' && (
        <div className="flex items-center gap-2 ml-1">
          <input type="color" value={highlighterColor} onChange={(e) => setHighlighterColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
          <div className="flex items-center gap-1">
            <span className="text-xs text-forma-muted w-4 text-right">{highlighterWidth}</span>
            <input type="range" min={12} max={40} value={highlighterWidth} onChange={(e) => setHighlighterWidth(+e.target.value)} className="w-20 accent-forma-accent" />
          </div>
        </div>
      )}

      {/* Contrôles gomme */}
      {!readMode && activeTool === 'eraser' && (
        <div className="flex items-center gap-2 ml-1">
          <select
            value={eraserMode}
            onChange={(e) => setEraserMode(e.target.value as typeof eraserMode)}
            className="text-xs border border-forma-border rounded-lg px-2 py-1.5 bg-forma-surface"
          >
            <option value="all">Tout effacer</option>
            <option value="pen">Encre seule</option>
            <option value="highlighter">Surligneur seul</option>
            <option value="shapes">Formes seules</option>
            <option value="tape">Rubans seuls</option>
          </select>
          <div className="flex items-center gap-1">
            <span className="text-xs text-forma-muted w-6 text-right">{eraserSize}</span>
            <input type="range" min={8} max={64} value={eraserSize} onChange={(e) => setEraserSize(+e.target.value)} className="w-20 accent-red-500" />
          </div>
        </div>
      )}

      {/* Contrôles formes */}
      {!readMode && activeTool === 'shapes' && (
        <div className="flex items-center gap-1 ml-1">
          {(['rectangle', 'ellipse', 'line', 'arrow'] as ShapeType[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setShapeType(s)}
              className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${
                shapeType === s
                  ? 'bg-forma-accent text-white border-forma-accent'
                  : 'border-forma-border hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {s === 'rectangle' ? '▭' : s === 'ellipse' ? '○' : s === 'line' ? '╱' : '→'}
            </button>
          ))}
        </div>
      )}

      {/* Couleur ruban */}
      {!readMode && activeTool === 'tape' && (
        <div className="flex items-center gap-2 ml-1">
          <span className="text-xs text-forma-muted">Couleur</span>
          <input
            type="color"
            value={tapeColor}
            onChange={(e) => setTapeColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer"
            title="Couleur du ruban"
          />
        </div>
      )}

      {/* Scanner & Personnaliser */}
      <div className="ml-auto flex items-center gap-1.5">
        {onScanner && (
          <button
            type="button"
            onClick={onScanner}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-forma-border hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
            title="Scanner caméra"
          >
            📷
          </button>
        )}
        {onCustomize && (
          <button
            type="button"
            onClick={onCustomize}
            className="text-xs px-2 py-1.5 rounded-lg border border-forma-border text-forma-muted hover:text-forma-accent hover:border-forma-accent transition-colors"
          >
            ···
          </button>
        )}
      </div>
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
    <div className="flex gap-1 items-center">
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onPick(c)}
          title={c}
          className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${
            active === c
              ? 'ring-2 ring-offset-1 ring-forma-accent shadow-md scale-110'
              : 'ring-1 ring-gray-300 dark:ring-gray-600'
          }`}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  )
}
