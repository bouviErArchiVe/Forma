/** PROFORMA — export PNG / PDF */

import jsPDF from 'jspdf'
import { docToDataUrl, compositeToCanvas } from './render'

export async function exportProformaPng(doc, { transparent = false } = {}) {
  const payload = transparent ? { ...doc, transparent: true, bgColor: null } : doc
  return docToDataUrl(payload, transparent ? 'image/png' : 'image/png')
}

export async function exportProformaJpg(doc, quality = 0.92) {
  const c = document.createElement('canvas')
  compositeToCanvas(c, doc)
  return c.toDataURL('image/jpeg', quality)
}

export async function exportProformaPdf(doc, { title } = {}) {
  const dataUrl = docToDataUrl(doc)
  const wMm = (doc.width / 3.78).toFixed(1)
  const hMm = (doc.height / 3.78).toFixed(1)
  const orientation = doc.width > doc.height ? 'landscape' : 'portrait'
  const pdf = new jsPDF({ orientation, unit: 'mm', format: [parseFloat(wMm), parseFloat(hMm)] })
  pdf.addImage(dataUrl, 'PNG', 0, 0, parseFloat(wMm), parseFloat(hMm))
  if (title) pdf.setProperties({ title })
  return pdf.output('blob')
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}

export async function importImageAsLayer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve({ src: reader.result, name: file.name, type: file.type })
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
