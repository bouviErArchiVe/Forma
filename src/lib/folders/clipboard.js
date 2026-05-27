/** Presse-papiers dossiers (mémoire session). */

let clip = null

export function setFolderClipboard(payload) {
  clip = payload ? { ...payload, at: Date.now() } : null
}

export function getFolderClipboard() {
  return clip
}

export function clearFolderClipboard() {
  clip = null
}

export function hasFolderClipboard() {
  return !!clip?.folderIds?.length
}
