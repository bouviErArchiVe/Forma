import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { docToPlainText, docToMarkdown, downloadText } from './htmlUtils'

export async function exportDocPdf(pagesEl, filename = 'document.pdf') {
  if (!pagesEl?.length) return false
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' })
  for (let i = 0; i < pagesEl.length; i++) {
    const el = pagesEl[i]
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
    const img = canvas.toDataURL('image/png')
    const pw = pdf.internal.pageSize.getWidth()
    const ph = pdf.internal.pageSize.getHeight()
    if (i > 0) pdf.addPage()
    pdf.addImage(img, 'PNG', 0, 0, pw, ph)
  }
  pdf.save(filename.replace(/[^\w\- .]+/g, '_'))
  return true
}

export async function exportDocPng(pageEl, filename = 'page.png') {
  if (!pageEl) return false
  const canvas = await html2canvas(pageEl, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = filename.replace(/[^\w\- .]+/g, '_')
  a.click()
  return true
}

export async function renderPageToDataUrl(pageEl) {
  if (!pageEl) return null
  const canvas = await html2canvas(pageEl, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
  return canvas.toDataURL('image/png')
}

export function exportDocTxt(doc) {
  const safe = (doc.name || 'document').replace(/[^\w\- ]+/g, '_')
  downloadText(`${safe}.txt`, docToPlainText(doc))
}

export function exportDocMd(doc) {
  const safe = (doc.name || 'document').replace(/[^\w\- ]+/g, '_')
  downloadText(`${safe}.md`, docToMarkdown(doc), 'text/markdown')
}

export function exportDocJson(doc) {
  const safe = (doc.name || 'document').replace(/[^\w\- ]+/g, '_')
  downloadText(`${safe}.json`, JSON.stringify(doc, null, 2), 'application/json')
}

export { downloadText }
