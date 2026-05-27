/** FormaReview — import de documents pour révision */

import { createPage } from './model'
import { A4_PX } from './constants'

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error(`Lecture impossible : ${file.name}`))
    reader.readAsDataURL(file)
  })
}

function loadImageSize(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => reject(new Error('Image invalide'))
    img.src = dataUrl
  })
}

export async function importImageFile(file) {
  const dataUrl = await readFileAsDataUrl(file)
  let width = A4_PX.width
  let height = A4_PX.height
  try {
    const size = await loadImageSize(dataUrl)
    width = size.width
    height = size.height
  } catch { /* fallback A4 */ }
  return createPage({ name: file.name.replace(/\.[^.]+$/, ''), dataUrl, width, height })
}

export async function importFiles(files) {
  const pages = []
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue
    pages.push(await importImageFile(file))
  }
  if (!pages.length) throw new Error('Aucune image valide (PNG, JPG, WebP…)')
  return pages
}
