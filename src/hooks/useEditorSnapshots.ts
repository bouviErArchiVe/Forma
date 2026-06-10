import { useCallback, useRef } from 'react'
import { createPageSnapshot } from '../services/page-snapshots'
import type { Page } from '../types'

interface UseEditorSnapshotsOptions {
  /** Whether auto-snapshots are enabled (from settings) */
  enabled: boolean
}

interface UseEditorSnapshotsResult {
  /** Schedule an auto-snapshot 90 s after the last page change */
  scheduleAutoSnapshot: (page: Page) => void
}

/**
 * Manages debounced automatic page snapshots.
 *
 * When `enabled` is true, calling `scheduleAutoSnapshot(page)` sets a 90-second
 * timer. Each new call resets the timer so only one snapshot is taken per
 * 90-second idle window.
 */
export function useEditorSnapshots({ enabled }: UseEditorSnapshotsOptions): UseEditorSnapshotsResult {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleAutoSnapshot = useCallback(
    (page: Page) => {
      if (!enabled) return
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        void createPageSnapshot(page, 'Auto')
      }, 90_000)
    },
    [enabled],
  )

  return { scheduleAutoSnapshot }
}
