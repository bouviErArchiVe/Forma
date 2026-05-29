import { renderFullPage } from './page-render'
import type { Page } from '../types'

type WorkerInstance = Awaited<ReturnType<typeof import('tesseract.js')['createWorker']>>

let workerPromise: Promise<WorkerInstance> | null = null
const progressListeners = new Set<(pct: number) => void>()

export function subscribeOcrProgress(cb: (pct: number) => void): () => void {
  progressListeners.add(cb)
  return () => progressListeners.delete(cb)
}

function notifyProgress(pct: number): void {
  for (const cb of progressListeners) cb(pct)
}

async function getWorker(): Promise<WorkerInstance> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import('tesseract.js')
      return createWorker('fra+eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text' && typeof m.progress === 'number') {
            notifyProgress(Math.round(m.progress * 100))
          }
        },
      })
    })()
  }
  return workerPromise
}

export async function ocrPage(page: Page): Promise<string> {
  notifyProgress(0)
  const canvas = await renderFullPage(page, 800, 1130)
  const worker = await getWorker()
  const {
    data: { text },
  } = await worker.recognize(canvas)
  notifyProgress(100)
  return text.trim()
}

export async function ocrRegion(
  page: Page,
  x: number,
  y: number,
  w: number,
  h: number,
): Promise<string> {
  notifyProgress(0)
  const full = await renderFullPage(page)
  const crop = document.createElement('canvas')
  crop.width = Math.max(1, Math.floor(w))
  crop.height = Math.max(1, Math.floor(h))
  const ctx = crop.getContext('2d')!
  ctx.drawImage(full, x, y, w, h, 0, 0, crop.width, crop.height)
  const worker = await getWorker()
  const {
    data: { text },
  } = await worker.recognize(crop)
  notifyProgress(100)
  return text.trim()
}
