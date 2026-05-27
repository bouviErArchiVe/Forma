/** PROFORMA — historique undo/redo */

import { PF_HISTORY_MAX } from './constants'

export function createHistoryState(strokes, layers, activeLayerId) {
  return {
    strokes: JSON.parse(JSON.stringify(strokes || [])),
    layers: JSON.parse(JSON.stringify(layers || [])),
    activeLayerId,
  }
}

export function pushHistory(history, snapshot) {
  const past = [...(history.past || []), createHistoryState(snapshot.strokes, snapshot.layers, snapshot.activeLayerId)]
  if (past.length > PF_HISTORY_MAX) past.shift()
  return { past, future: [] }
}

export function undoHistory(history, current) {
  const past = [...(history.past || [])]
  if (!past.length) return { history, doc: current, changed: false }
  const prev = past.pop()
  const future = [createHistoryState(current.strokes, current.layers, current.activeLayerId), ...(history.future || [])]
  return {
    history: { past, future },
    doc: { ...current, ...prev },
    changed: true,
  }
}

export function redoHistory(history, current) {
  const future = [...(history.future || [])]
  if (!future.length) return { history, doc: current, changed: false }
  const next = future.shift()
  const past = [...(history.past || []), createHistoryState(current.strokes, current.layers, current.activeLayerId)]
  return {
    history: { past, future },
    doc: { ...current, ...next },
    changed: true,
  }
}
