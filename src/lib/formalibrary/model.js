/** FormaLibrary — modèle dossiers et items */

function uid(p = 'flb') {
  return `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function createFolder(partial = {}) {
  const now = Date.now()
  return {
    id: uid('fld'),
    parentId: partial.parentId || null,
    name: partial.name || 'Dossier',
    icon: partial.icon || '📁',
    tags: partial.tags || [],
    favorite: !!partial.favorite,
    preset: partial.preset || null,
    createdAt: now,
    updatedAt: now,
  }
}

export function createItem(partial = {}) {
  const now = Date.now()
  return {
    id: uid('itm'),
    folderId: partial.folderId || null,
    name: partial.name || 'Sans titre',
    category: partial.category || 'image',
    mimeType: partial.mimeType || null,
    tags: partial.tags || [],
    favorite: !!partial.favorite,
    dataUrl: partial.dataUrl || null,
    previewUrl: partial.previewUrl || partial.dataUrl || null,
    textContent: partial.textContent || '',
    size: partial.size || 0,
    pageCount: partial.pageCount || 0,
    refModule: partial.refModule || null,
    refId: partial.refId || null,
    metadata: partial.metadata || {},
    createdAt: now,
    updatedAt: now,
  }
}

export function buildFolderTree(folders) {
  const byParent = {}
  for (const f of folders || []) {
    const pid = f.parentId || 'root'
    if (!byParent[pid]) byParent[pid] = []
    byParent[pid].push(f)
  }
  const sort = (list) => list.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  Object.values(byParent).forEach(sort)
  function walk(parentId) {
    return (byParent[parentId || 'root'] || []).map((f) => ({
      ...f,
      children: walk(f.id),
    }))
  }
  return walk(null)
}

export function getFolderPath(folders, folderId) {
  if (!folderId) return []
  const map = Object.fromEntries((folders || []).map((f) => [f.id, f]))
  const path = []
  let cur = map[folderId]
  while (cur) {
    path.unshift(cur)
    cur = cur.parentId ? map[cur.parentId] : null
  }
  return path
}

export function getDescendantFolderIds(folders, folderId) {
  const ids = folderId ? [folderId] : []
  const children = (folders || []).filter((f) => (f.parentId || null) === folderId)
  for (const c of children) ids.push(...getDescendantFolderIds(folders, c.id))
  return ids
}
