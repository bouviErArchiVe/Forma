// src/hooks/useOCR.js
import { useState, useCallback } from 'react'
import { recognizeFromFile, recognizeText } from '@/lib/ocr'

export function useOCR() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [lastMethod, setLastMethod] = useState(null)

  const recognize = useCallback(async (source, language = 'fra+eng') => {
    setIsProcessing(true)
    setProgress(0)
    setResult(null)
    setLastMethod(null)

    try {
      if (source instanceof File || source instanceof Blob) {
        const lang = typeof language === 'string' && language.length <= 3 ? language : 'fr'
        const out = await recognizeFromFile(source, lang, (pct) => setProgress(pct))
        setLastMethod(out.method)
        if (out.text) {
          setResult(out.text)
          setProgress(100)
          return { text: out.text, ...out }
        }
        setResult(null)
        return { text: null, ...out }
      }

      const text = await recognizeText(source, language, (pct) => setProgress(pct))
      setLastMethod('direct')
      setResult(text || null)
      setProgress(100)
      return text
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

  return { recognize, recognizeFromCanvas, isProcessing, progress, result, lastMethod }
}
