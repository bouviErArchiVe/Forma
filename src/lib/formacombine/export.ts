import JSZip from 'jszip'
import type { FormaCombineProject } from '../../types'
import {
  downloadBlob,
  exportCombinedPdfBlob,
  renderAllPages,
  safeFilename,
} from './render'

export async function downloadCombinedPdf(project: FormaCombineProject): Promise<void> {
  const blob = await exportCombinedPdfBlob(project)
  downloadBlob(blob, safeFilename(project.name, 'pdf'))
}

export async function downloadCombinedZip(
  project: FormaCombineProject,
  format: 'png' | 'jpeg' = 'png',
): Promise<void> {
  const rendered = await renderAllPages(project)
  const zip = new JSZip()
  const folderName = (project.name || 'formacombine').replace(/[^\w\- ]+/g, '_')
  const folder = zip.folder(folderName) || zip

  rendered.forEach(({ png, jpg, index, page }) => {
    const ext = format === 'jpeg' ? 'jpg' : 'png'
    const data = (format === 'jpeg' ? jpg : png).split(',')[1]
    const fname = `${String(index + 1).padStart(3, '0')}_${(page.name || 'page').replace(/[^\w\- ]+/g, '_')}.${ext}`
    folder.file(fname, data!, { base64: true })
  })

  zip.file(
    'manifest.json',
    JSON.stringify(
      {
        name: project.name,
        exportedAt: Date.now(),
        pageCount: rendered.length,
        settings: project.settings,
      },
      null,
      2,
    ),
  )

  const blob = await zip.generateAsync({ type: 'blob' })
  downloadBlob(blob, safeFilename(`${project.name}_${format}`, 'zip'))
}

export async function downloadProjectBundle(project: FormaCombineProject): Promise<void> {
  const zip = new JSZip()
  zip.file('project.json', JSON.stringify(project, null, 2))
  const rendered = await renderAllPages(project)
  const folder = zip.folder('pages') || zip
  rendered.forEach(({ png, index, page }) => {
    const fname = `${String(index + 1).padStart(3, '0')}_${(page.name || 'page').replace(/[^\w\- ]+/g, '_')}.png`
    folder.file(fname, png.split(',')[1]!, { base64: true })
  })
  zip.file(
    'manifest.json',
    JSON.stringify(
      {
        name: project.name,
        exportedAt: Date.now(),
        pageCount: rendered.length,
        settings: project.settings,
      },
      null,
      2,
    ),
  )
  const blob = await zip.generateAsync({ type: 'blob' })
  downloadBlob(blob, safeFilename(`${project.name}_dossier`, 'zip'))
}

export async function downloadAllPagesIndividually(
  project: FormaCombineProject,
  format: 'png' | 'jpeg' = 'png',
): Promise<void> {
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

export { exportCombinedPdfBlob }
