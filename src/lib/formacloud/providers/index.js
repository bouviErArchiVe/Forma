/** FormaCloud — adaptateurs fournisseurs */

import { FORMA_CLOUD_PROVIDERS } from '../constants'
import {
  isGoogleDriveConfigured,
  requestGoogleAccessToken,
  clearGoogleToken,
  ensureFormaDriveTree,
  uploadToFormaDrive,
  downloadFormaIndex,
} from './googleDrive'

export function getFormaCloudProvider(id) {
  return FORMA_CLOUD_PROVIDERS[id] || null
}

export function listFormaCloudProviders() {
  return Object.values(FORMA_CLOUD_PROVIDERS)
}

export async function connectFormaCloudProvider(providerId) {
  if (providerId === 'google_drive') {
    if (!isGoogleDriveConfigured()) {
      return {
        ok: false,
        message: 'Ajoutez VITE_GOOGLE_CLIENT_ID dans .env.local (Console Google Cloud → OAuth 2.0).',
      }
    }
    const token = await requestGoogleAccessToken({ force: true })
    const tree = await ensureFormaDriveTree(token)
    return {
      ok: true,
      provider: 'google_drive',
      token,
      rootId: tree.rootId,
      rootUrl: tree.rootUrl,
      subIds: tree.subIds,
      message: 'Dossier Forma créé dans Google Drive.',
    }
  }

  if (providerId === 'icloud') {
    return {
      ok: false,
      provider: 'icloud',
      message: 'iCloud nécessite une app native (CloudKit). Utilisez l\'export/import manuel ci-dessous.',
    }
  }

  if (providerId === 'onedrive' || providerId === 'dropbox') {
    return { ok: false, message: 'Ce fournisseur arrive bientôt.' }
  }

  return { ok: false, message: 'Fournisseur inconnu.' }
}

export async function disconnectFormaCloudProvider(providerId) {
  if (providerId === 'google_drive') clearGoogleToken()
  return { ok: true }
}

export async function syncToFormaCloudProvider(providerId, { token, tree, snapshot, fileMap, force = false }) {
  if (providerId !== 'google_drive') {
    return { ok: false, message: 'Sync cloud non disponible pour ce fournisseur.' }
  }

  const accessToken = token || await requestGoogleAccessToken()

  if (!tree?.rootId) {
    const ensured = await ensureFormaDriveTree(accessToken)
    tree = ensured
  }

  if (!force) {
    const remoteIndex = await downloadFormaIndex(accessToken, tree, fileMap)
    if (remoteIndex?.updatedAt && remoteIndex.updatedAt > snapshot.index.updatedAt) {
      if (remoteIndex.contentHash !== snapshot.index.contentHash) {
        return {
          ok: false,
          conflict: true,
          message: 'Version cloud plus récente détectée. Synchronisez manuellement ou forcez l\'envoi.',
          remoteIndex,
        }
      }
    }
  }

  const newMap = { ...fileMap }
  let uploaded = 0

  for (const [path, file] of Object.entries(snapshot.files)) {
    const result = await uploadToFormaDrive(accessToken, tree, path, file.content, newMap)
    newMap[path] = { driveId: result.driveId, updatedAt: Date.now() }
    uploaded += 1
  }

  const indexResult = await uploadToFormaDrive(
    accessToken,
    tree,
    'forma-index.json',
    snapshot.indexContent,
    newMap,
  )
  newMap['forma-index.json'] = { driveId: indexResult.driveId, updatedAt: Date.now() }

  return {
    ok: true,
    uploaded,
    tree,
    fileMap: newMap,
    rootUrl: tree.rootUrl,
  }
}

export async function openFormaCloudFolder(providerId, { rootUrl, rootId }) {
  if (providerId === 'google_drive') {
    const url = rootUrl || (rootId ? `https://drive.google.com/drive/folders/${rootId}` : null)
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
      return { ok: true }
    }
  }
  return { ok: false, message: 'Dossier cloud introuvable.' }
}
