import { useCallback, useRef, useEffect, useState } from 'react'
import { saveResource } from '@/lib/sync/engine'
import { enqueueOfflineSave, getOfflineQueueCount } from '@/lib/sync/offlineQueue'
import { SYNC_STATUS, AUTOSAVE_DEBOUNCE_MS, RESOURCE_TYPES } from '@/lib/sync/constants'
import useSyncStore from '@/stores/useSyncStore'

/**
 * Autosave générique pour modules Forma (Combine, Present, Review…).
 * IndexedDB local-first, versions, cloud optionnel.
 */
export function useModuleSync({
  resourceType,
  resourceId,
  storageKey,
  getPayload,
  enabled = true,
  debounceMs = AUTOSAVE_DEBOUNCE_MS,
}) {
  const timer = useRef(null)
  const lastHash = useRef(null)
  const saving = useRef(false)
  const pendingRef = useRef(false)
  const [status, setStatus] = useState(SYNC_STATUS.idle)
  const [lastSavedAt, setLastSavedAt] = useState(null)

  const cloudEnabled = useSyncStore((s) => s.cloudEnabled)
  const versionSnapshots = useSyncStore((s) => s.versionSnapshots)
  const setLastLocalSaveAt = useSyncStore((s) => s.setLastLocalSaveAt)
  const setGlobalStatus = useSyncStore((s) => s.setGlobalStatus)
  const setOfflineQueueCount = useSyncStore((s) => s.setOfflineQueueCount)
  const setSyncError = useSyncStore((s) => s.setSyncError)

  const saveNow = useCallback(async (forceVersion = false) => {
    if (!enabled || !resourceId || !storageKey) return false
    const payload = getPayload?.()
    if (payload == null) return false

    if (saving.current) {
      pendingRef.current = true
      return false
    }
    saving.current = true
    setStatus(SYNC_STATUS.saving)
    setGlobalStatus(SYNC_STATUS.saving)
    setSyncError(null)

    try {
      const result = await saveResource({
        storageKey,
        payload,
        resourceType: resourceType || RESOURCE_TYPES.combine,
        resourceId,
        label: resourceId,
        cloudEnabled: false,
        versionSnapshots,
        forceVersion,
      })
      lastHash.current = JSON.stringify(payload).length
      const at = new Date(result.savedAt)
      setLastSavedAt(at)
      setLastLocalSaveAt(at)
      setStatus(SYNC_STATUS.saved_local)
      setGlobalStatus(SYNC_STATUS.saved_local)
      setOfflineQueueCount(getOfflineQueueCount())
      saving.current = false
      if (pendingRef.current) {
        pendingRef.current = false
        return saveNow(forceVersion)
      }
      return true
    } catch (err) {
      try {
        enqueueOfflineSave({
          storageKey,
          payload,
          resourceType: resourceType || RESOURCE_TYPES.combine,
          resourceId,
          label: resourceId,
        })
        setOfflineQueueCount(getOfflineQueueCount())
        setStatus(SYNC_STATUS.offline)
        setGlobalStatus(SYNC_STATUS.offline)
      } catch {
        setStatus(SYNC_STATUS.error)
        setGlobalStatus(SYNC_STATUS.error)
        setSyncError(err?.message || 'Erreur sauvegarde')
      }
      saving.current = false
      pendingRef.current = false
      return false
    }
  }, [enabled, resourceId, storageKey, getPayload, versionSnapshots, setLastLocalSaveAt, setGlobalStatus, setOfflineQueueCount, setSyncError, resourceType])

  const scheduleSave = useCallback(() => {
    setStatus((s) => (s === SYNC_STATUS.saving ? s : SYNC_STATUS.dirty))
    setGlobalStatus(SYNC_STATUS.dirty)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => saveNow(), debounceMs)
  }, [saveNow, debounceMs, setGlobalStatus])

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  useEffect(() => {
    const flush = () => {
      if (timer.current) { clearTimeout(timer.current); timer.current = null }
      saveNow()
    }
    const onHide = () => { if (document.visibilityState === 'hidden') flush() }
    const onPageHide = () => flush()
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', onPageHide)
    window.addEventListener('beforeunload', onPageHide)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', onPageHide)
      window.removeEventListener('beforeunload', onPageHide)
    }
  }, [saveNow])

  return { saveNow, scheduleSave, status, lastSavedAt }
}
