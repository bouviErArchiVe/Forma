import { useEffect, useRef, useState } from 'react'
import { processScanImage } from '../../lib/scan-process'

interface ScannerModalProps {
  onCapture: (dataUrl: string) => void
  onClose: () => void
}

export function ScannerModal({ onCapture, onClose }: ScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState('')
  const [raw, setRaw] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [contrast, setContrast] = useState(1.2)
  const [grayscale, setGrayscale] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (raw) return
    let stream: MediaStream | null = null
    ;(async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
      } catch {
        setError('Caméra non disponible')
      }
    })()
    return () => stream?.getTracks().forEach((t) => t.stop())
  }, [raw])

  useEffect(() => {
    if (!raw) {
      setPreview(null)
      return
    }
    setBusy(true)
    processScanImage(raw, { contrast, grayscale })
      .then(setPreview)
      .finally(() => setBusy(false))
  }, [raw, contrast, grayscale])

  const capture = () => {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0)
    setRaw(canvas.toDataURL('image/jpeg', 0.9))
  }

  const confirm = () => {
    if (preview) {
      onCapture(preview)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden max-w-lg w-full">
        <div className="p-3 flex justify-between items-center border-b dark:border-gray-700">
          <h3 className="font-medium">{raw ? 'Ajuster le scan' : 'Scanner'}</h3>
          <button type="button" onClick={onClose}>
            ×
          </button>
        </div>
        {error ? (
          <p className="p-6 text-center text-red-600">{error}</p>
        ) : raw ? (
          <div className="p-3 space-y-3">
            {preview && (
              <img src={preview} alt="Aperçu" className="w-full rounded border dark:border-gray-700" />
            )}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={grayscale}
                onChange={(e) => setGrayscale(e.target.checked)}
              />
              Niveaux de gris
            </label>
            <label className="block text-sm">
              Contraste
              <input
                type="range"
                min={0.8}
                max={2}
                step={0.05}
                value={contrast}
                onChange={(e) => setContrast(+e.target.value)}
                className="w-full mt-1"
              />
            </label>
          </div>
        ) : (
          <video ref={videoRef} className="w-full bg-black" playsInline muted />
        )}
        <div className="p-3 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 py-2 border rounded-lg dark:border-gray-600">
            Annuler
          </button>
          {raw ? (
            <>
              <button
                type="button"
                onClick={() => setRaw(null)}
                className="flex-1 py-2 border rounded-lg dark:border-gray-600"
              >
                Reprendre
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={!preview || busy}
                className="flex-1 py-2 bg-forma-accent text-white rounded-lg disabled:opacity-50"
              >
                Insérer
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={capture}
              disabled={!!error}
              className="flex-1 py-2 bg-forma-accent text-white rounded-lg disabled:opacity-50"
            >
              Capturer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
