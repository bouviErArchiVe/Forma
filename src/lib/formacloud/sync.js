/** FormaCloud — orchestration sync */

import { buildFormaCloudSnapshot } from './collect'
import {
  connectFormaCloudProvider,
  disconnectFormaCloudProvider,
  syncToFormaCloudProvider,
  openFormaCloudFolder,
} from './providers'
import {
  notifyFormaCloudDirty,
  getFormaCloudQueueCount,
  clearFormaCloudQueue,
  markFormaCloudQueueDone,
  markFormaCloudQueueFailed,
  shouldProcessFormaCloudQueue,
} from './queue'
import { FORMA_CLOUD_STATUS } from './constants'
import { isOnline } from '@/lib/sync/localVault'

export {
  notifyFormaCloudDirty,
  getFormaCloudQueueCount,
  clearFormaCloudQueue,
}

export async function runFormaCloudSync(zustandStore, { force = false } = {}) {
  const state = zustandStore.getState()
  if (!state.connected || !state.provider) {
    return { ok: false, message: 'FormaCloud non connecté.' }
  }
  if (!isOnline()) {
    state.setStatus(FORMA_CLOUD_STATUS.offline)
    notifyFormaCloudDirty()
    return { ok: false, message: 'Hors ligne — sync reportée.' }
  }

  state.setStatus(FORMA_CLOUD_STATUS.syncing)
  state.setError(null)
  state.setConflict(null)

  try {
    const snapshot = buildFormaCloudSnapshot()
    const res = await syncToFormaCloudProvider(state.provider, {
      token: state.accessToken,
      tree: state.driveTree,
      snapshot,
      fileMap: state.fileMap || {},
      force,
    })

    if (res.conflict) {
      state.setStatus(FORMA_CLOUD_STATUS.conflict)
      state.setConflict({ message: res.message, remoteIndex: res.remoteIndex })
      return res
    }

    if (!res.ok) {
      state.setStatus(FORMA_CLOUD_STATUS.error)
      state.setError(res.message)
      markFormaCloudQueueFailed()
      return res
    }

    state.setDriveTree(res.tree)
    state.setFileMap(res.fileMap)
    state.setRootUrl(res.rootUrl || state.rootUrl)
    state.setLastSyncAt(new Date())
    state.setStatus(FORMA_CLOUD_STATUS.synced)
    markFormaCloudQueueDone()
    return res
  } catch (err) {
    state.setStatus(FORMA_CLOUD_STATUS.error)
    state.setError(err.message || 'Erreur sync FormaCloud')
    markFormaCloudQueueFailed()
    return { ok: false, message: err.message }
  }
}

export async function connectFormaCloud(zustandStore, providerId) {
  const state = zustandStore.getState()
  state.setError(null)
  state.setConflict(null)
  try {
    const res = await connectFormaCloudProvider(providerId)
    if (!res.ok) {
      state.setError(res.message)
      return res
    }
    state.connect({
      provider: res.provider,
      accessToken: res.token,
      rootId: res.rootId,
      rootUrl: res.rootUrl,
      driveTree: { rootId: res.rootId, rootUrl: res.rootUrl, subIds: res.subIds },
    })
    await runFormaCloudSync(zustandStore, { force: false })
    return res
  } catch (err) {
    state.setError(err.message || 'Connexion impossible')
    return { ok: false, message: err.message }
  }
}

export async function disconnectFormaCloud(zustandStore) {
  const provider = zustandStore.getState().provider
  await disconnectFormaCloudProvider(provider)
  clearFormaCloudQueue()
  zustandStore.getState().disconnect()
}

export function openFormaCloudFolderFromStore(zustandStore) {
  const s = zustandStore.getState()
  return openFormaCloudFolder(s.provider, { rootUrl: s.rootUrl, rootId: s.rootId })
}

export async function processFormaCloudQueueIfNeeded(zustandStore) {
  const s = zustandStore.getState()
  if (!s.connected || !s.autoSync) return { processed: false }
  if (!shouldProcessFormaCloudQueue()) return { processed: false }
  if (!isOnline()) return { processed: false }
  const res = await runFormaCloudSync(zustandStore)
  return { processed: true, ...res }
}

/** Export bundle JSON pour iCloud / transfert manuel */
export function exportFormaBundle() {
  const snapshot = buildFormaCloudSnapshot()
  const bundle = {
    type: 'forma-cloud-bundle',
    version: 1,
    exportedAt: Date.now(),
    index: snapshot.index,
    files: Object.fromEntries(
      Object.entries(snapshot.files).map(([p, f]) => [p, f.content])
    ),
  }
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `Forma-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(a.href)
  return { ok: true }
}

/** Import bundle — ne remplace pas sans confirmation explicite */
export function importFormaBundle(file, { confirmOverwrite = false } = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const bundle = JSON.parse(reader.result)
        if (bundle.type !== 'forma-cloud-bundle') {
          reject(new Error('Fichier Forma invalide'))
          return
        }
        if (!confirmOverwrite) {
          resolve({ ok: false, needsConfirm: true, fileCount: Object.keys(bundle.files || {}).length })
          return
        }
        for (const [path, content] of Object.entries(bundle.files || {})) {
          const keyMap = {
            'settings/forma-store.json': 'forma-store',
            'settings/forma-sync-store.json': 'forma-sync-store',
            'settings/forma-moodboard.json': 'forma-moodboard',
            'notebooks/notebooks.json': 'forma_local_notebooks_v1',
            'documents/documents.json': 'forma-documents',
            'tables/spreadsheets.json': 'forma-spreadsheets',
            'projects/combine.json': 'forma-combine',
            'projects/review.json': 'forma-review',
            'library/library.json': 'forma-library',
          }
          if (path.startsWith('notebooks/') && path !== 'notebooks/notebooks.json') {
            const nbId = path.replace('notebooks/', '').replace('.json', '')
            localStorage.setItem(`forma_pages_${nbId}`, content)
          } else {
            const lsKey = keyMap[path]
            if (lsKey) localStorage.setItem(lsKey, content)
          }
        }
        resolve({ ok: true, imported: Object.keys(bundle.files || {}).length })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Lecture fichier échouée'))
    reader.readAsText(file)
  })
}
