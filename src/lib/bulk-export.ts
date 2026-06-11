import { exportNotebookToPdf } from './pdf-export'
import { getNotebook } from '../services/library'
import { getPages } from '../services/pages'

export async function exportNotebooksToPdf(
  notebookIds: string[],
  onProgress?: (label: string, index: number, total: number) => void,
): Promise<number> {
  let done = 0
  const total = notebookIds.length
  for (let i = 0; i < notebookIds.length; i++) {
    const id = notebookIds[i]
    const nb = await getNotebook(id)
    if (!nb || nb.deletedAt) continue
    onProgress?.(nb.name, i + 1, total)
    const pages = await getPages(id)
    if (!pages.length) continue
    await exportNotebookToPdf(
      pages,
      `${nb.name}.pdf`,
      nb.orientation,
      undefined,
      undefined,
      nb,
    )
    done++
  }
  return done
}
