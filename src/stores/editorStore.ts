import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { EditorSettings, ShapeType, ToolPreset, ToolType } from '../types'
import { DEFAULT_TOOLBAR, DEFAULT_TOOL_PRESETS } from '../types'

const STICKY_TOOLS: ToolType[] = [
  'pen',
  'pencil',
  'highlighter',
  'eraser',
  'lasso',
  'tape',
  'laser',
]
const TRANSIENT_TOOLS: ToolType[] = ['shapes', 'text', 'image', 'elements']

interface EditorState extends EditorSettings {
  lastStickyTool: ToolType
  penPresets: ToolPreset[]
  setTool: (tool: ToolType) => void
  restoreStickyTool: () => void
  applyPreset: (index: number) => void
  saveCurrentToPreset: (index: number) => void
  setShapeType: (t: ShapeType) => void
  setPenColor: (color: string) => void
  setPenWidth: (width: number) => void
  setPencilColor: (color: string) => void
  setPencilWidth: (width: number) => void
  setHighlighterColor: (color: string) => void
  setHighlighterWidth: (width: number) => void
  setEraserSize: (size: number) => void
  setEraserMode: (mode: EditorSettings['eraserMode']) => void
  setTapeColor: (color: string) => void
  setToolbarOrder: (order: ToolType[]) => void
  toggleReadMode: () => void
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      activeTool: 'pen',
      lastStickyTool: 'pen',
      shapeType: 'rectangle',
      penColor: '#000000',
      penWidth: 2,
      pencilColor: '#374151',
      pencilWidth: 1.5,
      highlighterColor: '#fef08a',
      highlighterWidth: 20,
      eraserSize: 24,
      eraserMode: 'all',
      tapeColor: '#fde68a',
      readMode: false,
      toolbarOrder: DEFAULT_TOOLBAR,
      penPresets: DEFAULT_TOOL_PRESETS,
      setTool: (tool) => {
        if (STICKY_TOOLS.includes(tool)) {
          set({ activeTool: tool, lastStickyTool: tool, readMode: false })
        } else if (TRANSIENT_TOOLS.includes(tool)) {
          const sticky = get().lastStickyTool
          set({ activeTool: tool, readMode: false })
          if (!STICKY_TOOLS.includes(sticky)) {
            set({ lastStickyTool: 'pen' })
          }
        } else {
          set({ activeTool: tool, readMode: false })
        }
      },
      restoreStickyTool: () => {
        const t = get().lastStickyTool
        set({ activeTool: STICKY_TOOLS.includes(t) ? t : 'pen' })
      },
      setShapeType: (shapeType) => set({ shapeType }),
      setPenColor: (penColor) => set({ penColor }),
      setPenWidth: (penWidth) => set({ penWidth }),
      setPencilColor: (pencilColor) => set({ pencilColor }),
      setPencilWidth: (pencilWidth) => set({ pencilWidth }),
      setHighlighterColor: (highlighterColor) => set({ highlighterColor }),
      setHighlighterWidth: (highlighterWidth) => set({ highlighterWidth }),
      setEraserSize: (eraserSize) => set({ eraserSize }),
      setEraserMode: (eraserMode) => set({ eraserMode }),
      setTapeColor: (tapeColor) => set({ tapeColor }),
      setToolbarOrder: (toolbarOrder) => set({ toolbarOrder }),
      toggleReadMode: () =>
        set((s) => ({
          readMode: !s.readMode,
        })),
      applyPreset: (index) => {
        const presets = get().penPresets?.length ? get().penPresets : DEFAULT_TOOL_PRESETS
        const p = presets[index]
        if (!p) return
        set({
          activeTool: p.tool,
          lastStickyTool: p.tool,
          readMode: false,
          penColor: p.tool === 'pen' ? p.color : get().penColor,
          penWidth: p.tool === 'pen' ? p.width : get().penWidth,
          pencilColor: p.tool === 'pencil' ? p.color : get().pencilColor,
          pencilWidth: p.tool === 'pencil' ? p.width : get().pencilWidth,
          highlighterColor: p.tool === 'highlighter' ? p.color : get().highlighterColor,
          highlighterWidth: p.tool === 'highlighter' ? p.width : get().highlighterWidth,
        })
      },
      saveCurrentToPreset: (index) => {
        const s = get()
        const tool =
          s.activeTool === 'pen' || s.activeTool === 'pencil' || s.activeTool === 'highlighter'
            ? s.activeTool
            : s.lastStickyTool === 'pencil' || s.lastStickyTool === 'highlighter'
              ? s.lastStickyTool
              : 'pen'
        const preset: ToolPreset =
          tool === 'pencil'
            ? { tool: 'pencil', color: s.pencilColor, width: s.pencilWidth }
            : tool === 'highlighter'
              ? { tool: 'highlighter', color: s.highlighterColor, width: s.highlighterWidth }
              : { tool: 'pen', color: s.penColor, width: s.penWidth }
        const next = [...(s.penPresets?.length ? s.penPresets : DEFAULT_TOOL_PRESETS)]
        next[index] = preset
        set({ penPresets: next })
      },
    }),
    {
      name: 'forma-editor',
      partialize: (s) => ({
        toolbarOrder: s.toolbarOrder,
        penPresets: s.penPresets,
        penColor: s.penColor,
        penWidth: s.penWidth,
        pencilColor: s.pencilColor,
        pencilWidth: s.pencilWidth,
        highlighterColor: s.highlighterColor,
        highlighterWidth: s.highlighterWidth,
      }),
    },
  ),
)
