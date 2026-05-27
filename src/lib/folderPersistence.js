/** Persistance des dossiers bibliothèque — localStorage + Supabase (backup). */

import { supabase } from '@/lib/supabase'

const STORAGE_KEY = 'forma_library_folders_v1'

function scopeKey(userId) {
  return userId || '_guest'
}

/** Normalise ancien format { n, e } et nouveau { name, icon, … }. */
export function normalizeFolder(raw, ownerId = null) {
  if (!raw) return null
  const now = new Date().toISOString()
  const name = String(raw.name || raw.n || 'Dossier').trim() || 'Dossier'
  const icon = raw.icon || raw.e || '📁'
  return {
    id: String(raw.id || `folder-${Date.now()}`),
    name,
    icon,
    n: name,
    e: icon,
    color: raw.color || '#3d6b8c',
    ownerId: raw.ownerId ?? raw.owner_id ?? ownerId ?? null,
    projectIds: Array.isArray(raw.projectIds) ? raw.projectIds : (Array.isArray(raw.project_ids) ? raw.project_ids : []),
    createdAt: raw.createdAt || raw.created_at || now,
    updatedAt: raw.updatedAt || raw.updated_at || now,
  }
}

function fromRow(row) {
  return normalizeFolder({
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    ownerId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })
}

function toRow(folder, userId) {
  return {
    id: folder.id,
    user_id: userId,
    name: folder.name,
    icon: folder.icon,
    color: folder.color,
    created_at: folder.createdAt,
    updated_at: folder.updatedAt,
  }
}

function readStore() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return raw && typeof raw === 'object' ? raw : {}
  } catch {
    return {}
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
    return true
  } catch {
    return false
  }
}

export function loadLocalFolders(userId) {
  const store = readStore()
  const list = store[scopeKey(userId)] || []
  return (Array.isArray(list) ? list : []).map((f) => normalizeFolder(f, userId)).filter(Boolean)
}

export function saveLocalFolders(userId, folders) {
  const store = readStore()
  store[scopeKey(userId)] = (folders || []).map((f) => normalizeFolder(f, userId)).filter(Boolean)
  return writeStore(store)
}

function mergeFolders(local, cloud, userId) {
  const byId = new Map()
  for (const f of local) byId.set(f.id, f)
  for (const f of cloud) {
    const prev = byId.get(f.id)
    if (!prev || new Date(f.updatedAt) >= new Date(prev.updatedAt)) byId.set(f.id, f)
  }
  return [...byId.values()].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}

function isMissingTableError(error) {
  const msg = `${error?.code || ''} ${error?.message || ''}`.toLowerCase()
  return msg.includes('does not exist') || msg.includes('42p01') || msg.includes('library_folders')
}

export async function loadFolders(userId) {
  const local = loadLocalFolders(userId)
  if (!userId) return { folders: local, source: 'local' }

  try {
    const { data, error } = await supabase
      .from('library_folders')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      if (isMissingTableError(error)) return { folders: local, source: 'local', cloudOk: false }
      console.warn('[folders] load cloud failed', error)
      return { folders: local, source: 'local', cloudOk: false, error: error.message }
    }

    const cloud = (data || []).map(fromRow)
    const merged = mergeFolders(local, cloud, userId)
    saveLocalFolders(userId, merged)
    return { folders: merged, source: 'merged', cloudOk: true }
  } catch (err) {
    console.warn('[folders] load error', err)
    return { folders: local, source: 'local', cloudOk: false, error: err?.message }
  }
}

export async function persistFolderCreate(userId, { name, icon, color = '#3d6b8c' }) {
  const now = new Date().toISOString()
  const folder = normalizeFolder({
    id: `folder-${Date.now()}`,
    name: name.trim(),
    icon: icon || '📁',
    color,
    ownerId: userId,
    createdAt: now,
    updatedAt: now,
  }, userId)

  const folders = [folder, ...loadLocalFolders(userId).filter((f) => f.id !== folder.id)]
  const localOk = saveLocalFolders(userId, folders)
  if (!localOk) {
    return { ok: false, folder: null, folders, error: 'Impossible de sauvegarder localement' }
  }

  if (!userId) {
    return { ok: true, folder, folders, cloudOk: false }
  }

  try {
    const { error } = await supabase.from('library_folders').upsert(toRow(folder, userId))
    if (error) throw error
    return { ok: true, folder, folders, cloudOk: true }
  } catch (err) {
    if (isMissingTableError(err)) {
      return { ok: true, folder, folders, cloudOk: false, warning: 'Sauvegarde locale uniquement (table Supabase absente)' }
    }
    return { ok: true, folder, folders, cloudOk: false, warning: err?.message || 'Sync cloud échouée — copie locale conservée' }
  }
}

export async function persistFolderDelete(userId, folderId) {
  const folders = loadLocalFolders(userId).filter((f) => f.id !== folderId)
  const localOk = saveLocalFolders(userId, folders)
  if (!localOk) {
    return { ok: false, folders, error: 'Impossible de sauvegarder localement' }
  }

  if (!userId) return { ok: true, folders, cloudOk: false }

  try {
    const { error } = await supabase.from('library_folders').delete().eq('id', folderId).eq('user_id', userId)
    if (error) throw error
    return { ok: true, folders, cloudOk: true }
  } catch (err) {
    if (isMissingTableError(err)) return { ok: true, folders, cloudOk: false }
    return { ok: true, folders, cloudOk: false, warning: err?.message }
  }
}

export async function persistFolderRename(userId, folderId, name) {
  const folders = loadLocalFolders(userId).map((f) => (
    f.id === folderId
      ? normalizeFolder({ ...f, name: name.trim(), updatedAt: new Date().toISOString() }, userId)
      : f
  ))
  const localOk = saveLocalFolders(userId, folders)
  if (!localOk) return { ok: false, folders, error: 'Impossible de sauvegarder localement' }

  const folder = folders.find((f) => f.id === folderId)
  if (!userId || !folder) return { ok: true, folders, cloudOk: false }

  try {
    const { error } = await supabase.from('library_folders').upsert(toRow(folder, userId))
    if (error) throw error
    return { ok: true, folders, cloudOk: true }
  } catch (err) {
    if (isMissingTableError(err)) return { ok: true, folders, cloudOk: false }
    return { ok: true, folders, cloudOk: false, warning: err?.message }
  }
}
