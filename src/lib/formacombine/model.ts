import { createId } from '../id'
import type { FormaCombinePage, FormaCombineProject } from '../../types'
import { A4_PX } from './constants'

export function createPage(partial: Partial<FormaCombinePage> = {}): FormaCombinePage {
  const now = Date.now()
  return {
    id: createId(),
    name: partial.name || 'Page',
    type: partial.type || 'raster',
    width: partial.width || A4_PX.width,
    height: partial.height || A4_PX.height,
    rotation: partial.rotation || 0,
    dataUrl: partial.dataUrl ?? null,
    text: partial.text || '',
    bgColor: partial.bgColor || '#ffffff',
    sourceType: partial.sourceType || 'import',
    sourceRef: partial.sourceRef ?? null,
    createdAt: now,
  }
}

export function createProject(name = 'Combinaison'): FormaCombineProject {
  const now = Date.now()
  return {
    id: createId(),
    name,
    pages: [],
    settings: { pageNumbers: true, title: name },
    createdAt: now,
    updatedAt: now,
  }
}

export function clonePage(page: FormaCombinePage, patch: Partial<FormaCombinePage> = {}): FormaCombinePage {
  return { ...structuredClone(page), id: createId(), ...patch }
}

export function cloneProject(project: FormaCombineProject, name?: string): FormaCombineProject {
  const now = Date.now()
  return {
    ...structuredClone(project),
    id: createId(),
    name: name || `${project.name} (copie)`,
    createdAt: now,
    updatedAt: now,
  }
}

export function reorderPages(pages: FormaCombinePage[], from: number, to: number): FormaCombinePage[] {
  if (from === to || from < 0 || to < 0 || from >= pages.length || to >= pages.length) return pages
  const next = [...pages]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item!)
  return next
}

export function blankPage(name = 'Page blanche'): FormaCombinePage {
  return createPage({ type: 'blank', name, dataUrl: null })
}

export function separatorPage(name = '— Séparation —'): FormaCombinePage {
  return createPage({
    type: 'separator',
    name,
    width: A4_PX.width,
    height: 120,
    text: name,
    bgColor: '#f0f2f5',
  })
}

export function titlePage(text = 'Section', name = 'Titre'): FormaCombinePage {
  return createPage({
    type: 'title',
    name,
    text,
    width: A4_PX.width,
    height: 400,
    bgColor: '#ffffff',
  })
}

export function textPage(content: string, name = 'Texte'): FormaCombinePage {
  return createPage({
    type: 'text',
    name,
    text: content,
    width: A4_PX.width,
    height: A4_PX.height,
  })
}

export async function loadImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => resolve({ width: A4_PX.width, height: A4_PX.height })
    img.src = dataUrl
  })
}
