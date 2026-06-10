import * as pdfjs from 'pdfjs-dist'

let _initialized = false

export function ensurePdfWorker(): void {
  if (_initialized) return
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).href
  _initialized = true
}
