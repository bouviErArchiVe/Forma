/** FormaCombine — export PDF / PNG / JPG / ZIP */

import jsPDF from 'jspdf'
import JSZip from 'jszip'
import { pageToDataUrl, pxToMm, downloadBlob, safeFilename } from './render'

async function renderAllPages(project) {
  const { pages, settings } = project
  const out = []
  for (let i = 0; i < pages.length; i += 1) {
    const num = settings?.pageNumbers ? i + 1 : null
    const png = await pageToDataUrl(pages[i], { format: 'png', pageNumber: num })
    const jpg = await pageToDataUrl(pages[i], { format: 'jpeg', quality: 0.92, pageNumber: num })
    out.push({ page: pages[i], png, jpg, index: i })
  }
  return out
}

export async function exportCombinedPdf(project) {
  const { pages, settings } = project
  if (!pages?.length) throw new Error('Aucune page à exporter')

  let pdf = null
  for (let i = 0; i < pages.length; i += 1) {
    const page = pages[i]
    const num = settings?.pageNumbers ? i + 1 : null
    let png
    try {
      png = await pageToDataUrl(page, { format: 'png', pageNumber: num })
    } catch (err) {
      throw new Error(`Page ${i + 1} (« ${page.name || 'sans titre'} ») : ${err?.message || 'format non supporté'}`)
    }
    const wMm = pxToMm(page.width)
    const hMm = pxToMm(page.height)
    if (i === 0) {
      pdf = new jsPDF({
        orientation: page.width > page.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [wMm, hMm],
      })
    } else {
      pdf.addPage([wMm, hMm], page.width > page.height ? 'landscape' : 'portrait')
    }
    pdf.addImage(png, 'PNG', 0, 0, wMm, hMm)
  }

  if (project.name) pdf.setProperties({ title: project.name })
  return pdf.output('blob')
}

export async function exportCombinedZip(project, { format = 'png' } = {}) {
  const rendered = await renderAllPages(project)
  const zip = new JSZip()
  const folderName = (project.name || 'formacombine').replace(/[^\w\- ]+/g, '_')
  const folder = zip.folder(folderName) || zip

  rendered.forEach(({ png, jpg, index, page }) => {
    const ext = format === 'jpeg' ? 'jpg' : 'png'
    const data = (format === 'jpeg' ? jpg : png).split(',')[1]
    const fname = `${String(index + 1).padStart(3, '0')}_${(page.name || 'page').replace(/[^\w\- ]+/g, '_')}.${ext}`
    folder.file(fname, data, { base64: true })
  })

  zip.file('manifest.json', JSON.stringify({
    name: project.name,
    exportedAt: Date.now(),
    pageCount: rendered.length,
    settings: project.settings,
  }, null, 2))

  return zip.generateAsync({ type: 'blob' })
}

export async function exportProjectBundle(project) {
  const zip = new JSZip()
  zip.file('project.json', JSON.stringify(project, null, 2))
  const rendered = await renderAllPages(project)
  const folder = zip.folder('pages') || zip
  rendered.forEach(({ png, index, page }) => {
    const fname = `${String(index + 1).padStart(3, '0')}_${(page.name || 'page').replace(/[^\w\- ]+/g, '_')}.png`
    folder.file(fname, png.split(',')[1], { base64: true })
  })
  zip.file('manifest.json', JSON.stringify({
    name: project.name,
    exportedAt: Date.now(),
    pageCount: rendered.length,
    settings: project.settings,
  }, null, 2))
  return zip.generateAsync({ type: 'blob' })
}

export async function downloadCombinedPdf(project) {
  const blob = await exportCombinedPdf(project)
  downloadBlob(blob, safeFilename(project.name, 'pdf'))
}

export async function downloadCombinedZip(project, format = 'png') {
  const blob = await exportCombinedZip(project, { format })
  downloadBlob(blob, safeFilename(`${project.name}_${format}`, 'zip'))
}

export async function downloadProjectBundle(project) {
  const blob = await exportProjectBundle(project)
  downloadBlob(blob, safeFilename(`${project.name}_dossier`, 'zip'))
}

export async function downloadAllPagesIndividually(project, format = 'png') {
  const rendered = await renderAllPages(project)
  for (const { png, jpg, index, page } of rendered) {
    const url = format === 'jpeg' ? jpg : png
    const ext = format === 'jpeg' ? 'jpg' : 'png'
    const a = document.createElement('a')
    a.href = url
    a.download = `${String(index + 1).padStart(3, '0')}_${(page.name || 'page').replace(/[^\w\- ]+/g, '_')}.${ext}`
    a.click()
    await new Promise((r) => setTimeout(r, 120))
  }
}
