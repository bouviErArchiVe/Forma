/** FormaFolder — recherche unifiée dossiers / carnets / assets */

import { getFolderChildren } from '@/lib/folders/tree'
import { getNotebookItemStats } from '@/lib/folders/stats'
import { assetTypeLabel } from './constants'

function norm(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

export function buildExplorerItems({ folders, notebooks, assets, subjects, folderId, modeFilter, mfFilter }) {
  const subfolders = getFolderChildren(folders, folderId || null)
    .filter((f) => (!modeFilter || modeFilter === 'all' || f.mode === modeFilter))
    .filter((f) => (!mfFilter || f.masterFormat === mfFilter))
    .map((f) => ({
      kind: 'folder',
      id: f.id,
      name: f.name,
      updatedAt: f.updatedAt,
      createdAt: f.createdAt,
      sortOrder: f.sortOrder ?? 0,
      favorite: !!f.favorite,
      tags: f.tags || [],
      mode: f.mode,
      masterFormat: f.masterFormat,
      searchText: [f.name, f.description, ...(f.tags || [])].join(' '),
      raw: f,
    }))

  const books = (notebooks || [])
    .filter((n) => (n.folder_id || null) === (folderId || null))
    .map((n) => {
      const stats = getNotebookItemStats(n, subjects)
      return {
        kind: 'notebook',
        id: n.id,
        name: stats.name,
        updatedAt: n.updated_at,
        createdAt: n.created_at,
        sortOrder: 0,
        favorite: !!n.starred,
        tags: [],
        bytes: stats.bytes,
        searchText: [stats.name, stats.subject].join(' '),
        raw: n,
        stats,
      }
    })

  const files = (assets || [])
    .filter((a) => (a.folderId || null) === (folderId || null))
    .filter((a) => (!mfFilter || a.masterFormat === mfFilter))
    .map((a) => ({
      kind: 'asset',
      id: a.id,
      name: a.name,
      updatedAt: a.updatedAt,
      createdAt: a.createdAt,
      sortOrder: 0,
      favorite: !!a.favorite,
      tags: a.tags || [],
      masterFormat: a.masterFormat,
      assetType: a.type,
      bytes: a.size || 0,
      pageCount: a.pageCount || 0,
      searchText: [a.name, a.textContent, ...(a.tags || []), assetTypeLabel(a.type)].join(' '),
      raw: a,
    }))

  return [...subfolders, ...books, ...files]
}

export function searchExplorerItems(items, query, { typeFilter = 'all', tagFilter = '' } = {}) {
  let out = items
  if (typeFilter === 'folders') out = out.filter((i) => i.kind === 'folder')
  else if (typeFilter === 'notebooks') out = out.filter((i) => i.kind === 'notebook')
  else if (typeFilter === 'assets') out = out.filter((i) => i.kind === 'asset')
  else if (typeFilter === 'favorites') out = out.filter((i) => i.favorite)

  const tag = String(tagFilter || '').trim().toLowerCase()
  if (tag) out = out.filter((i) => (i.tags || []).some((t) => norm(t).includes(tag)))

  const q = norm(query).trim()
  if (!q) return out.map((i) => ({ ...i, score: 0, highlights: [] }))

  return out
    .map((item) => {
      const nameN = norm(item.name)
      const textN = norm(item.searchText)
      let score = 0
      const highlights = []
      if (nameN === q) score += 100
      else if (nameN.startsWith(q)) score += 60
      else if (nameN.includes(q)) { score += 40; highlights.push('name') }
      if (textN.includes(q)) score += 20
      ;(item.tags || []).forEach((t) => { if (norm(t).includes(q)) score += 15 })
      return { ...item, score, highlights }
    })
    .filter((i) => i.score > 0 || !q)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'fr'))
}

export function splitSearchTerms(query) {
  return norm(query).split(/\s+/).filter(Boolean)
}

export function highlightParts(text, query) {
  const terms = splitSearchTerms(query)
  if (!terms.length) return [{ text, match: false }]
  const parts = []
  let rest = String(text || '')
  while (rest.length) {
    let found = null
    let idx = rest.length
    for (const t of terms) {
      const i = norm(rest).indexOf(t)
      if (i >= 0 && i < idx) { idx = i; found = t }
    }
    if (found == null) { parts.push({ text: rest, match: false }); break }
    if (idx > 0) parts.push({ text: rest.slice(0, idx), match: false })
    parts.push({ text: rest.slice(idx, idx + found.length), match: true })
    rest = rest.slice(idx + found.length)
  }
  return parts
}
