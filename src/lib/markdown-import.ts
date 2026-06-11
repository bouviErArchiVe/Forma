import { createId } from './id'
import { createNotebook } from '../services/library'
import { addPage, getPages, updatePage } from '../services/pages'
import type { PaperTemplate, TextElement } from '../types'
import { normalizePage } from '../types'

function splitMarkdownSections(text: string): string[] {
  const trimmed = text.trim()
  if (!trimmed) return []
  const byHr = trimmed.split(/\n---+\n/)
  if (byHr.length > 1) return byHr.map((s) => s.trim()).filter(Boolean)
  const byHead = trimmed.split(/\n(?=## Page \d+)/i)
  if (byHead.length > 1) return byHead.map((s) => s.trim()).filter(Boolean)
  return [trimmed]
}

function textBlock(pageId: string, content: string): TextElement {
  return {
    id: createId(),
    x: 56,
    y: 56,
    width: 680,
    height: Math.min(900, 80 + content.split('\n').length * 22),
    content,
    fontSize: 15,
    color: '#1a1a1a',
    align: 'left',
    pageId,
  }
}

export async function createNotebookFromMarkdown(
  file: File,
  folderId: string | null,
  paperTemplate: PaperTemplate,
): Promise<string> {
  const content = await file.text()
  const name = file.name.replace(/\.md$/i, '').trim() || 'Import Markdown'
  const sections = splitMarkdownSections(content)
  if (!sections.length) throw new Error('Fichier Markdown vide')

  const nb = await createNotebook({
    name,
    folderId,
    coverColor: '#6366f1',
    paperTemplate,
    orientation: 'portrait',
  })

  const pages = await getPages(nb.id)
  let first = pages[0]
  if (!first) throw new Error('Carnet sans page')

  for (let i = 0; i < sections.length; i++) {
    let page = first
    if (i > 0) {
      const existing = await getPages(nb.id)
      const lastOrder = existing.length ? Math.max(...existing.map((p) => p.order)) : 0
      page = await addPage(nb.id, paperTemplate, lastOrder)
    }
    const norm = normalizePage(page)
    await updatePage({
      ...norm,
      texts: [textBlock(page.id, sections[i])],
    })
    if (i === 0) first = page
  }

  return nb.id
}
