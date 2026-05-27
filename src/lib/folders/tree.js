/** Arborescence dossiers bibliothèque. */

/** Profondeur max dossiers — 0 = illimitée (FormaFolder). */
export const MAX_FOLDER_DEPTH = 0

export function getFolderChildren(folders, parentId = null) {
  const pid = parentId || null
  return (folders || [])
    .filter((f) => (f.parentId || null) === pid)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || (a.name || '').localeCompare(b.name || '', 'fr'))
}

export function getFolderById(folders, id) {
  return (folders || []).find((f) => f.id === id) || null
}

export function getFolderAncestors(folders, folderId) {
  const out = []
  let cur = getFolderById(folders, folderId)
  while (cur) {
    out.unshift(cur)
    cur = cur.parentId ? getFolderById(folders, cur.parentId) : null
  }
  return out
}

/** Profondeur 1 = dossier racine, 2 = sous-dossier, 3 = sous-sous-dossier. */
export function getFolderDepth(folders, folderId) {
  if (!folderId) return 0
  return getFolderAncestors(folders, folderId).length
}

export function canCreateChildFolder(folders, parentId) {
  if (!parentId) return true
  if (!MAX_FOLDER_DEPTH) return true
  return getFolderDepth(folders, parentId) < MAX_FOLDER_DEPTH
}

export function canMoveFolderTo(folders, folderId, newParentId) {
  if (!folderId) return false
  if (newParentId === folderId) return false
  if (newParentId) {
    const descendants = getFolderDescendantIds(folders, folderId)
    if (descendants.includes(newParentId)) return false
    if (MAX_FOLDER_DEPTH) {
      const childDepth = getFolderDepth(folders, newParentId) + 1
      if (childDepth > MAX_FOLDER_DEPTH) return false
    }
  }
  return true
}

export function getFolderDescendantIds(folders, folderId) {
  const ids = []
  const walk = (pid) => {
    getFolderChildren(folders, pid).forEach((c) => {
      ids.push(c.id)
      walk(c.id)
    })
  }
  walk(folderId)
  return ids
}

export function canMoveFolder(folders, folderId, newParentId) {
  return canMoveFolderTo(folders, folderId, newParentId)
}

export function buildFolderTree(folders, parentId = null, depth = 0) {
  return getFolderChildren(folders, parentId).map((f) => ({
    ...f,
    depth,
    children: buildFolderTree(folders, f.id, depth + 1),
  }))
}

export function flattenFolderTree(tree, acc = []) {
  tree.forEach((node) => {
    acc.push(node)
    if (node.children?.length) flattenFolderTree(node.children, acc)
  })
  return acc
}

export function folderPathLabel(folders, folderId, rootLabel = 'Bibliothèque') {
  if (!folderId) return rootLabel
  return getFolderAncestors(folders, folderId).map((f) => f.name).join(' › ')
}

export function moveFolderInList(folders, folderId, newParentId, sortOrder) {
  if (!canMoveFolder(folders, folderId, newParentId)) return folders
  const now = new Date().toISOString()
  return folders.map((f) => {
    if (f.id !== folderId) return f
    return {
      ...f,
      parentId: newParentId || null,
      sortOrder: typeof sortOrder === 'number' ? sortOrder : f.sortOrder,
      updatedAt: now,
    }
  })
}

export function duplicateFolderBranch(folders, folderId, idFactory = () => `folder-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`) {
  const src = getFolderById(folders, folderId)
  if (!src) return { folders, idMap: {} }
  const idMap = {}
  const now = new Date().toISOString()
  const clones = []

  const cloneBranch = (node, newParentId) => {
    const newId = idFactory()
    idMap[node.id] = newId
    clones.push({
      ...node,
      id: newId,
      parentId: newParentId,
      name: `${node.name} (copie)`,
      createdAt: now,
      updatedAt: now,
    })
    getFolderChildren(folders, node.id).forEach((child) => cloneBranch(child, newId))
  }

  cloneBranch(src, src.parentId || null)
  return { folders: [...clones, ...folders], idMap }
}

export function deleteFolderBranch(folders, folderId) {
  const removeIds = new Set([folderId, ...getFolderDescendantIds(folders, folderId)])
  const deleted = folders.filter((f) => removeIds.has(f.id))
  const remaining = folders.filter((f) => !removeIds.has(f.id))
  return { remaining, deleted, removeIds }
}

export function reparentOnDelete(folders, folderId) {
  const target = getFolderById(folders, folderId)
  const parentId = target?.parentId || null
  const now = new Date().toISOString()
  return folders
    .filter((f) => f.id !== folderId)
    .map((f) => {
      if (f.parentId === folderId) return { ...f, parentId, updatedAt: now }
      return f
    })
}
