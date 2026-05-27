/** FormaFolder — ouverture dans les modules Forma */

import { MODULES } from '@/config/branding'

export function openItemInModule(navigate, item, addNotification) {
  if (!item) return false
  const kind = item.kind
  const raw = item.raw

  if (kind === 'notebook') {
    navigate(`/editor/${raw.id}`)
    return true
  }

  if (kind === 'folder') return false

  if (kind === 'asset') {
    const mod = raw.refModule || raw.type
    if (mod === 'doc' || mod === 'formadoc') {
      navigate(MODULES.formaDoc.route)
      addNotification?.(`Ouvrir « ${raw.name} » dans FormaDoc`, 'info')
      return true
    }
    if (mod === 'sheet' || mod === 'formatab') {
      navigate(MODULES.formaTab.route)
      addNotification?.(`Ouvrir « ${raw.name} » dans FormaTab`, 'info')
      return true
    }
    if (mod === 'proforma') {
      navigate(MODULES.proforma.route)
      addNotification?.(`Ouvrir « ${raw.name} » dans Proforma`, 'info')
      return true
    }
    if (raw.type === 'pdf' && raw.dataUrl) {
      navigate(MODULES.formaDoc.route)
      addNotification?.('PDF — ouvrir dans FormaDoc pour annotation', 'info')
      return true
    }
  }
  return false
}

export function integrationActions(item) {
  if (!item || item.kind !== 'asset') return []
  const t = item.raw?.type
  const actions = []
  if (['pdf', 'doc', 'text', 'fiche', 'norm'].includes(t)) actions.push({ id: 'formadoc', label: 'FormaDoc', route: MODULES.formaDoc.route })
  if (t === 'proforma') actions.push({ id: 'proforma', label: 'Proforma', route: MODULES.proforma.route })
  if (t === 'sheet') actions.push({ id: 'formatab', label: 'FormaTab', route: MODULES.formaTab.route })
  if (['pdf', 'image'].includes(t)) actions.push({ id: 'combine', label: 'FormaCombine', route: MODULES.formaCombine.route })
  actions.push({ id: 'formatcal', label: 'FormatCal', route: MODULES.formatCal.route })
  return actions
}

export function downloadAsset(asset) {
  if (!asset?.dataUrl) return false
  const a = document.createElement('a')
  a.href = asset.dataUrl
  a.download = asset.name || 'fichier'
  a.click()
  return true
}
