/** FormaFolder — assets liés aux dossiers (source unique). */

import { createSafePersistStorage } from '@/lib/storage'

const KEY = 'forma_folder_assets_v1'

function uid(p = 'asset') {
  return `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function readAll(userId) {
  try {
    const raw = createSafePersistStorage().getItem(`${KEY}_${userId || 'guest'}`)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function writeAll(userId, list) {
  createSafePersistStorage().setItem(`${KEY}_${userId || 'guest'}`, JSON.stringify(list))
}

export function createAsset(partial = {}) {
  const now = Date.now()
  return {
    id: uid(),
    folderId: partial.folderId || null,
    name: partial.name || 'Sans titre',
    type: partial.type || 'asset',
    mimeType: partial.mimeType || null,
    size: partial.size || 0,
    pageCount: partial.pageCount || 0,
    dataUrl: partial.dataUrl || null,
    textContent: partial.textContent || '',
    previewUrl: partial.previewUrl || partial.dataUrl || null,
    tags: partial.tags || [],
    favorite: !!partial.favorite,
    masterFormat: partial.masterFormat || null,
    refModule: partial.refModule || null,
    refId: partial.refId || null,
    createdAt: now,
    updatedAt: now,
  }
}

export function listAssets(userId, folderId = undefined) {
  let list = readAll(userId)
  if (folderId !== undefined) list = list.filter((a) => (a.folderId || null) === (folderId || null))
  return list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
}

export function getAsset(userId, id) {
  return readAll(userId).find((a) => a.id === id) || null
}

export function saveAsset(userId, asset) {
  const list = readAll(userId)
  const idx = list.findIndex((a) => a.id === asset.id)
  const next = { ...asset, updatedAt: Date.now() }
  if (idx >= 0) list[idx] = next
  else list.unshift(next)
  writeAll(userId, list)
  return next
}

export function deleteAsset(userId, id) {
  writeAll(userId, readAll(userId).filter((a) => a.id !== id))
}

export function duplicateAsset(userId, id) {
  const src = getAsset(userId, id)
  if (!src) return null
  const copy = createAsset({ ...src, id: undefined, name: `${src.name} (copie)` })
  return saveAsset(userId, copy)
}

export function moveAsset(userId, id, folderId) {
  const a = getAsset(userId, id)
  if (!a) return null
  return saveAsset(userId, { ...a, folderId: folderId || null })
}

export function listAllTags(userId) {
  const tags = new Set()
  readAll(userId).forEach((a) => (a.tags || []).forEach((t) => tags.add(t)))
  return [...tags].sort()
}

export async function importFileAsAsset(userId, file, folderId, meta = {}) {
  const name = file.name || 'fichier'
  const base = createAsset({ folderId, name, size: file.size || 0, ...meta })

  if (file.type === 'application/pdf' || /\.pdf$/i.test(name)) {
    const buf = await file.arrayBuffer()
    const pdfjs = await import('pdfjs-dist')
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
    const doc = await pdfjs.getDocument({ data: buf }).promise
    const page = await doc.getPage(1)
    const vp = page.getViewport({ scale: 1.5 })
    const canvas = document.createElement('canvas')
    canvas.width = vp.width
    canvas.height = vp.height
    await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise
    let textContent = ''
    try {
      for (let i = 1; i <= Math.min(doc.numPages, 6); i += 1) {
        const pg = await doc.getPage(i)
        const c = await pg.getTextContent()
        textContent += `${c.items.map((it) => it.str).join(' ')}\n`
      }
    } catch { /* ignore */ }
    const reader = new FileReader()
    const dataUrl = await new Promise((res, rej) => {
      reader.onload = () => res(reader.result)
      reader.onerror = rej
      reader.readAsDataURL(file)
    })
    return saveAsset(userId, {
      ...base,
      type: meta.type || 'pdf',
      mimeType: 'application/pdf',
      pageCount: doc.numPages,
      dataUrl,
      previewUrl: canvas.toDataURL('image/png'),
      textContent: textContent.trim(),
    })
  }

  if (file.type?.startsWith('image/')) {
    const dataUrl = await new Promise((res, rej) => {
      const r = new FileReader()
      r.onload = () => res(r.result)
      r.onerror = rej
      r.readAsDataURL(file)
    })
    return saveAsset(userId, {
      ...base,
      type: 'image',
      mimeType: file.type,
      dataUrl,
      previewUrl: dataUrl,
      pageCount: 1,
    })
  }

  const text = await file.text().catch(() => '')
  return saveAsset(userId, {
    ...base,
    type: meta.type || 'text',
    mimeType: file.type || 'text/plain',
    textContent: text,
    pageCount: 1,
  })
}

export function linkModuleAsset(userId, { folderId, name, type, refModule, refId, masterFormat, tags }) {
  return saveAsset(userId, createAsset({ folderId, name, type, refModule, refId, masterFormat, tags }))
}
