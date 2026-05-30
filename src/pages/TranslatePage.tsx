import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BrandLogo } from '../components/BrandLogo'
import { GlassButton } from '../components/ui/GlassButton'
import { subscribeOcrProgress } from '../lib/ocr'
import { recognizeDocument, SCAN_METHOD_LABELS, type ScanMethod } from '../lib/translation/scan'
import {
  getTranslationProvider,
  getTranslationText,
  translateText,
  TRANSLATION_LANGUAGES,
  TRANSLATION_PROVIDERS,
} from '../lib/translation/translate'
import { useToastStore } from '../stores/toastStore'

export function TranslatePage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const previewUrlRef = useRef<string | null>(null)

  const [searchParams] = useSearchParams()
  const [sourceLang, setSourceLang] = useState('en')
  const [targetLang, setTargetLang] = useState('fr')
  const [sourceText, setSourceText] = useState(() => searchParams.get('text') || '')
  const [resultText, setResultText] = useState('')
  const [translating, setTranslating] = useState(false)
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')

  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [preview, setPreview] = useState<{ url: string; isImage: boolean } | null>(null)
  const [scanMethod, setScanMethod] = useState<ScanMethod | null>(null)

  const provider = getTranslationProvider()

  useEffect(() => subscribeOcrProgress(setProgress), [])

  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    },
    [],
  )

  const setPreviewSafe = useCallback((url: string | undefined, isImage: boolean) => {
    if (previewUrlRef.current && previewUrlRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrlRef.current)
    }
    previewUrlRef.current = url && url.startsWith('blob:') ? url : null
    setPreview(url ? { url, isImage } : null)
  }, [])

  const swapLangs = () => {
    setSourceLang(targetLang)
    setTargetLang(sourceLang)
    if (resultText) {
      setSourceText(getTranslationText(resultText))
      setResultText('')
    }
  }

  const handleFile = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      e.target.value = ''
      setScanning(true)
      setProgress(0)
      setError('')
      setResultText('')
      setScanMethod(null)
      try {
        const out = await recognizeDocument(file)
        const isImage = file.type.startsWith('image/')
        setPreviewSafe(out.previewUrl, isImage || out.method !== 'pdf-native' ? true : false)
        if (out.error) {
          setError(out.error)
          useToastStore.getState().show('Extraction échouée', 4000)
        } else if (out.text.trim()) {
          setSourceText(out.text.trim())
          setScanMethod(out.method)
          const pages = out.pageCount && out.pageCount > 1 ? ` · ${out.pagesProcessed}/${out.pageCount} p.` : ''
          useToastStore.getState().show(`${SCAN_METHOD_LABELS[out.method]}${pages}`)
        } else {
          setError('Aucun texte détecté — saisissez le texte manuellement.')
        }
      } finally {
        setScanning(false)
      }
    },
    [setPreviewSafe],
  )

  const handleTranslate = useCallback(async () => {
    if (!sourceText.trim()) return
    setTranslating(true)
    setError('')
    setWarning('')
    setResultText('')
    try {
      const result = await translateText(sourceText, { from: sourceLang, to: targetLang })
      if (result.error) {
        setError(result.error)
        return
      }
      setResultText(result.text || '')
      if (result.warning) setWarning(result.warning)
      if (!result.text?.trim()) setError('Aucune traduction retournée')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Traduction impossible')
    } finally {
      setTranslating(false)
    }
  }, [sourceText, sourceLang, targetLang])

  const handleCopy = useCallback(async () => {
    const clean = getTranslationText(resultText)
    if (!clean) return
    try {
      await navigator.clipboard.writeText(clean)
      useToastStore.getState().show('Traduction copiée')
    } catch {
      useToastStore.getState().show('Copie impossible', 4000)
    }
  }, [resultText])

  const handleDownload = useCallback(() => {
    const clean = getTranslationText(resultText)
    if (!clean) return
    const blob = new Blob([clean], { type: 'text/plain;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `traduction-${targetLang}.txt`
    a.click()
    URL.revokeObjectURL(a.href)
  }, [resultText, targetLang])

  return (
    <div className="min-h-full flex flex-col max-w-5xl mx-auto w-full p-4">
      <header className="forma-glass-header rounded-xl px-4 py-3 mb-4 flex flex-wrap items-center gap-3 border border-forma-border/50">
        <BrandLogo size="sm" subtitle="Traduction" />
        <div className="flex-1" />
        <Link to="/" className="text-sm text-forma-accent hover:underline">
          ← Bibliothèque
        </Link>
      </header>

      <div className="rounded-xl p-3 mb-4 text-xs leading-relaxed border bg-forma-accent/10 border-forma-accent/30">
        Importez une image ou un PDF scanné — le texte est extrait localement (Tesseract / PDF.js),
        puis traduit. Fournisseur : <strong>{TRANSLATION_PROVIDERS[provider]}</strong>.
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.pdf,application/pdf"
          className="hidden"
          onChange={(e) => void handleFile(e)}
        />
        <GlassButton accent disabled={scanning} onClick={() => fileRef.current?.click()}>
          {scanning ? `OCR ${progress}%…` : '📷 Importer image / PDF'}
        </GlassButton>
        <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)} className="border rounded-lg px-2 py-2 text-sm">
          {TRANSLATION_LANGUAGES.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
        <button type="button" onClick={swapLangs} title="Inverser les langues" className="text-forma-muted hover:text-forma-text text-lg px-1">
          ⇄
        </button>
        <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} className="border rounded-lg px-2 py-2 text-sm">
          {TRANSLATION_LANGUAGES.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
        {scanMethod && <span className="text-xs text-forma-muted">{SCAN_METHOD_LABELS[scanMethod]}</span>}
      </div>

      {warning && (
        <div className="text-xs text-forma-accent mb-3 px-3 py-2 rounded-lg bg-forma-accent/10 border border-forma-accent/30">
          {warning}
        </div>
      )}
      {error && (
        <div className="text-xs text-red-600 dark:text-red-400 mb-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30">
          {error}
        </div>
      )}

      {preview?.isImage && (
        <div className="mb-4 rounded-xl overflow-hidden border border-forma-border/50 max-h-60 flex justify-center bg-forma-bg">
          <img src={preview.url} alt="" className="max-h-60 object-contain" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="forma-glass-panel rounded-xl border border-forma-border/40 p-3">
          <div className="text-[10px] font-bold text-forma-muted tracking-wide mb-2">TEXTE SOURCE</div>
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Texte OCR, PDF ou saisie manuelle…"
            rows={10}
            className="w-full bg-transparent text-sm resize-y min-h-[12rem] outline-none"
          />
        </div>
        <div className="forma-glass-panel rounded-xl border border-forma-border/40 p-3">
          <div className="text-[10px] font-bold text-forma-muted tracking-wide mb-2">
            TRADUCTION ({sourceLang} → {targetLang})
          </div>
          <textarea
            value={resultText}
            readOnly
            placeholder="Traduire pour afficher ici…"
            rows={10}
            className={`w-full bg-transparent text-sm resize-y min-h-[12rem] outline-none ${
              resultText ? '' : 'opacity-60'
            }`}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <GlassButton accent disabled={translating || !sourceText.trim()} onClick={() => void handleTranslate()}>
          {translating ? 'Traduction…' : 'Traduire le document'}
        </GlassButton>
        <GlassButton disabled={!getTranslationText(resultText)} onClick={() => void handleCopy()}>
          Copier
        </GlassButton>
        <GlassButton disabled={!getTranslationText(resultText)} onClick={handleDownload}>
          Télécharger .txt
        </GlassButton>
      </div>

      <p className="text-[11px] text-forma-muted mt-4">
        L'OCR fonctionne hors-ligne. La traduction « en ligne » utilise des services gratuits
        (MyMemory, LibreTranslate) uniquement quand vous cliquez sur « Traduire » ; le mode démo
        reste 100 % local.
      </p>
    </div>
  )
}
