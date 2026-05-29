import { useCallback, useRef } from 'react'
import { PageHistory } from '../../lib/page-history'

/** Undo/redo batch — extrait de PageCanvas (refactor 0.25.2). */
export function useCanvasHistory(onUndoRedoChange?: (canUndo: boolean, canRedo: boolean) => void) {
  const historyRef = useRef(new PageHistory())

  const notifyHistory = useCallback(() => {
    const h = historyRef.current
    onUndoRedoChange?.(h.canUndo(), h.canRedo())
  }, [onUndoRedoChange])

  const finishGestureHistory = useCallback(
    (committed: boolean) => {
      if (!historyRef.current.isBatching()) return
      if (committed) historyRef.current.endBatch()
      else historyRef.current.cancelBatch()
      notifyHistory()
    },
    [notifyHistory],
  )

  const resetHistory = useCallback(() => {
    historyRef.current.reset()
    notifyHistory()
  }, [notifyHistory])

  return { historyRef, notifyHistory, finishGestureHistory, resetHistory }
}
