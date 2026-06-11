import { useCallback } from 'react'
import { indexPageInk } from '../lib/handwriting-index'
import { schedulePageSave } from '../services/autosave'
import type { Page } from '../types'

interface UseEditorOCROptions {
  /** Whether incremental OCR indexing is enabled */
  enabled: boolean
  /** Callback to update the page list when inkText is filled in */
  onInkTextReady: (pageId: string, inkText: string) => void
}

interface UseEditorOCRResult {
  /**
   * Call this on every page change.
   * When the page has ≥ 8 strokes and no inkText yet, it triggers background
   * OCR indexing and calls `onInkTextReady` with the result.
   */
  maybeIndexPage: (page: Page) => void
}

/**
 * Handles incremental (background) OCR indexing of handwritten pages.
 *
 * Extracted from EditorPage.handlePageChange. The threshold of 8 strokes
 * matches the original heuristic to avoid indexing nearly-empty pages.
 */
export function useEditorOCR({ enabled, onInkTextReady }: UseEditorOCROptions): UseEditorOCRResult {
  const maybeIndexPage = useCallback(
    (page: Page) => {
      if (!enabled) return
      if (page.strokes.length >= 8 && !page.inkText?.trim()) {
        void indexPageInk(page).then((text) => {
          if (text.trim()) {
            const patched = { ...page, inkText: text }
            onInkTextReady(page.id, text)
            schedulePageSave(patched)
          }
        })
      }
    },
    [enabled, onInkTextReady],
  )

  return { maybeIndexPage }
}
