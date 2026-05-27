/** Stockage local Forma — export/import projet complet */

import { safeGetLocalStorage, safeSetLocalStorage } from '@/lib/storage'

export const FORMA_PROJECT_VERSION = 1
export const FORMA_PROJECT_EXT = '.forma'

const KEY_PREFIXES = ['forma', 'forma-', 'forma_', 'archnote']

function isFormaKey(key) {
  if (!key) return false
  const lower = key.toLowerCase()
  return KEY_PREFIXES.some((p) => lower.startsWith(p))
}

/** Collecte toutes les entrées localStorage Forma */
export function collectLocalFormaData() {
  const entries = {}
  if (typeof localStorage === 'undefined') return entries
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (!isFormaKey(key)) continue
      entries[key] = localStorage.getItem(key)
    }
  } catch { /* ignore */ }
  return entries
}

function buildManifest(entries) {
  return {
    version: FORMA_PROJECT_VERSION,
    exportedAt: new Date().toISOString(),
    app: 'Forma',
    keyCount: Object.keys(entries).length,
    keys: Object.keys(entries).sort(),
  }
}

/** Exporte un bundle projet (JSON dans fichier .forma) */
export function buildFormaProjectBundle({ label = 'Mon projet Forma' } = {}) {
  const entries = collectLocalFormaData()
  return {
    manifest: { ...buildManifest(entries), label },
    data: entries,
  }
}

async function maybeCompress(jsonStr) {
  if (typeof CompressionStream === 'undefined') return { body: jsonStr, compressed: false }
  try {
    const stream = new Blob([jsonStr]).stream().pipeThrough(new CompressionStream('gzip'))
    const buf = await new Response(stream).arrayBuffer()
    return { body: buf, compressed: true, mime: 'application/gzip' }
  } catch {
    return { body: jsonStr, compressed: false }
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Télécharge le projet (.forma = JSON, ou .forma.gz si compression dispo) */
export async function downloadFormaProject({ label, filename } = {}) {
  const bundle = buildFormaProjectBundle({ label })
  const jsonStr = JSON.stringify(bundle)
  const { body, compressed, mime } = await maybeCompress(jsonStr)
  const safe = (label || 'forma-projet').replace(/[^\w\-]+/g, '_').slice(0, 48)
  const name = filename || `${safe}${compressed ? '.forma.gz' : FORMA_PROJECT_EXT}`
  const blob = new Blob([body], { type: mime || 'application/json' })
  downloadBlob(blob, name)
  return { keyCount: bundle.manifest.keyCount, compressed }
}

/** File System Access API — choisir un dossier local (Chrome/Edge) */
export function supportsDirectoryExport() {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window
}

export async function exportToLocalDirectory({ label } = {}) {
  if (!supportsDirectoryExport()) {
    throw new Error('Sélection de dossier non supportée sur ce navigateur. Utilisez l\'export fichier.')
  }
  const bundle = buildFormaProjectBundle({ label })
  const jsonStr = JSON.stringify(bundle, null, 2)
  const dir = await window.showDirectoryPicker({ mode: 'readwrite' })
  const safe = (label || 'forma-backup').replace(/[^\w\-]+/g, '_').slice(0, 48)
  const fileName = `${safe}-${new Date().toISOString().slice(0, 10)}${FORMA_PROJECT_EXT}`
  const handle = await dir.getFileHandle(fileName, { create: true })
  const writable = await handle.createWritable()
  await writable.write(jsonStr)
  await writable.close()
  return { fileName, keyCount: bundle.manifest.keyCount }
}

function parseImportText(text) {
  const parsed = JSON.parse(text)
  if (parsed?.manifest && parsed?.data) return parsed
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const keys = Object.keys(parsed).filter(isFormaKey)
    if (keys.length) return { manifest: buildManifest(parsed), data: parsed }
  }
  throw new Error('Fichier Forma invalide.')
}

async function decompressIfNeeded(file) {
  const name = file.name?.toLowerCase() || ''
  if (name.endsWith('.gz') && typeof DecompressionStream !== 'undefined') {
    const stream = file.stream().pipeThrough(new DecompressionStream('gzip'))
    return new Response(stream).text()
  }
  return file.text()
}

/** Importe un fichier .forma (merge ou remplace) */
export async function importFormaProjectFile(file, { merge = true } = {}) {
  if (!file) throw new Error('Aucun fichier sélectionné.')
  const text = await decompressIfNeeded(file)
  const bundle = parseImportText(text)
  return applyFormaProjectBundle(bundle, { merge })
}

export function applyFormaProjectBundle(bundle, { merge = false } = {}) {
  const entries = bundle?.data
  if (!entries || typeof entries !== 'object') throw new Error('Données projet manquantes.')
  let imported = 0
  for (const [key, value] of Object.entries(entries)) {
    if (!isFormaKey(key) || value == null) continue
    if (merge && safeGetLocalStorage(key) != null) continue
    safeSetLocalStorage(key, value)
    imported += 1
  }
  return { imported, total: Object.keys(entries).filter(isFormaKey).length, manifest: bundle.manifest }
}

export function getLocalStorageStats() {
  const entries = collectLocalFormaData()
  const bytes = Object.values(entries).reduce((n, v) => n + (v?.length || 0), 0)
  return { keyCount: Object.keys(entries).length, approxKb: Math.round(bytes / 1024) }
}
