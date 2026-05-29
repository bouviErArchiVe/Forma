import { computeOverlayDirtyClip, type OverlayDirtyInput } from '../lib/dirty-rect'
import type { InkClip } from '../lib/page-render'
import type { Page, SelectionItem } from '../types'
import { getSelectionRotationHandle, selectionBounds } from '../lib/selection-engine'

export interface OverlayInteractionState {
  lasso: { x: number; y: number; w: number; h: number } | null
  prevLasso: { x: number; y: number; w: number; h: number } | null
  selection: SelectionItem[]
  page: Page
  dragOffset: { x: number; y: number } | null
  tapePreview: { x: number; y: number; w: number; h: number } | null
  dragGhostBounds: { x: number; y: number; w: number; h: number } | null
}

/** Calcule le clip overlay pour lasso, sélection, rotation, ruban adhésif, ghost drag. */
export function buildOverlayInteractionClip(
  state: OverlayInteractionState,
  padding = 12,
  pageWidth: number,
  pageHeight: number,
): InkClip | undefined {
  const selBounds =
    state.selection.length ?
      selectionBounds(state.page, state.selection, state.dragOffset ?? undefined)
    : null
  const rotHandle = getSelectionRotationHandle(
    state.page,
    state.selection,
    state.dragOffset ?? undefined,
  )
  const input: OverlayDirtyInput = {
    lasso: state.lasso,
    prevLasso: state.prevLasso,
    selectionBounds: selBounds,
    rotationHandle: rotHandle ? { x: rotHandle.x, y: rotHandle.y } : null,
    tapePreview: state.tapePreview,
    dragGhostBounds: state.dragGhostBounds,
  }
  return computeOverlayDirtyClip(input, padding, pageWidth, pageHeight)
}
