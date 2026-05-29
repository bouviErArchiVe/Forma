/** Ajuste contraste et niveaux de gris pour scans type document. */
export function processScanImage(
  dataUrl: string,
  opts: { contrast?: number; grayscale?: boolean },
): Promise<string> {
  const contrast = opts.contrast ?? 1.15
  const grayscale = opts.grayscale ?? true
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas indisponible'))
        return
      }
      ctx.drawImage(img, 0, 0)
      const id = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const d = id.data
      for (let i = 0; i < d.length; i += 4) {
        let r = d[i]
        let g = d[i + 1]
        let b = d[i + 2]
        if (grayscale) {
          const y = 0.299 * r + 0.587 * g + 0.114 * b
          r = g = b = y
        }
        r = clamp(((r / 255 - 0.5) * contrast + 0.5) * 255)
        g = clamp(((g / 255 - 0.5) * contrast + 0.5) * 255)
        b = clamp(((b / 255 - 0.5) * contrast + 0.5) * 255)
        d[i] = r
        d[i + 1] = g
        d[i + 2] = b
      }
      ctx.putImageData(id, 0, 0)
      resolve(canvas.toDataURL('image/jpeg', 0.92))
    }
    img.onerror = () => reject(new Error('Image invalide'))
    img.src = dataUrl
  })
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)))
}
