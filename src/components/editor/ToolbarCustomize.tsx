import { useEditorStore } from '../../stores/editorStore'
import { DEFAULT_TOOLBAR, type ToolType } from '../../types'

const ALL: ToolType[] = DEFAULT_TOOLBAR

export function ToolbarCustomize({ onClose }: { onClose: () => void }) {
  const { toolbarOrder, setToolbarOrder } = useEditorStore()

  const toggle = (tool: ToolType) => {
    if (toolbarOrder.includes(tool)) {
      if (toolbarOrder.length <= 3) return
      setToolbarOrder(toolbarOrder.filter((t) => t !== tool))
    } else {
      setToolbarOrder([...toolbarOrder, tool])
    }
  }

  const move = (tool: ToolType, dir: -1 | 1) => {
    const i = toolbarOrder.indexOf(tool)
    if (i < 0) return
    const j = i + dir
    if (j < 0 || j >= toolbarOrder.length) return
    const next = [...toolbarOrder]
    ;[next[i], next[j]] = [next[j], next[i]]
    setToolbarOrder(next)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5">
        <h3 className="font-semibold mb-3">Barre d'outils</h3>
        <ul className="space-y-2 max-h-80 overflow-y-auto">
          {ALL.map((tool) => {
            const on = toolbarOrder.includes(tool)
            const idx = toolbarOrder.indexOf(tool)
            return (
              <li key={tool} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={on} onChange={() => toggle(tool)} />
                <span className="flex-1 capitalize">{tool}</span>
                {on && (
                  <>
                    <button type="button" onClick={() => move(tool, -1)} className="px-1">
                      ↑
                    </button>
                    <button type="button" onClick={() => move(tool, 1)} className="px-1">
                      ↓
                    </button>
                    <span className="text-forma-muted text-xs">{idx + 1}</span>
                  </>
                )}
              </li>
            )
          })}
        </ul>
        <button
          type="button"
          className="mt-4 w-full py-2 border rounded-lg text-sm"
          onClick={() => setToolbarOrder([...DEFAULT_TOOLBAR])}
        >
          Réinitialiser la barre
        </button>
        <button type="button" onClick={onClose} className="mt-2 w-full py-2 bg-forma-accent text-white rounded-lg">
          Terminé
        </button>
      </div>
    </div>
  )
}
