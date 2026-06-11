import type { Page } from '../types'
import { normalizePage } from '../types'

/** Export JSON lisible d’une page (traits, formes, textes, etc.). */
export function exportPageJson(page: Page, filename: string): void {
  const data = normalizePage(page)
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.json') ? filename : `${filename}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/** Fusionne le contenu importé dans une page existante (conserve id / métadonnées). */
export function mergePageFromJson(target: Page, imported: Page): Page {
  const src = normalizePage(imported)
  return normalizePage({
    ...target,
    strokes: src.strokes.map((s) => ({ ...s, pageId: target.id })),
    shapes: src.shapes.map((s) => ({ ...s, pageId: target.id })),
    texts: src.texts.map((t) => ({ ...t, pageId: target.id })),
    images: src.images,
    stickers: src.stickers.map((s) => ({ ...s, pageId: target.id })),
    tapes: src.tapes.map((t) => ({ ...t, pageId: target.id })),
  })
}

export function parsePageJsonFile(file: File): Promise<Page> {
  return file.text().then((text) => normalizePage(JSON.parse(text) as Page))
}
