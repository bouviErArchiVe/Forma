import { db } from '../db'
import { resolveNotebookPdfSource } from './assets'
import { extractPdfText } from './pdf-text'

export async function backfillMissingPdfText(): Promise<number> {
  const notebooks = await db.notebooks.toArray()
  let updated = 0

  for (const nb of notebooks) {
    const src = await resolveNotebookPdfSource(nb)
    if (!src) continue
    const texts = await extractPdfText(src)
    const pages = await db.pages.where('notebookId').equals(nb.id).toArray()
    for (const page of pages) {
      if (page.pdfText?.trim()) continue
      const idx = page.pdfPageIndex ?? 0
      const text = texts[idx] ?? ''
      if (!text.trim()) continue
      await db.pages.update(page.id, { pdfText: text })
      updated++
    }
  }

  return updated
}
