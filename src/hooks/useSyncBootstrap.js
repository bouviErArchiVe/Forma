import { useCallback, useEffect } from 'react'
import useSyncStore from '@/stores/useSyncStore'
import { getPendingRecovery, clearOldJournal } from '@/lib/sync/journal'
import { getCloudQueueCount, processCloudQueue } from '@/lib/sync/cloudQueue'
import { getOfflineQueueCount, processOfflineQueue } from '@/lib/sync/offlineQueue'
import { getFormaCloudQueueCount, processFormaCloudQueueIfNeeded } from '@/lib/formacloud/sync'
import useFormaCloudStore from '@/stores/useFormaCloudStore'
import { migrateLocalStorageToIdb, hydrateFromIdb } from '@/lib/sync/idbVault'
import { hydrateProjectStore } from '@/lib/projectPersistence'
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
  const setOfflineQueueCount = useSyncStore((s) => s.setOfflineQueueCount)
  const setLastCloudSyncAt = useSyncStore((s) => s.setLastCloudSyncAt)
  const setGlobalStatus = useSyncStore((s) => s.setGlobalStatus)

  const processQueues = useCallback(async () => {
    setGlobalStatus(SYNC_STATUS.saving)

    const offline = await processOfflineQueue()
    setOfflineQueueCount(getOfflineQueueCount())
    if (offline.processed > 0) {
      setGlobalStatus(SYNC_STATUS.saved_local)
    }

    if (cloudEnabled && autoCloudSync) {
      setGlobalStatus(SYNC_STATUS.syncing_cloud)
      const { processed } = await processCloudQueue(cloudHandlers, { cloudEnabled })
      setCloudQueueCount(getCloudQueueCount())
      if (processed > 0) {
        setLastCloudSyncAt(new Date())
        setGlobalStatus(SYNC_STATUS.synced)
      } else if (offline.processed === 0) {
        setGlobalStatus(SYNC_STATUS.saved_local)
      }
    } else if (offline.processed === 0) {
      setGlobalStatus(SYNC_STATUS.idle)
    }

    const formaCloud = useFormaCloudStore.getState()
    if (formaCloud.connected && formaCloud.autoSync && getFormaCloudQueueCount() > 0) {
      await processFormaCloudQueueIfNeeded(useFormaCloudStore)
    }
  }, [cloudEnabled, autoCloudSync, setCloudQueueCount, setOfflineQueueCount, setLastCloudSyncAt, setGlobalStatus])

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        await migrateLocalStorageToIdb()
        await hydrateFromIdb()
        await hydrateProjectStore()
      } catch (err) {
        console.warn('Sync init:', err?.message)
      }
      if (cancelled) return

      clearOldJournal()
      setRecoveryItems(getPendingRecovery())
      setCloudQueueCount(getCloudQueueCount())
      setOfflineQueueCount(getOfflineQueueCount())

      if (getPendingRecovery().length) {
        setGlobalStatus(SYNC_STATUS.offline)
      }

      await processQueues()
    }

    init()

    const onOnline = () => {
      setOnline(true)
      processQueues()
    }
    const onOffline = () => {
      setOnline(false)
      setGlobalStatus(SYNC_STATUS.offline)
    }

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    setOnline(navigator.onLine !== false)

    const interval = setInterval(() => {
      if (navigator.onLine) processQueues()
      setCloudQueueCount(getCloudQueueCount())
      setOfflineQueueCount(getOfflineQueueCount())
    }, 60_000)

    return () => {
      cancelled = true
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      clearInterval(interval)
    }
  }, [cloudEnabled, autoCloudSync, processQueues, setOnline, setRecoveryItems, setCloudQueueCount, setOfflineQueueCount, setGlobalStatus])
}
