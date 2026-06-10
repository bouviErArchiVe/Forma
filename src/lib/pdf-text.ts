import * as pdfjs from 'pdfjs-dist'
import { ensurePdfWorker } from './pdf-worker-setup'

export async function extractPdfText(dataUrl: string): Promise<string[]> {
  ensurePdfWorker()
  const base64 = dataUrl.split(',')[1]
  if (!base64) return []
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const pdf = await pdfjs.getDocument({ data: bytes }).promise
  const texts: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const str = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    texts.push(str)
  }
  return texts
}
