import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { sheetToCsv } from './formulas'

export function downloadText(filename, content, mime = 'text/plain') {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportCsv(sheet) {
  const safe = (sheet.name || 'tableau').replace(/[^\w\- ]+/g, '_')
  downloadText(`${safe}.csv`, sheetToCsv(sheet), 'text/csv')
}

export function exportJson(sheet) {
  const safe = (sheet.name || 'tableau').replace(/[^\w\- ]+/g, '_')
  downloadText(`${safe}.json`, JSON.stringify(sheet, null, 2), 'application/json')
}

export async function exportPngFromElement(el, filename = 'tableau.png') {
  if (!el) return false
  const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = filename.replace(/[^\w\- .]+/g, '_')
  a.click()
  return true
}

export async function exportPdfFromElement(el, filename = 'tableau.pdf') {
  if (!el) return false
  const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
  const img = canvas.toDataURL('image/png')
  const pw = canvas.width
  const ph = canvas.height
  const orientation = pw > ph ? 'l' : 'p'
  const pdf = new jsPDF({ orientation, unit: 'px', format: [pw, ph] })
  pdf.addImage(img, 'PNG', 0, 0, pw, ph)
  pdf.save(filename.replace(/[^\w\- .]+/g, '_'))
  return true
}

export async function renderSheetToDataUrl(el) {
  if (!el) return null
  const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
  return canvas.toDataURL('image/png')
}
