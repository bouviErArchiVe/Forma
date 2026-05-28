import { saveLocalDataAsync, hashPayload, isOnline } from './localVault'
import { appendJournalEntry, commitJournalEntry } from './journal'
import { maybeSaveVersion, saveVersionNow } from './versions'
import { enqueueCloudSync } from './cloudQueue'
import { saveNotebookPagesIdb } from './idbVault'
import { notifyFormaCloudDirty } from '@/lib/formacloud/queue'
import useFormaCloudStore from '@/stores/useFormaCloudStore'

/**
 * Sauvegarde prioritaire locale (IndexedDB + miroir LS), puis cloud optionnel.
 */
export async function saveResource({
  storageKey,
  payload,
  resourceType,
  resourceId,
  label,
  cloudEnabled = false,
  cloudSyncFn,
  versionSnapshots = true,
  forceVersion = false,
  notebookId,
}) {
  const hash = hashPayload(payload)
  const journalId = appendJournalEntry({
    resourceType,
    resourceId,
    label,
    payloadHash: hash,
  })

  const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload)

  // 1. IndexedDB + localStorage (priorité appareil)
  await saveLocalDataAsync(storageKey, serialized)

  if (notebookId && storageKey.startsWith('forma_pages_')) {
    const pages = typeof payload === 'string' ? JSON.parse(payload) : payload
    await saveNotebookPagesIdb(notebookId, pages)
  }

  commitJournalEntry(journalId)

  // 2. Version locale
  if (versionSnapshots) {
    if (forceVersion) await saveVersionNow(resourceType, resourceId, payload, label)
    else await maybeSaveVersion(resourceType, resourceId, payload, label)
  }

  // 3. Cloud optionnel (non bloquant)
  let cloudQueued = false
  if (cloudEnabled && cloudSyncFn && isOnline()) {
    try {
      await cloudSyncFn()
    } catch (err) {
      console.warn('Cloud sync deferred:', err?.message)
      enqueueCloudSync({ resourceType, resourceId, label })
      cloudQueued = true
    }
  } else if (cloudEnabled && cloudSyncFn) {
    enqueueCloudSync({ resourceType, resourceId, label })
    cloudQueued = true
  }

  notifyFormaCloudDirty(async () => {
    const s = useFormaCloudStore.getState()
    if (s.connected && s.autoSync) {
      const { processFormaCloudQueueIfNeeded } = await import('@/lib/formacloud/sync')
      processFormaCloudQueueIfNeeded(useFormaCloudStore).catch(() => {})
    }
  })

  return { savedAt: Date.now(), local: true, cloudQueued }
}

export { isOnline }
