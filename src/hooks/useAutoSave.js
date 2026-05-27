import { useCallback, useRef, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  isLocalNotebookId,
  upsertLocalNotebook,
  saveLocalPage,
  loadLocalPages,
} from '@/lib/projectPersistence'
import { saveResource } from '@/lib/sync/engine'
import { syncNotebookPageToCloud, saveCloudSnapshot } from '@/lib/sync/cloudSync'
import { enqueueCloudSync } from '@/lib/sync/cloudQueue'
import { RESOURCE_TYPES, SYNC_STATUS } from '@/lib/sync/constants'
import useSyncStore from '@/stores/useSyncStore'

/**
 * Autosave debounced — local-first, cloud optionnel.
 * idle | dirty | saving | saved_local | syncing_cloud | synced | offline | error
 */
export function useAutoSave({
  notebookId,
  pageId,
  pageNum,
  readOnly,
  buildPagePayload,
  onPagesUpdate,
  onNotebookTouch,
  userId,
}) {
  const timer = useRef(null)
  const lastPayloadRef = useRef(null)
  const savingRef = useRef(false)
  const pendingSaveRef = useRef(false)
  const lastSavedAtRef = useRef(null)
  const buildPagePayloadRef = useRef(buildPagePayload)
  buildPagePayloadRef.current = buildPagePayload

  const cloudEnabled = useSyncStore((s) => s.cloudEnabled)
  const autoCloudSync = useSyncStore((s) => s.autoCloudSync)
  const versionSnapshots = useSyncStore((s) => s.versionSnapshots)
  const setLastLocalSaveAt = useSyncStore((s) => s.setLastLocalSaveAt)
  const setLastCloudSyncAt = useSyncStore((s) => s.setLastCloudSyncAt)
  const setGlobalStatus = useSyncStore((s) => s.setGlobalStatus)

  const [status, setStatus] = useState(SYNC_STATUS.idle)
  const [lastSavedAt, setLastSavedAt] = useState(null)

  const cancelScheduledSave = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }, [])

  const markDirty = useCallback(() => {
    setStatus((s) => (s === SYNC_STATUS.saving ? s : SYNC_STATUS.dirty))
  }, [])

  const buildPageRecord = useCallback(() => {
    const payload = buildPagePayloadRef.current?.()
    if (!payload) return null
    const now = new Date().toISOString()
    return {
      id: pageId,
      page_number: pageNum,
      notebook_id: notebookId,
      elements: payload.elements,
      canvas_data: payload.canvas_data,
      updated_at: now,
    }
  }, [pageId, pageNum, notebookId])

  const syncLocalBackup = useCallback(() => {
    if (!pageId || !notebookId || readOnly) return
    const pageRecord = buildPageRecord()
    if (!pageRecord) return
    try {
      saveLocalPage(notebookId, pageRecord, loadLocalPages(notebookId))
      upsertLocalNotebook({ id: notebookId, updated_at: pageRecord.updated_at, ...(onNotebookTouch?.() || {}) })
      lastPayloadRef.current = `${pageRecord.elements}|${pageRecord.canvas_data}`
    } catch { /* quota */ }
  }, [pageId, notebookId, readOnly, buildPageRecord, onNotebookTouch])

  const saveNow = useCallback(async () => {
    if (!pageId || !notebookId || readOnly) return false
    if (savingRef.current) {
      pendingSaveRef.current = true
      return false
    }
    cancelScheduledSave()

    const pageRecord = buildPageRecord()
    if (!pageRecord) return false

    const payloadKey = `${pageRecord.elements}|${pageRecord.canvas_data}`
    if (payloadKey === lastPayloadRef.current) {
      setStatus(lastSavedAtRef.current ? SYNC_STATUS.saved_local : SYNC_STATUS.idle)
      return true
    }

    savingRef.current = true
    setStatus(SYNC_STATUS.saving)
    setGlobalStatus(SYNC_STATUS.saving)

    const resourceId = `${notebookId}::${pageId}`
    const storageKey = `forma_pages_${notebookId}`

    try {
      // ── 1. LOCAL FIRST (priorité appareil) ──
      const existing = loadLocalPages(notebookId)
      const all = saveLocalPage(notebookId, pageRecord, existing)
      const prev = existing.find((p) => p.id === pageId)
      const changed = !prev
        || prev.elements !== pageRecord.elements
        || prev.canvas_data !== pageRecord.canvas_data
      if (changed) onPagesUpdate?.(all)
      upsertLocalNotebook({
        id: notebookId,
        updated_at: pageRecord.updated_at,
        pages_count: all.length || pageNum,
        ...(onNotebookTouch?.() || {}),
      })

      await saveResource({
        storageKey,
        payload: all,
        resourceType: RESOURCE_TYPES.notebook_page,
        resourceId,
        label: `Page ${pageNum}`,
        cloudEnabled: false,
        versionSnapshots,
      })

      lastPayloadRef.current = payloadKey
      const savedAt = new Date()
      lastSavedAtRef.current = savedAt
      setLastSavedAt(savedAt)
      setLastLocalSaveAt(savedAt)
      setStatus(SYNC_STATUS.saved_local)
      setGlobalStatus(SYNC_STATUS.saved_local)

      // ── 2. CLOUD OPTIONNEL (après local) ──
      const { data: { session } } = await supabase.auth.getSession()
      const useCloud = cloudEnabled && autoCloudSync && session?.user && !isLocalNotebookId(notebookId)

      if (useCloud) {
        setStatus(SYNC_STATUS.syncing_cloud)
        setGlobalStatus(SYNC_STATUS.syncing_cloud)
        try {
          await syncNotebookPageToCloud(pageId, notebookId, pageRecord)
          if (userId) {
            saveCloudSnapshot({
              userId,
              resourceType: RESOURCE_TYPES.notebook_page,
              resourceId,
              payload: pageRecord,
              label: `Page ${pageNum}`,
            }).catch(() => {})
          }
          setLastCloudSyncAt(new Date())
          setStatus(SYNC_STATUS.synced)
          setGlobalStatus(SYNC_STATUS.synced)
        } catch (err) {
          console.warn('Cloud sync deferred:', err?.message)
          enqueueCloudSync({
            resourceType: RESOURCE_TYPES.notebook_page,
            resourceId,
            label: `Page ${pageNum}`,
          })
          setStatus(SYNC_STATUS.offline)
          setGlobalStatus(SYNC_STATUS.offline)
        }
      }

      savingRef.current = false
      if (pendingSaveRef.current) {
        pendingSaveRef.current = false
        return saveNow()
      }
      return true
    } catch (err) {
      console.warn('Autosave failed:', err?.message)
      try {
        syncLocalBackup()
        lastPayloadRef.current = payloadKey
        const savedAt = new Date()
        lastSavedAtRef.current = savedAt
        setLastSavedAt(savedAt)
        setLastLocalSaveAt(savedAt)
        setStatus(SYNC_STATUS.offline)
        setGlobalStatus(SYNC_STATUS.offline)
        savingRef.current = false
        if (pendingSaveRef.current) {
          pendingSaveRef.current = false
          return saveNow()
        }
        return true
      } catch {
        setStatus(SYNC_STATUS.error)
        setGlobalStatus(SYNC_STATUS.error)
        savingRef.current = false
        pendingSaveRef.current = false
        return false
      }
    }
  }, [
    pageId, notebookId, pageNum, readOnly, buildPageRecord, onPagesUpdate, onNotebookTouch,
    cancelScheduledSave, cloudEnabled, autoCloudSync, versionSnapshots,
    setLastLocalSaveAt, setLastCloudSyncAt, setGlobalStatus, syncLocalBackup, userId,
  ])

  const scheduleSave = useCallback(() => {
    markDirty()
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => saveNow(), 1200)
  }, [saveNow, markDirty])

  useEffect(() => {
    cancelScheduledSave()
    pendingSaveRef.current = false
    lastPayloadRef.current = null
    lastSavedAtRef.current = null
    setStatus(SYNC_STATUS.idle)
    setLastSavedAt(null)
  }, [pageId, cancelScheduledSave])

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  useEffect(() => {
    const flush = () => {
      if (timer.current) {
        clearTimeout(timer.current)
        timer.current = null
      }
      saveNow()
    }
    const onHidden = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    const onBeforeUnload = () => {
      if (timer.current) {
        clearTimeout(timer.current)
        timer.current = null
      }
      syncLocalBackup()
    }
    document.addEventListener('visibilitychange', onHidden)
    window.addEventListener('pagehide', onBeforeUnload)
    return () => {
      document.removeEventListener('visibilitychange', onHidden)
      window.removeEventListener('pagehide', onBeforeUnload)
    }
  }, [saveNow, syncLocalBackup])

  return { saveNow, scheduleSave, cancelScheduledSave, status, lastSavedAt, markDirty, syncLocalBackup }
}
