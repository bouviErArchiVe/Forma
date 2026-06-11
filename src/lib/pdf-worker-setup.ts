import * as pdfjs from 'pdfjs-dist'
// Import `?worker` : le worker passe par le pipeline de modules Vite
// (servi en dev même si node_modules est résolu hors racine du projet,
// bundlé en chunk dédié en prod) — contrairement à une URL /@fs brute
// qui peut être refusée par server.fs.allow.
import PdfJsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker'

let _initialized = false

export function ensurePdfWorker(): void {
  if (_initialized) return
  pdfjs.GlobalWorkerOptions.workerPort = new PdfJsWorker()
  _initialized = true
}
