import { loadLocalPages } from '@/lib/projectPersistence'
import { getFolderAncestors, getFolderChildren, getFolderDescendantIds } from '@/lib/folders/tree'
import { buildZip, downloadBlob, safeExportName } from '@/lib/folders/zip'

function collectFolderScope(folderIds, folders) {
  const allFolderIds = new Set()
  folderIds.forEach((fid) => {
    allFolderIds.add(fid)
    getFolderDescendantIds(folders, fid).forEach((id) => allFolderIds.add(id))
  })
  return allFolderIds
}

function folderZipPath(folders, folderId) {
  const ancestors = getFolderAncestors(folders, folderId)
  return ancestors.map((f) => safeExportName(f.name)).join('/')
}

export async function exportFoldersZip({ folderIds, folders, notebooks, includeSubfolders = true }) {
  const ids = folderIds?.length ? folderIds : folders.map((f) => f.id)
  const scopeIds = includeSubfolders ? collectFolderScope(ids, folders) : new Set(ids)
  const files = []

  const manifest = {
    exportedAt: new Date().toISOString(),
    folders: folders.filter((f) => scopeIds.has(f.id)).map((f) => ({
      id: f.id,
      name: f.name,
      parentId: f.parentId,
      path: folderZipPath(folders, f.id),
    })),
    notebooks: notebooks.filter((n) => scopeIds.has(n.folder_id)).map((n) => ({
      id: n.id,
      title: n.title,
      folder_id: n.folder_id,
    })),
  }
  files.push({ name: 'manifest.json', data: JSON.stringify(manifest, null, 2) })

  notebooks.forEach((nb) => {
    if (!scopeIds.has(nb.folder_id)) return
    const folder = folders.find((f) => f.id === nb.folder_id)
    const base = folder ? `${folderZipPath(folders, folder.id)}/` : ''
    const nbName = safeExportName(nb.title || nb.id)
    files.push({
      name: `${base}${nbName}/notebook.json`,
      data: JSON.stringify(nb, null, 2),
    })
    try {
      const pages = loadLocalPages(nb.id)
      files.push({
        name: `${base}${nbName}/pages.json`,
        data: JSON.stringify(pages, null, 2),
      })
    } catch { /* ignore */ }
  })

  folders.filter((f) => scopeIds.has(f.id)).forEach((f) => {
    const path = folderZipPath(folders, f.id)
    files.push({
      name: `${path}/_folder.json`,
      data: JSON.stringify(f, null, 2),
    })
  })

  const rootName = ids.length === 1
    ? safeExportName(folders.find((f) => f.id === ids[0])?.name || 'dossier')
    : 'selection_dossiers'
  const zip = buildZip(files)
  downloadBlob(new Blob([zip], { type: 'application/zip' }), `${rootName}.zip`)
  return { ok: true, fileCount: files.length }
}

export async function exportFoldersPdf({ folderIds, folders, notebooks, includeSubfolders = true }) {
  const { default: jsPDF } = await import('jspdf')
  const ids = folderIds?.length ? folderIds : folders.map((f) => f.id)
  const scopeIds = includeSubfolders ? collectFolderScope(ids, folders) : new Set(ids)
  const list = notebooks.filter((n) => scopeIds.has(n.folder_id))

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  let first = true

  list.forEach((nb) => {
    const pages = loadLocalPages(nb.id)
    const folder = folders.find((f) => f.id === nb.folder_id)
    const folderLabel = folder ? folder.name : 'Sans dossier'

    if (!pages.length) {
      if (!first) pdf.addPage()
      first = false
      pdf.setFontSize(16)
      pdf.text(nb.title || 'Carnet', 20, 30)
      pdf.setFontSize(11)
      pdf.text(`Dossier: ${folderLabel}`, 20, 42)
      pdf.text('Aucune page enregistrée localement', 20, 54)
      return
    }

    pages.sort((a, b) => (a.page_number || 0) - (b.page_number || 0)).forEach((pg, idx) => {
      if (!first) pdf.addPage()
      first = false
      pdf.setFontSize(14)
      pdf.text(nb.title || 'Carnet', 20, 24)
      pdf.setFontSize(10)
      pdf.text(`Dossier: ${folderLabel}`, 20, 32)
      pdf.text(`Page ${pg.page_number ?? idx + 1}`, 20, 40)
      if (pg.name) pdf.text(String(pg.name).slice(0, 80), 20, 48)
    })
  })

  if (first) {
    pdf.setFontSize(14)
    pdf.text('Export dossier — aucun carnet', 20, 30)
  }

  const rootName = ids.length === 1
    ? safeExportName(folders.find((f) => f.id === ids[0])?.name || 'dossier')
    : 'selection_dossiers'
  pdf.save(`${rootName}.pdf`)
  return { ok: true, pageCount: list.length }
}

export async function exportFoldersPngManifest({ folderIds, folders, notebooks, includeSubfolders = true }) {
  const ids = folderIds?.length ? folderIds : folders.map((f) => f.id)
  const scopeIds = includeSubfolders ? collectFolderScope(ids, folders) : new Set(ids)
  const lines = ['Forma — Export dossier (manifeste PNG)', `Date: ${new Date().toLocaleString('fr-FR')}`, '']

  folders.filter((f) => scopeIds.has(f.id)).forEach((f) => {
    const sub = getFolderChildren(folders, f.id).length
    const nb = notebooks.filter((n) => n.folder_id === f.id).length
    lines.push(`📁 ${folderZipPath(folders, f.id)} — ${sub} sous-dossier(s), ${nb} carnet(s)`)
  })

  notebooks.filter((n) => scopeIds.has(n.folder_id)).forEach((nb) => {
    const pg = loadLocalPages(nb.id).length
    lines.push(`  📓 ${nb.title} (${pg} p.)`)
  })

  const rootName = ids.length === 1
    ? safeExportName(folders.find((f) => f.id === ids[0])?.name || 'dossier')
    : 'selection_dossiers'
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
  downloadBlob(blob, `${rootName}_apercu.txt`)
  return { ok: true }
}
