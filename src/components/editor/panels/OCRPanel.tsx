import { useEffect, useState } from 'react'
import { useToastStore } from '../../../stores/toastStore'
import { savePageInkText } from '../../../lib/handwriting-index'
import { ocrPage, subscribeOcrProgress } from '../../../lib/ocr'
import { getPage } from '../../../services/pages'

interface OCRPanelProps {
  pageId: string
  onInsertText?: (text: string) => void
  onAddToStudy?: (text: string) => void
}

export function OCRPanel({ pageId, onInsertText, onAddToStudy }: OCRPanelProps) {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState('')

  useEffect(() => {
    setResult('')
    setLoading(false)
    setProgress(0)
  }, [pageId])

  useEffect(() => {
    if (!loading) return
    return subscribeOcrProgress(setProgress)
  }, [loading])

  const run = async () => {
    setLoading(true)
    setResult('')
    setProgress(0)
    try {
      const page = await getPage(pageId)
      if (!page) return
      const text = await ocrPage(page)
      setResult(text)
    } catch {
      setResult('Échec OCR. Réessayez ou utilisez du texte tapé.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2 text-sm">
      <h3 className="font-medium">OCR manuscrit</h3>
      <p className="text-xs text-forma-muted">
        Reconnaissance locale (Tesseract, worker partagé). Peut prendre 10–30 s selon la page.
      </p>
      <button
        type="button"
        disabled={loading}
        onClick={run}
        className="w-full py-2 bg-forma-accent text-white rounded-lg disabled:opacity-50"
      >
        {loading ? `Analyse… ${progress}%` : 'Analyser cette page'}
      </button>
      {loading && (
        <div className="h-1.5 bg-gray-200 rounded overflow-hidden">
          <div
            className="h-full bg-forma-accent transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {result && (
        <>
          <textarea
            readOnly
            value={result}
            className="w-full h-32 text-xs border rounded p-2 bg-gray-50"
          />
          <div className="flex flex-col gap-1">
            <button
              type="button"
              className="w-full py-1.5 border rounded-lg text-xs hover:bg-gray-50"
              onClick={async () => {
                await navigator.clipboard.writeText(result)
                useToastStore.getState().show('Texte OCR copié')
              }}
            >
              Copier le texte
            </button>
            <button
              type="button"
              className="w-full py-1.5 border rounded-lg text-xs hover:bg-gray-50"
              onClick={async () => {
                await savePageInkText(pageId, result)
                useToastStore.getState().show('Texte indexé pour la recherche (Ctrl+K)')
              }}
            >
              Indexer pour la recherche
            </button>
            {onInsertText && result.trim() && (
              <button
                type="button"
                className="w-full py-2 border rounded-lg text-sm hover:bg-gray-50"
                onClick={() => onInsertText(result)}
              >
                Insérer sur la page
              </button>
            )}
            {onAddToStudy && result.trim() && (
              <button
                type="button"
                className="w-full py-2 border rounded-lg text-sm hover:bg-gray-50"
                onClick={() => onAddToStudy(result)}
              >
                Ajouter au Study Set
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
