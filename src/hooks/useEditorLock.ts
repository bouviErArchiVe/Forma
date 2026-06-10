import { useState, useCallback } from 'react'
import { hasNotebookPin } from '../services/lock'

interface UseEditorLockOptions {
  notebookId: string | undefined
}

interface UseEditorLockResult {
  /** null = not yet loaded, true = has PIN and still locked, false = no PIN */
  locked: boolean | null
  /** true once the user has unlocked (or there was no PIN) */
  unlocked: boolean
  /** Call this after loading a notebook to initialise the lock state */
  initLock: () => Promise<void>
  /** Call this when the user successfully enters their PIN */
  onUnlock: () => void
}

/**
 * Manages the notebook PIN-lock state.
 *
 * `initLock` is meant to be called inside the `load` function of EditorPage
 * after the notebook has been fetched, so it can check whether a PIN exists.
 */
export function useEditorLock({ notebookId }: UseEditorLockOptions): UseEditorLockResult {
  const [locked, setLocked] = useState<boolean | null>(null)
  const [unlocked, setUnlocked] = useState(false)

  const initLock = useCallback(async () => {
    if (!notebookId) return
    const pin = await hasNotebookPin(notebookId)
    setLocked(pin)
    if (!pin) setUnlocked(true)
  }, [notebookId])

  const onUnlock = useCallback(() => {
    setUnlocked(true)
  }, [])

  return { locked, unlocked, initLock, onUnlock }
}
