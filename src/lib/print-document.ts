import { basePageDimensions } from './page-dimensions'
import { renderFullPage } from './page-render'
import type { Notebook, Orientation, Page } from '../types'

const PRINT_ROOT_ID = 'forma-print-root'

export async function printNotebookPages(
  pages: Page[],
  orientation: Orientation = 'portrait',
  notebook?: Notebook | null,
): Promise<void> {
  const sorted = [...pages].sort((a, b) => a.order - b.order)
  const { width, height } = basePageDimensions(orientation)

  let root = document.getElementById(PRINT_ROOT_ID)
  if (!root) {
    root = document.createElement('div')
    root.id = PRINT_ROOT_ID
    document.body.appendChild(root)
  }
  root.innerHTML = ''

  for (const page of sorted) {
    const canvas = await renderFullPage(page, width, height, { notebook })
    const img = document.createElement('img')
    img.src = canvas.toDataURL('image/png')
    img.alt = `Page ${page.order + 1}`
    img.className = 'forma-print-page'
    root.appendChild(img)
  }

  const cleanup = () => {
    root?.remove()
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)
  window.print()
}
