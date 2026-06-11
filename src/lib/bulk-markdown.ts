import JSZip from 'jszip'
import { notebookToMarkdown } from './notebook-markdown'
import { getAllNotebooks, getNotebook } from '../services/library'
import { getPages } from '../services/pages'

export async function exportNotebooksMarkdownZip(
  notebookIds: string[],
  onProgress?: (label: string, index: number, total: number) => void,
): Promise<number> {
  const zip = new JSZip()
  let count = 0
  const total = notebookIds.length
  for (let i = 0; i < notebookIds.length; i++) {
    const id = notebookIds[i]
    const nb = await getNotebook(id)
    if (!nb || nb.deletedAt) continue
    onProgress?.(nb.name, i + 1, total)
    const pages = await getPages(id)
    const safe = nb.name.replace(/[^\w\s.-]/g, '').trim() || `carnet-${id.slice(0, 6)}`
    zip.file(`${safe}.md`, notebookToMarkdown(nb, pages))
    count++
  }
  if (count === 0) throw new Error('Aucun carnet à exporter')
  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `forma-markdown-${new Date().toISOString().slice(0, 10)}.zip`
  a.click()
  URL.revokeObjectURL(url)
  return count
}

export async function exportFullLibraryMarkdownZip(
  onProgress?: (label: string, index: number, total: number) => void,
): Promise<number> {
  const ids = (await getAllNotebooks())
    .filter((n) => !n.deletedAt)
    .map((n) => n.id)
  return exportNotebooksMarkdownZip(ids, onProgress)
}
