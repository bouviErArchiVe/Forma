/** FormaSync — moteur local-first */

import { saveLocalData, hashPayload, isOnline } from './localVault'
import { appendJournalEntry, commitJournalEntry } from './journal'
import { maybeSaveVersion, saveVersionNow } from './versions'
import { enqueueCloudSync } from './cloudQueue'

/**
 * Sauvegarde prioritaire locale, puis cloud optionnel.
 * @returns {{ savedAt: number, local: boolean, cloudQueued: boolean }}
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
}) {
  const hash = hashPayload(payload)
  const journalId = appendJournalEntry({
    resourceType,
    resourceId,
    label,
    payloadHash: hash,
  })

  // 1. Local immédiat (priorité appareil)
  const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload)
  saveLocalData(storageKey, serialized)
  commitJournalEntry(journalId)

  // 2. Version locale
  if (versionSnapshots) {
    if (forceVersion) saveVersionNow(resourceType, resourceId, payload, label)
    else maybeSaveVersion(resourceType, resourceId, payload, label)
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

  return { savedAt: Date.now(), local: true, cloudQueued }
}

export { isOnline }
