/** Collecte un snapshot local pour FormaCloud */

import { safeGetLocalStorage, safeJsonParse } from '@/lib/storage'
import { hashPayload } from '@/lib/sync/localVault'
import { loadLocalNotebooks } from '@/lib/projectPersistence'
import { FORMA_FOLDERS, FORMA_INDEX_FILE } from './constants'

function readKey(key) {
  const raw = safeGetLocalStorage(key)
  if (raw == null) return null
  try {
    return safeJsonParse(raw, raw)
  } catch {
    return raw
  }
}

function collectNotebookPages() {
  const notebooks = loadLocalNotebooks()
  const pages = {}
  for (const nb of notebooks) {
    const key = `forma_pages_${nb.id}`
    const data = readKey(key)
    if (data != null) pages[nb.id] = data
  }
  return { notebooks, pages }
}

/** Construit l'arborescence /Forma pour upload cloud */
export function buildFormaCloudSnapshot() {
  const now = Date.now()
  const { notebooks, pages } = collectNotebookPages()
  const files = {}

  const addFile = (folder, name, content) => {
    if (content == null) return
    const path = `${folder}/${name}`
    const serialized = typeof content === 'string' ? content : JSON.stringify(content)
    files[path] = {
      path,
      content: serialized,
      hash: hashPayload(serialized),
      updatedAt: now,
    }
  }

  addFile(FORMA_FOLDERS.settings, 'forma-store.json', readKey('forma-store'))
  addFile(FORMA_FOLDERS.settings, 'forma-sync-store.json', readKey('forma-sync-store'))
  addFile(FORMA_FOLDERS.settings, 'forma-moodboard.json', readKey('forma-moodboard'))
  addFile(FORMA_FOLDERS.settings, 'forma-visual-profiles.json', readKey('forma-visual-profiles'))
  addFile(FORMA_FOLDERS.settings, 'forma-folders.json', readKey('forma-folders-local'))

  addFile(FORMA_FOLDERS.notebooks, 'notebooks.json', notebooks)
  for (const [nbId, pageData] of Object.entries(pages)) {
    addFile(FORMA_FOLDERS.notebooks, `${nbId}.json`, pageData)
  }

  addFile(FORMA_FOLDERS.documents, 'documents.json', readKey('forma-documents'))
  addFile(FORMA_FOLDERS.tables, 'spreadsheets.json', readKey('forma-spreadsheets'))
  addFile(FORMA_FOLDERS.projects, 'combine.json', readKey('forma-combine'))
  addFile(FORMA_FOLDERS.projects, 'review.json', readKey('forma-review'))
  addFile(FORMA_FOLDERS.projects, 'present.json', readKey('forma-present'))
  addFile(FORMA_FOLDERS.projects, 'formatcal.json', readKey('forma-formatcal'))
  addFile(FORMA_FOLDERS.library, 'library.json', readKey('forma-library'))
  addFile(FORMA_FOLDERS.exports, 'combine-exports.json', readKey('forma-combine-exports'))

  const index = {
    version: 1,
    app: 'forma',
    updatedAt: now,
    contentHash: hashPayload(Object.values(files).map((f) => f.hash).join('|')),
    fileCount: Object.keys(files).length,
    files: Object.fromEntries(
      Object.entries(files).map(([p, f]) => [p, { hash: f.hash, updatedAt: f.updatedAt, size: f.content.length }])
    ),
  }

  return {
    index,
    indexPath: FORMA_INDEX_FILE,
    indexContent: JSON.stringify(index, null, 2),
    files,
  }
}
