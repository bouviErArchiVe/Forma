import { saveItemWithBlob } from '@/lib/formalibrary/persistence'
import { createItem } from '@/lib/formalibrary/model'

export async function savePostToLibrary(post, addNotification) {
  const url = post.imageUrl || post.attachment?.dataUrl
  const item = createItem({
    name: post.title || 'Post FormaHub',
    category: url ? 'image' : 'document',
    mimeType: post.attachment?.mimeType || (url ? 'image/png' : null),
    dataUrl: url,
    previewUrl: url,
    textContent: post.body || '',
    refModule: 'FormaHub',
    refId: post.id,
    tags: [...(post.tags || []), 'formahub'],
    metadata: { tradeId: post.tradeId, category: post.category },
  })
  await saveItemWithBlob(item)
  addNotification?.(`Enregistré dans FormaLibrary : ${item.name}`, 'success')
  return item
}

export function sendPostToNotebook(post, { setPendingFormulaNote, setActiveNotebook, navigate, notebooks, addNotification }) {
  const text = [`📌 ${post.title}`, '', post.body, '', ...(post.tags || []).map((t) => `#${t}`)].join('\n')
  const nb = notebooks?.[0]
  if (!nb) {
    addNotification?.('Créez un carnet pour envoyer le post', 'info')
    return
  }
  setPendingFormulaNote({ notebookId: nb.id, text })
  setActiveNotebook(nb)
  addNotification?.(`Post envoyé vers « ${nb.title} »`, 'success')
  navigate(`/editor/${nb.id}`)
}
