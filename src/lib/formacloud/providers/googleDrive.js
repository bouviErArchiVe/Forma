/** Google Drive — OAuth GIS + REST API v3 */

const GIS_URL = 'https://accounts.google.com/gsi/client'
const DRIVE = 'https://www.googleapis.com/drive/v3'
const SCOPE = 'https://www.googleapis.com/auth/drive.file'

let cachedToken = null
let tokenExpiresAt = 0

function getClientId() {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
}

export function isGoogleDriveConfigured() {
  return Boolean(getClientId())
}

function loadScript() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('Navigateur requis'))
    if (window.google?.accounts?.oauth2) return resolve()
    const existing = document.querySelector(`script[src="${GIS_URL}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Script Google indisponible')))
      return
    }
    const s = document.createElement('script')
    s.src = GIS_URL
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Impossible de charger Google Identity Services'))
    document.head.appendChild(s)
  })
}

export async function requestGoogleAccessToken({ force = false } = {}) {
  const clientId = getClientId()
  if (!clientId) throw new Error('VITE_GOOGLE_CLIENT_ID non configuré dans .env.local')

  if (!force && cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken
  }

  await loadScript()

  return new Promise((resolve, reject) => {
    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPE,
        callback: (resp) => {
          if (resp.error) {
            reject(new Error(resp.error_description || resp.error))
            return
          }
          cachedToken = resp.access_token
          tokenExpiresAt = Date.now() + (resp.expires_in || 3600) * 1000
          resolve(cachedToken)
        },
      })
      client.requestAccessToken({ prompt: force ? 'consent' : '' })
    } catch (err) {
      reject(err)
    }
  })
}

export function clearGoogleToken() {
  cachedToken = null
  tokenExpiresAt = 0
}

async function driveFetch(token, path, opts = {}) {
  const res = await fetch(`${DRIVE}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(opts.body && !(opts.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...opts.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Drive API ${res.status}`)
  }
  if (res.status === 204) return null
  return res.json()
}

export async function findOrCreateFolder(token, name, parentId = null) {
  let q = `name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  if (parentId) q += ` and '${parentId}' in parents`
  const list = await driveFetch(token, `/files?q=${encodeURIComponent(q)}&fields=files(id,name,webViewLink)`)
  if (list.files?.[0]) return list.files[0]

  const body = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    ...(parentId ? { parents: [parentId] } : {}),
  }
  const created = await driveFetch(token, '/files?fields=id,name,webViewLink', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return created
}

export async function ensureFormaDriveTree(token) {
  const root = await findOrCreateFolder(token, 'Forma')
  const subIds = {}
  const subs = ['projects', 'notebooks', 'documents', 'tables', 'library', 'exports', 'settings']
  for (const sub of subs) {
    const folder = await findOrCreateFolder(token, sub, root.id)
    subIds[sub] = folder.id
  }
  return {
    rootId: root.id,
    rootUrl: root.webViewLink || `https://drive.google.com/drive/folders/${root.id}`,
    subIds,
  }
}

async function findFileInFolder(token, name, parentId) {
  const q = `name='${name.replace(/'/g, "\\'")}' and '${parentId}' in parents and trashed=false`
  const list = await driveFetch(token, `/files?q=${encodeURIComponent(q)}&fields=files(id,name,modifiedTime)`)
  return list.files?.[0] || null
}

export async function uploadTextFile(token, { name, content, parentId, existingId = null, mimeType = 'application/json' }) {
  const metadata = { name, mimeType, ...(parentId && !existingId ? { parents: [parentId] } : {}) }
  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
  form.append('file', new Blob([content], { type: mimeType }))

  const path = existingId
    ? `/files/${existingId}?uploadType=multipart&fields=id,name,modifiedTime,webViewLink`
    : '/files?uploadType=multipart&fields=id,name,modifiedTime,webViewLink'

  const res = await fetch(`${DRIVE}${path}`, {
    method: existingId ? 'PATCH' : 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Upload échoué (${res.status})`)
  }
  return res.json()
}

export async function downloadTextFile(token, fileId) {
  const res = await fetch(`${DRIVE}/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Téléchargement échoué (${res.status})`)
  return res.text()
}

export async function uploadToFormaDrive(token, tree, filePath, content, fileMap = {}) {
  const parts = filePath.split('/')
  const fileName = parts.pop()
  const folderKey = parts[0]
  const parentId = tree.subIds[folderKey] || tree.rootId

  const mapKey = filePath
  let existingId = fileMap[mapKey]?.driveId || null
  if (!existingId) {
    const found = await findFileInFolder(token, fileName, parentId)
    existingId = found?.id || null
  }

  const uploaded = await uploadTextFile(token, {
    name: fileName,
    content,
    parentId: existingId ? undefined : parentId,
    existingId,
  })

  return { driveId: uploaded.id, path: filePath, modifiedTime: uploaded.modifiedTime }
}

export async function downloadFormaIndex(token, tree, fileMap) {
  const indexId = fileMap['forma-index.json']?.driveId
  if (indexId) {
    const text = await downloadTextFile(token, indexId)
    return JSON.parse(text)
  }
  const found = await findFileInFolder(token, 'forma-index.json', tree.rootId)
  if (!found) return null
  const text = await downloadTextFile(token, found.id)
  return JSON.parse(text)
}
