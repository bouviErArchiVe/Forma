import { useEffect, useCallback } from 'react'
import useSyncStore from '@/stores/useSyncStore'
import { getPendingRecovery, clearOldJournal } from '@/lib/sync/journal'
import { getCloudQueueCount, processCloudQueue } from '@/lib/sync/cloudQueue'
import { syncNotebookPageToCloud } from '@/lib/sync/cloudSync'
import { loadLocalPages } from '@/lib/projectPersistence'
import { SYNC_STATUS } from '@/lib/sync/constants'

const cloudHandlers = {
  notebook_page: async (resourceId) => {
    const [notebookId, pageId] = resourceId.split('::')
    if (!notebookId || !pageId) return
    const pages = loadLocalPages(notebookId)
    const page = pages.find((p) => p.id === pageId)
    if (!page) return
    await syncNotebookPageToCloud(pageId, notebookId, page)
  },
}

export function useSyncBootstrap() {
  const cloudEnabled = useSyncStore((s) => s.cloudEnabled)
  const autoCloudSync = useSyncStore((s) => s.autoCloudSync)
  const setOnline = useSyncStore((s) => s.setOnline)
  const setRecoveryItems = useSyncStore((s) => s.setRecoveryItems)
  const setCloudQueueCount = useSyncStore((s) => s.setCloudQueueCount)
  const setLastCloudSyncAt = useSyncStore((s) => s.setLastCloudSyncAt)
  const setGlobalStatus = useSyncStore((s) => s.setGlobalStatus)

  const processQueue = useCallback(async () => {
    if (!cloudEnabled || !autoCloudSync) return
    setGlobalStatus(SYNC_STATUS.syncing_cloud)
    const { processed } = await processCloudQueue(cloudHandlers, { cloudEnabled })
    setCloudQueueCount(getCloudQueueCount())
    if (processed > 0) {
      setLastCloudSyncAt(new Date())
      setGlobalStatus(SYNC_STATUS.synced)
    }
  }, [cloudEnabled, autoCloudSync, setCloudQueueCount, setLastCloudSyncAt, setGlobalStatus])

  useEffect(() => {
    clearOldJournal()
    setRecoveryItems(getPendingRecovery())
    setCloudQueueCount(getCloudQueueCount())

    const onOnline = () => {
      setOnline(true)
      processQueue()
    }
    const onOffline = () => setOnline(false)

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    setOnline(navigator.onLine !== false)

    if (cloudEnabled && autoCloudSync) processQueue()

    const interval = setInterval(() => {
      if (cloudEnabled && autoCloudSync && navigator.onLine) processQueue()
      setCloudQueueCount(getCloudQueueCount())
    }, 60_000)

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      clearInterval(interval)
    }
  }, [cloudEnabled, autoCloudSync, processQueue, setOnline, setRecoveryItems, setCloudQueueCount])
}
