import { describe, expect, it, beforeEach } from 'vitest'
import { useEditorStore } from './editorStore'

beforeEach(() => {
  // Reset store to initial state between tests
  useEditorStore.setState({
    activeTool: 'pen',
    lastStickyTool: 'pen',
    readMode: false,
  })
})

describe('editorStore — sticky/transient tool logic', () => {
  it('setTool sticky: updates activeTool and lastStickyTool', () => {
    useEditorStore.getState().setTool('pencil')
    const s = useEditorStore.getState()
    expect(s.activeTool).toBe('pencil')
    expect(s.lastStickyTool).toBe('pencil')
  })

  it('setTool transient: changes activeTool but preserves lastStickyTool', () => {
    useEditorStore.getState().setTool('pencil')
    useEditorStore.getState().setTool('shapes')
    const s = useEditorStore.getState()
    expect(s.activeTool).toBe('shapes')
    expect(s.lastStickyTool).toBe('pencil')
  })

  it('restoreStickyTool: returns to lastStickyTool after transient (pencil → shapes → pencil)', () => {
    useEditorStore.getState().setTool('pencil')
    useEditorStore.getState().setTool('shapes')
    useEditorStore.getState().restoreStickyTool()
    expect(useEditorStore.getState().activeTool).toBe('pencil')
  })

  it('restoreStickyTool: returns to highlighter after transient (highlighter → shapes → highlighter)', () => {
    useEditorStore.getState().setTool('highlighter')
    useEditorStore.getState().setTool('shapes')
    useEditorStore.getState().restoreStickyTool()
    expect(useEditorStore.getState().activeTool).toBe('highlighter')
  })

  it('restoreStickyTool: returns to eraser after elements (eraser → elements → eraser)', () => {
    useEditorStore.getState().setTool('eraser')
    useEditorStore.getState().setTool('elements')
    useEditorStore.getState().restoreStickyTool()
    expect(useEditorStore.getState().activeTool).toBe('eraser')
  })

  it('restoreStickyTool: falls back to pen if lastStickyTool is not sticky', () => {
    // Force an invalid lastStickyTool (defensive)
    useEditorStore.setState({ lastStickyTool: 'shapes' as any })
    useEditorStore.getState().restoreStickyTool()
    expect(useEditorStore.getState().activeTool).toBe('pen')
  })

  it('setTool sticky: exits readMode', () => {
    useEditorStore.setState({ readMode: true })
    useEditorStore.getState().setTool('pen')
    expect(useEditorStore.getState().readMode).toBe(false)
  })
})
