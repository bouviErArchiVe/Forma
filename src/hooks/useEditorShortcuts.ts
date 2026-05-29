import { useEffect } from 'react'
import { useEditorStore } from '../stores/editorStore'
import type { ToolType } from '../types'

const MAP: Record<string, ToolType> = {
  p: 'pen',
  c: 'pencil',
  h: 'highlighter',
  e: 'eraser',
  l: 'lasso',
  s: 'shapes',
  t: 'text',
  i: 'image',
  m: 'elements',
  r: 'tape',
  k: 'laser',
}

export function useEditorShortcuts(opts?: {
  onPrevPage?: () => void
  onNextPage?: () => void
  onPrint?: () => void
  onShowHelp?: () => void
  onDuplicatePage?: () => void
  onSaveSnapshot?: () => void
  onFind?: () => void
  onFirstPage?: () => void
  onLastPage?: () => void
  onFocusMode?: () => void
}) {
  const { setTool, toggleReadMode } = useEditorStore()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return
      }
      const key = e.key.toLowerCase()
      if (MAP[key] && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        setTool(MAP[key])
      }
      if (key === 'r' && e.shiftKey) {
        e.preventDefault()
        toggleReadMode()
      }
      if (e.key === 'ArrowLeft' && e.altKey) {
        e.preventDefault()
        opts?.onPrevPage?.()
      }
      if (e.key === 'ArrowRight' && e.altKey) {
        e.preventDefault()
        opts?.onNextPage?.()
      }
      if ((e.ctrlKey || e.metaKey) && key === 'p') {
        e.preventDefault()
        opts?.onPrint?.()
      }
      if (e.key === '?' || (key === '/' && e.shiftKey)) {
        e.preventDefault()
        opts?.onShowHelp?.()
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 'd') {
        e.preventDefault()
        opts?.onDuplicatePage?.()
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 's') {
        e.preventDefault()
        opts?.onSaveSnapshot?.()
      }
      if ((e.ctrlKey || e.metaKey) && key === 'f') {
        e.preventDefault()
        opts?.onFind?.()
      }
      if (e.key === 'Home') {
        e.preventDefault()
        opts?.onFirstPage?.()
      }
      if (e.key === 'End') {
        e.preventDefault()
        opts?.onLastPage?.()
      }
      if (e.key === '`' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        opts?.onFocusMode?.()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setTool, toggleReadMode, opts])
}
