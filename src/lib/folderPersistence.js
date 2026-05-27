/** Persistance des dossiers bibliothèque — localStorage + Supabase (backup). */

import { supabase } from '@/lib/supabase'
import { deleteFolderBranch, duplicateFolderBranch, reparentOnDelete, getFolderDescendantIds, canMoveFolder } from '@/lib/folders/tree'

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
    parentId: raw.parentId ?? raw.parent_id ?? null,
    sortOrder: typeof raw.sortOrder === 'number' ? raw.sortOrder : (raw.sort_order ?? 0),
    lastOpenedAt: raw.lastOpenedAt ?? raw.last_opened_at ?? null,
    ownerId: raw.ownerId ?? raw.owner_id ?? ownerId ?? null,
    projectIds: Array.isArray(raw.projectIds) ? raw.projectIds : (Array.isArray(raw.project_ids) ? raw.project_ids : []),
    mode: raw.mode || 'general',
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    favorite: !!raw.favorite,
    masterFormat: raw.masterFormat || raw.master_format || null,
    description: raw.description || '',
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
    parentId: row.parent_id,
    sortOrder: row.sort_order,
    lastOpenedAt: row.last_opened_at,
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
    parent_id: folder.parentId || null,
    sort_order: folder.sortOrder ?? 0,
    last_opened_at: folder.lastOpenedAt || null,
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

function migrateFolderList(list, ownerId) {
  return (Array.isArray(list) ? list : []).map((f) => normalizeFolder(f, ownerId)).filter(Boolean)
}

export function loadLocalFolders(userId) {
  const store = readStore()
  return migrateFolderList(store[scopeKey(userId)] || [], userId)
}

export function saveLocalFolders(userId, folders) {
  const store = readStore()
  store[scopeKey(userId)] = (folders || []).map((f) => normalizeFolder(f, userId)).filter(Boolean)
  return writeStore(store)
}

export function loadLocalFoldersForScope(userId) {
  const guest = loadLocalFolders(null)
  if (!userId) return guest
  const owned = loadLocalFolders(userId)
  return mergeFolders(guest, owned, userId)
}

export async function resolveFolderUserId() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user?.id || null
  } catch {
    return null
  }
}

export function migrateGuestFoldersToUser(userId) {
  if (!userId) return loadLocalFolders(userId)
  const guest = loadLocalFolders(null)
  const owned = loadLocalFolders(userId)
  if (!guest.length) return owned
  const merged = mergeFolders(guest, owned, userId)
  saveLocalFolders(userId, merged)
  saveLocalFolders(null, [])
  return merged
}

function mergeFolders(local, cloud, userId) {
  const byId = new Map()
  for (const f of local) byId.set(f.id, f)
  for (const f of cloud) {
    const prev = byId.get(f.id)
    if (!prev || new Date(f.updatedAt) >= new Date(prev.updatedAt)) byId.set(f.id, f)
  }
  return [...byId.values()].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || new Date(b.updatedAt) - new Date(a.updatedAt))
}

function isMissingTableError(error) {
  const msg = `${error?.code || ''} ${error?.message || ''}`.toLowerCase()
  return msg.includes('does not exist') || msg.includes('42p01') || msg.includes('library_folders') || msg.includes('column')
}

async function syncFoldersCloud(ownerId, folders) {
  if (!ownerId) return { cloudOk: false }
  try {
    const { error } = await supabase.from('library_folders').upsert(folders.map((f) => toRow(f, ownerId)))
    if (error) throw error
    return { cloudOk: true }
  } catch (err) {
    if (isMissingTableError(err)) return { cloudOk: false, warning: 'Sync cloud partielle (schéma)' }
    return { cloudOk: false, warning: err?.message }
  }
}

async function persistAll(ownerId, folders) {
  const normalized = folders.map((f) => normalizeFolder(f, ownerId))
  const localOk = saveLocalFolders(ownerId, normalized)
  if (!localOk) return { ok: false, folders: normalized, error: 'Impossible de sauvegarder localement' }
  const cloud = await syncFoldersCloud(ownerId, normalized)
  return { ok: true, folders: normalized, ...cloud }
}

export async function loadFolders(userId) {
  const local = userId ? migrateGuestFoldersToUser(userId) : loadLocalFolders(null)
  if (!userId) return { folders: local, source: 'local' }

  try {
    const { data, error } = await supabase
      .from('library_folders')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
      .order('updated_at', { ascending: false })

    if (error) {
      if (isMissingTableError(error)) {
        saveLocalFolders(userId, local)
        return { folders: local, source: 'local', cloudOk: false }
      }
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

export async function persistFolderCreate(userId, { name, icon, color = '#3d6b8c', parentId = null, sortOrder = 0, mode, tags, masterFormat, description }) {
  const ownerId = userId ?? await resolveFolderUserId()
  const now = new Date().toISOString()
  const parent = parentId ? loadLocalFoldersForScope(ownerId).find((f) => f.id === parentId) : null
  const folder = normalizeFolder({
    id: `folder-${Date.now()}`,
    name: name.trim(),
    icon: icon || '📁',
    color,
    parentId: parentId || null,
    sortOrder,
    mode: mode || parent?.mode || 'general',
    tags: tags || [],
    masterFormat: masterFormat || parent?.masterFormat || null,
    description: description || '',
    ownerId,
    createdAt: now,
    updatedAt: now,
  }, ownerId)

  const folders = [folder, ...loadLocalFoldersForScope(ownerId).filter((f) => f.id !== folder.id)]
  const res = await persistAll(ownerId, folders)
  return { ...res, folder }
}

export async function persistFolderDelete(userId, folderId, { reparentChildren = true } = {}) {
  const ownerId = userId ?? await resolveFolderUserId()
  let folders = loadLocalFoldersForScope(ownerId)
  const removeIds = reparentChildren
    ? [folderId]
    : [folderId, ...getFolderDescendantIds(folders, folderId)]

  if (reparentChildren) {
    folders = reparentOnDelete(folders, folderId)
  } else {
    folders = deleteFolderBranch(folders, folderId).remaining
  }

  const res = await persistAll(ownerId, folders)
  if (ownerId && res.ok) {
    try {
      await supabase.from('library_folders').delete().in('id', removeIds).eq('user_id', ownerId)
    } catch { /* local ok */ }
  }
  return res
}

export async function persistFolderUpdate(userId, folderId, patch = {}) {
  const ownerId = userId ?? await resolveFolderUserId()
  const existing = loadLocalFoldersForScope(ownerId).find((f) => f.id === folderId)
  if (!existing) {
    return { ok: false, folders: loadLocalFoldersForScope(ownerId), error: 'Dossier introuvable' }
  }

  const folders = loadLocalFoldersForScope(ownerId).map((f) => (
    f.id === folderId
      ? normalizeFolder({
          ...f,
          ...patch,
          name: patch.name != null ? patch.name.trim() : f.name,
          icon: patch.icon != null ? patch.icon : f.icon,
          color: patch.color != null ? patch.color : f.color,
          parentId: patch.parentId !== undefined ? patch.parentId : f.parentId,
          sortOrder: patch.sortOrder !== undefined ? patch.sortOrder : f.sortOrder,
          lastOpenedAt: patch.lastOpenedAt !== undefined ? patch.lastOpenedAt : f.lastOpenedAt,
          mode: patch.mode !== undefined ? patch.mode : f.mode,
          tags: patch.tags !== undefined ? patch.tags : f.tags,
          favorite: patch.favorite !== undefined ? patch.favorite : f.favorite,
          masterFormat: patch.masterFormat !== undefined ? patch.masterFormat : f.masterFormat,
          description: patch.description !== undefined ? patch.description : f.description,
          updatedAt: new Date().toISOString(),
        }, ownerId)
      : f
  ))
  return persistAll(ownerId, folders)
}

export async function persistFolderMove(userId, folderId, newParentId, sortOrder) {
  const ownerId = userId ?? await resolveFolderUserId()
  const folders = loadLocalFoldersForScope(ownerId)
  if (!canMoveFolder(folders, folderId, newParentId)) {
    return { ok: false, folders, error: 'Déplacement impossible (cycle, profondeur max ou dossier invalide)' }
  }
  const next = folders.map((f) => {
    if (f.id !== folderId) return f
    return normalizeFolder({
      ...f,
      parentId: newParentId || null,
      sortOrder: typeof sortOrder === 'number' ? sortOrder : f.sortOrder,
      updatedAt: new Date().toISOString(),
    }, ownerId)
  })
  return persistAll(ownerId, next)
}

export async function persistFolderDuplicate(userId, folderId) {
  const ownerId = userId ?? await resolveFolderUserId()
  const folders = loadLocalFoldersForScope(ownerId)
  const { folders: next } = duplicateFolderBranch(folders, folderId)
  return persistAll(ownerId, next)
}

export async function persistFolderOpen(userId, folderId) {
  return persistFolderUpdate(userId, folderId, { lastOpenedAt: new Date().toISOString() })
}

export async function persistFoldersReorder(userId, orderedIds, parentId = null) {
  const ownerId = userId ?? await resolveFolderUserId()
  const folders = loadLocalFoldersForScope(ownerId)
  const now = new Date().toISOString()
  const orderMap = new Map(orderedIds.map((id, i) => [id, i]))
  const next = folders.map((f) => {
    if ((f.parentId || null) !== (parentId || null) || !orderMap.has(f.id)) return f
    return { ...f, sortOrder: orderMap.get(f.id), updatedAt: now }
  })
  return persistAll(ownerId, next)
}

/** @deprecated use persistFolderUpdate */
export async function persistFolderRename(userId, folderId, name) {
  return persistFolderUpdate(userId, folderId, { name })
}

export async function syncFoldersToCloud(userId) {
  const ownerId = userId ?? await resolveFolderUserId()
  if (!ownerId) {
    return { ok: false, error: 'Connectez-vous pour synchroniser avec le cloud' }
  }

  const folders = loadLocalFoldersForScope(ownerId)
  if (!folders.length) {
    return { ok: true, folders, cloudOk: true }
  }

  try {
    const { error } = await supabase.from('library_folders').upsert(folders.map((f) => toRow(f, ownerId)))
    if (error) throw error
    saveLocalFolders(ownerId, folders)
    return { ok: true, folders, cloudOk: true }
  } catch (err) {
    if (isMissingTableError(err)) {
      return {
        ok: false,
        folders,
        cloudOk: false,
        error: 'Table Supabase absente — exécutez supabase/migrations/002_library_folders.sql',
      }
    }
    return { ok: false, folders, cloudOk: false, error: err?.message || 'Synchronisation cloud échouée' }
  }
}
