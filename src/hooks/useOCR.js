// src/hooks/useOCR.js
import { useState, useCallback } from 'react'

export function useOCR() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)

  const recognize = useCallback(async (imageSource, language = 'fra+eng') => {
    setIsProcessing(true)
    setProgress(0)
    setResult(null)

    try {
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker(language, 1, {
        logger: m => {
          if (m.status === 'recognizing text') setProgress(Math.round(m.progress * 100))
        }
      })

      const { data } = await worker.recognize(imageSource)
      await worker.terminate()

      setResult(data.text)
      setProgress(100)
      return data.text
    } catch (err) {
      console.error('OCR error:', err)
      return null
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const recognizeFromCanvas = useCallback(async (canvasRef) => {
    if (!canvasRef?.current) return null
    const imageData = canvasRef.current.toDataURL('image/png')
    return recognize(imageData)
  }, [recognize])

  return { recognize, recognizeFromCanvas, isProcessing, progress, result }
}
