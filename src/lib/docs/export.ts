import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { FormaDocument } from '../../types'
import { docToMarkdown, docToPlainText, downloadText } from './htmlUtils'

function safeFilename(name: string): string {
  return (name || 'document').replace(/[^\w\- ]+/g, '_').trim() || 'document'
}

export function exportDocumentTxt(doc: FormaDocument): void {
  downloadText(`${safeFilename(doc.name)}.txt`, docToPlainText(doc))
}

export function exportDocumentMd(doc: FormaDocument): void {
  downloadText(`${safeFilename(doc.name)}.md`, docToMarkdown(doc), 'text/markdown')
}

function wrapLines(text: string, maxChars: number): string[] {
  const lines: string[] = []
  for (const paragraph of text.split('\n')) {
    if (!paragraph.trim()) {
      lines.push('')
      continue
    }
    let rest = paragraph
    while (rest.length > maxChars) {
      let breakAt = rest.lastIndexOf(' ', maxChars)
      if (breakAt < maxChars * 0.5) breakAt = maxChars
      lines.push(rest.slice(0, breakAt).trim())
      rest = rest.slice(breakAt).trim()
    }
    if (rest) lines.push(rest)
  }
  return lines
}

export async function exportDocumentPdf(doc: FormaDocument): Promise<void> {
  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const fontSize = 11
  const lineHeight = fontSize * 1.4
  const margin = 48
  const pageWidth = 595
  const pageHeight = 842
  const maxChars = 90

  let page = pdf.addPage([pageWidth, pageHeight])
  let y = pageHeight - margin

  const writeLine = (line: string) => {
    if (y < margin + lineHeight) {
      page = pdf.addPage([pageWidth, pageHeight])
      y = pageHeight - margin
    }
    page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0.1, 0.1, 0.1) })
    y -= lineHeight
  }

  writeLine(doc.name)
  y -= lineHeight * 0.5

  for (const block of docToPlainText(doc).split('\n')) {
    if (!block.trim()) {
      y -= lineHeight * 0.5
      continue
    }
    for (const line of wrapLines(block, maxChars)) {
      writeLine(line)
    }
  }

  const bytes = await pdf.save()
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${safeFilename(doc.name)}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}
