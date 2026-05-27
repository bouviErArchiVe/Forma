/** FormaPresent — import fichiers et sources Forma */

import { createElement } from './model'
import { importFiles as combineImportFiles, importInternalSource, listInternalSources } from '@/lib/formacombine/import'
import { exportMoodboardPng } from '@/lib/moodboard/export'

async function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

/** Importe image/PDF comme élément image sur la slide courante */
export async function importFileAsElement(file) {
  const pages = await combineImportFiles([file])
  if (!pages.length) throw new Error('Import échoué')
  const pg = pages[0]
  return createElement('image', {
    x: 200, y: 200, w: Math.min(pg.width, 1200), h: Math.min(pg.height, 800),
    dataUrl: pg.dataUrl,
    label: pg.name,
  })
}

export async function importVideoFile(file) {
  const dataUrl = await readFileAsDataUrl(file)
  return createElement('video', {
    x: 200, y: 200, w: 960, h: 540,
    dataUrl,
    src: dataUrl,
    label: file.name,
  })
}

export async function importInternalAsElement(item) {
  const pages = await importInternalSource(item)
  if (!pages.length) throw new Error('Source introuvable')
  const pg = pages[0]
  return createElement('embed', {
    x: 100, y: 100,
    w: Math.min(pg.width, 1400),
    h: Math.min(pg.height, 900),
    dataUrl: pg.dataUrl,
    embedType: item.type,
    embedRef: item.id,
    label: item.name || pg.name,
  })
}

export async function importMoodboardAsElement(boardId, boardName, images, mode = 'grid') {
  if (!images?.length) throw new Error('Moodboard vide')
  const blob = await exportMoodboardPng(images, { boardName, mode, gridWidth: 1600 })
  const dataUrl = await new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = reject
    r.readAsDataURL(blob)
  })
  return createElement('embed', {
    x: 80, y: 80, w: 1760, h: 920,
    dataUrl,
    embedType: 'moodboard',
    embedRef: boardId,
    label: boardName || 'FMoodboard',
  })
}

export { listInternalSources }
