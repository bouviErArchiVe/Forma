import type { Notebook, Page } from '../types'
import { normalizePage } from '../types'

function downloadText(text: string, filename: string): void {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.md') ? filename : `${filename}.md`
  a.click()
  URL.revokeObjectURL(url)
}

export function pageToMarkdown(page: Page, pageNum: number): string {
  const p = normalizePage(page)
  const parts: string[] = [`## Page ${pageNum}`, '']
  let hasBody = false
  for (const t of p.texts) {
    if (t.content.trim()) {
      parts.push(t.content.trim(), '')
      hasBody = true
    }
  }
  if (p.pdfText?.trim()) {
    parts.push('### Texte PDF', '', p.pdfText.trim(), '')
    hasBody = true
  }
  if (p.inkText?.trim()) {
    parts.push('### Manuscrit (OCR)', '', p.inkText.trim(), '')
    hasBody = true
  }
  if (!hasBody) parts.push('_(aucun texte indexé sur cette page)_', '')
  return parts.join('\n').trimEnd()
}

export function notebookToMarkdown(notebook: Notebook, pages: Page[]): string {
  const sorted = [...pages].sort((a, b) => a.order - b.order)
  const header = [
    `# ${notebook.name}`,
    '',
    `> Export Forma — ${new Date().toLocaleString('fr-FR')}`,
    '',
  ]
  const body = sorted.map((p, i) => pageToMarkdown(p, i + 1)).join('\n\n---\n\n')
  return [...header, body].join('\n')
}

export function downloadPageMarkdown(
  page: Page,
  notebookName: string,
  pageIndex: number,
): void {
  const safe = notebookName.replace(/[^\w\s.-]/g, '').trim() || 'page'
  downloadText(pageToMarkdown(page, pageIndex), `${safe}-p${pageIndex}.md`)
}

export function downloadNotebookMarkdown(notebook: Notebook, pages: Page[]): void {
  const safe = notebook.name.replace(/[^\w\s.-]/g, '').trim() || 'carnet'
  downloadText(notebookToMarkdown(notebook, pages), `${safe}.md`)
}
