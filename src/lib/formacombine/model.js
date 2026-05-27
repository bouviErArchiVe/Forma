/** FormaCombine — modèle pages combinées */

import { A4_PX } from './constants'

function uid(p = 'fcb') {
  return `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function createPage(partial = {}) {
  const now = Date.now()
  return {
    id: uid('pg'),
    name: partial.name || 'Page',
    type: partial.type || 'raster',
    width: partial.width || A4_PX.width,
    height: partial.height || A4_PX.height,
    rotation: partial.rotation || 0,
    dataUrl: partial.dataUrl || null,
    text: partial.text || '',
    bgColor: partial.bgColor || '#ffffff',
    sourceType: partial.sourceType || 'import',
    sourceRef: partial.sourceRef || null,
    createdAt: now,
  }
}

export function createProject(name = 'Combinaison') {
  const now = Date.now()
  return {
    id: uid('proj'),
    name,
    pages: [],
    settings: { pageNumbers: true, title: name },
    createdAt: now,
    updatedAt: now,
  }
}

export function clonePage(page, patch = {}) {
  return { ...JSON.parse(JSON.stringify(page)), id: uid('pg'), ...patch }
}

export function reorderPages(pages, from, to) {
  if (from === to || from < 0 || to < 0 || from >= pages.length || to >= pages.length) return pages
  const next = [...pages]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export function blankPage(name = 'Page blanche') {
  return createPage({ type: 'blank', name, dataUrl: null })
}

export function separatorPage(name = '— Séparation —') {
  return createPage({ type: 'separator', name, width: A4_PX.width, height: 120, text: name, bgColor: '#f0f2f5' })
}

export function titlePage(text = 'Section', name = 'Titre') {
  return createPage({ type: 'title', name, text, width: A4_PX.width, height: 400, bgColor: '#ffffff' })
}

export function textPage(content, name = 'Texte') {
  return createPage({ type: 'text', name, text: content, width: A4_PX.width, height: A4_PX.height })
}

export async function loadImageDimensions(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => resolve({ width: A4_PX.width, height: A4_PX.height })
    img.src = dataUrl
  })
}
