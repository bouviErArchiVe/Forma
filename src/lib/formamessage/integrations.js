/** FormaMessage — intégrations modules Forma */

import { saveItemWithBlob } from '@/lib/formalibrary/persistence'
import { createItem } from '@/lib/formalibrary/model'
import useMoodboardStore from '@/stores/useMoodboardStore'

export async function saveToFormaLibrary(attachment, addNotification) {
  if (!attachment?.dataUrl && !attachment?.url) {
    addNotification?.('Aucun fichier à enregistrer', 'error')
    return null
  }
  const item = createItem({
    name: attachment.name || 'Fichier message',
    category: attachment.mimeType?.startsWith('image/') ? 'image' : 'document',
    mimeType: attachment.mimeType,
    dataUrl: attachment.dataUrl || attachment.url,
    previewUrl: attachment.dataUrl || attachment.url,
    size: attachment.size || 0,
    refModule: 'FormaMessage',
    metadata: { fromMessage: true },
  })
  await saveItemWithBlob(item)
  addNotification?.(`Enregistré dans FormaLibrary : ${item.name}`, 'success')
  return item
}

export function addToMoodboard(attachment, addNotification) {
  const boards = useMoodboardStore.getState().boards.filter((b) => !b.archived)
  const board = boards[0]
  if (!board) {
    addNotification?.('Créez un moodboard d\'abord', 'info')
    return null
  }
  const url = attachment?.dataUrl || attachment?.url
  if (!url) return null
  useMoodboardStore.getState().addImage(board.id, {
    url,
    name: attachment.name || 'Depuis FormaMessage',
    tags: ['formamessage'],
  })
  addNotification?.('Image ajoutée au moodboard', 'success')
  return board.id
}

export function sendTextToNotebook(text, { setPendingFormulaNote, setActiveNotebook, navigate, notebooks, addNotification }) {
  const clean = String(text || '').trim()
  if (!clean) return
  const nb = notebooks?.[0]
  if (!nb) {
    addNotification?.('Créez un carnet pour recevoir le message', 'info')
    return
  }
  setPendingFormulaNote({ notebookId: nb.id, text: clean })
  setActiveNotebook(nb)
  addNotification?.(`Message envoyé vers « ${nb.title} »`, 'success')
  navigate(`/editor/${nb.id}`)
}

export function openInFormaReview(attachment, navigate, addNotification) {
  const url = attachment?.dataUrl || attachment?.url
  if (!url) return
  try {
    sessionStorage.setItem('forma-review-import', JSON.stringify({ dataUrl: url, name: attachment.name }))
    addNotification?.('Ouverture FormaReview…', 'info')
    navigate('/formareview')
  } catch {
    addNotification?.('Import FormaReview impossible', 'error')
  }
}

export function openInFormaCombine(attachment, navigate, addNotification) {
  const url = attachment?.dataUrl || attachment?.url
  if (!url) return
  try {
    sessionStorage.setItem('forma-combine-import-url', url)
    addNotification?.('Ouverture FormaCombine…', 'info')
    navigate('/formacombine')
  } catch {
    addNotification?.('Import FormaCombine impossible', 'error')
  }
}
