import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import useAppStore from '@/stores/useAppStore'
import { useOCR } from '@/hooks/useOCR'
import { translateText, getTranslationText, TRANSLATION_PROVIDERS, getTranslationProvider } from '@/lib/translation'
import GlassButton from '@/components/ui/GlassButton'
import ModalOverlay from '@/components/ui/ModalOverlay'
import GlassPanel from '@/components/ui/GlassPanel'
import { rgbaFromHex } from '@/theme/glass'
import { TOKENS } from '@/theme/tokens'
import { ELEVATION, TYPE } from '@/lib/design'

const METHOD_LABELS = {
  'pdf-native': 'Texte PDF natif',
  'pdf-ocr': 'OCR sur PDF',
  'image-ocr': 'OCR image',
}

export default function DocumentScanTranslator({ T, notebooks = [], embedded = false }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fileRef = useRef(null)
  const previewUrlRef = useRef(null)
  const { recognize, isProcessing, progress, lastMethod } = useOCR()
  const {
    addNotification,
    setPendingFormulaNote,
    setActiveNotebook,
    translationSourceLang,
    translationTargetLang,
    translationMode,
    consumePendingTranslationSourceText,
  } = useAppStore()

  const [preview, setPreview] = useState(null)
  const [ocrText, setOcrText] = useState('')
  const [manualText, setManualText] = useState('')
  const [translated, setTranslated] = useState('')
  const [translating, setTranslating] = useState(false)
  const [sendOpen, setSendOpen] = useState(false)
  const [ocrError, setOcrError] = useState(null)
  const [ocrMethod, setOcrMethod] = useState(null)
  const [translateError, setTranslateError] = useState('')
  const [translateWarning, setTranslateWarning] = useState('')

  const sourceText = ocrText || manualText

  useEffect(() => {
    const fromStore = consumePendingTranslationSourceText?.() || ''
    const fromQuery = searchParams.get('text') || ''
    const initial = fromStore || fromQuery
    if (initial.trim()) {
      setManualText(initial.trim())
      addNotification('Texte repris depuis le widget traduction', 'info')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
  }, [])

  const fieldStyle = {
    width: '100%',
    padding: '10px 11px',
    borderRadius: TOKENS.radius.sm,
    border: `1px solid ${rgbaFromHex(T.border, 0.45)}`,
    background: rgbaFromHex(T.bg, 0.4),
    color: T.ink,
    fontSize: 12,
    outline: 'none',
    boxSizing: 'border-box',
    lineHeight: 1.45,
  }

  const setPreviewSafe = useCallback((next) => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
    if (next?.url?.startsWith('blob:')) previewUrlRef.current = next.url
    setPreview(next)
  }, [])

  const handleFile = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setOcrError(null)
    setOcrText('')
    setTranslated('')
    setManualText('')
    setOcrMethod(null)

    const url = file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    setPreviewSafe({ url, name: file.name, type: file.type, isPdf: file.type === 'application/pdf' || /\.pdf$/i.test(file.name) })

    const out = await recognize(file, translationSourceLang)
    const text = typeof out === 'string' ? out : out?.text
    const method = typeof out === 'object' ? out?.method : lastMethod

    if (out?.previewUrl) {
      setPreviewSafe({
        url: out.previewUrl,
        name: file.name,
        type: 'image/png',
        isPdf: true,
        rasterized: true,
        pageCount: out.pageCount,
        pagesProcessed: out.pagesProcessed,
      })
    }

    if (text?.trim()) {
      setOcrText(text.trim())
      setOcrMethod(method || lastMethod)
      const label = METHOD_LABELS[method] || 'Texte extrait'
      const pagesHint = out?.pageCount > 1 && out?.pagesProcessed
        ? ` · ${out.pagesProcessed}/${out.pageCount} p.`
        : ''
      addNotification(`${label}${pagesHint}`, 'success')
    } else {
      const msg = out?.error || 'OCR sans résultat — saisissez le texte manuellement ci-dessous.'
      setOcrError(msg)
      addNotification('OCR échoué — saisie manuelle', 'error')
    }
    e.target.value = ''
  }, [recognize, translationSourceLang, addNotification, setPreviewSafe, lastMethod])

  const handleTranslate = useCallback(async () => {
    if (!sourceText.trim()) return
    setTranslating(true)
    setTranslateError('')
    setTranslateWarning('')
    setTranslated('')
    try {
      const result = await translateText(sourceText, {
        from: translationSourceLang,
        to: translationTargetLang,
        mode: translationMode,
      })
      if (result.error) {
        setTranslateError(result.error)
        addNotification(result.error, 'error')
        return
      }
      setTranslated(result.text || '')
      if (result.warning) setTranslateWarning(result.warning)
      if (!result.text?.trim()) {
        const msg = 'Aucune traduction retournée'
        setTranslateError(msg)
        addNotification(msg, 'error')
      }
    } catch (err) {
      const msg = err?.message || 'Traduction impossible'
      setTranslateError(msg)
      addNotification(msg, 'error')
    } finally {
      setTranslating(false)
    }
  }, [sourceText, translationSourceLang, translationTargetLang, translationMode, addNotification])

  const cleanTranslation = getTranslationText(translated)

  const handleCopy = useCallback(async () => {
    if (!cleanTranslation) return
    try {
      await navigator.clipboard.writeText(cleanTranslation)
      addNotification('Traduction copiée', 'success')
    } catch {
      addNotification('Copie impossible', 'error')
    }
  }, [cleanTranslation, addNotification])

  const handleSendPick = useCallback((nb) => {
    if (!cleanTranslation) return
    setPendingFormulaNote({ notebookId: nb.id, text: cleanTranslation })
    setActiveNotebook(nb)
    setSendOpen(false)
    addNotification(`Traduction envoyée vers « ${nb.title} »`, 'success')
    navigate(`/editor/${nb.id}`)
  }, [cleanTranslation, setPendingFormulaNote, setActiveNotebook, addNotification, navigate])

  const wrapStyle = embedded
    ? { display: 'flex', flexDirection: 'column', gap: 16 }
    : { maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16, padding: embedded ? 0 : '0 4px' }

  const cardStyle = {
    borderRadius: TOKENS.radius.lg,
    border: `1px solid ${rgbaFromHex(T.border, 0.35)}`,
    background: T.surface,
    boxShadow: ELEVATION.card,
    overflow: 'hidden',
  }

  return (
    <div style={wrapStyle}>
      <div style={{ ...cardStyle, padding: '14px 16px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input ref={fileRef} type="file" accept="image/*,.pdf,application/pdf" style={{ display: 'none' }} onChange={handleFile} />
        <GlassButton T={T} accent onClick={() => fileRef.current?.click()} disabled={isProcessing}>
          {isProcessing ? `OCR ${progress}%…` : '📷 Importer image / PDF'}
        </GlassButton>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ ...TYPE.caption, color: T.muted }}>Tesseract + PDF.js chargés à la demande</div>
          <div style={{ ...TYPE.micro, color: T.muted, marginTop: 2 }}>
            {TRANSLATION_PROVIDERS[getTranslationProvider()] || 'Traduction'}
            {ocrMethod && ` · ${METHOD_LABELS[ocrMethod] || ocrMethod}`}
            {preview?.pageCount > 1 && preview?.pagesProcessed && ` · ${preview.pagesProcessed}/${preview.pageCount} pages`}
          </div>
        </div>
      </div>

      {translateWarning && (
        <div style={{ fontSize: 11, color: T.accent, padding: '8px 10px', borderRadius: 8, background: `${T.accent}12`, border: `1px solid ${T.accent}44` }}>
          {translateWarning}
        </div>
      )}

      {translateError && (
        <div style={{ fontSize: 11, color: '#e94560', padding: '8px 10px', borderRadius: 8, background: '#e9456012', border: '1px solid #e9456044' }}>
          {translateError}
        </div>
      )}

      {preview && (
        <div style={{ ...cardStyle, maxHeight: 240 }}>
          {preview.url && (preview.type?.startsWith('image/') || preview.rasterized) ? (
            <img src={preview.url} alt="" style={{ width: '100%', maxHeight: 240, objectFit: 'contain', display: 'block', background: rgbaFromHex(T.bg, 0.5) }} />
          ) : (
            <div style={{ padding: 24, textAlign: 'center', color: T.muted, ...TYPE.body }}>
              📄 {preview.name}
              {preview.isPdf && !preview.rasterized && ' — extraction texte ou OCR en cours…'}
            </div>
          )}
        </div>
      )}

      {ocrError && (
        <div style={{ padding: '10px 12px', borderRadius: 10, background: `${T.accent}12`, border: `1px solid ${T.accent}44`, fontSize: 12, color: T.ink }}>
          {ocrError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        <div style={{ ...cardStyle, padding: 14 }}>
          <div style={{ ...TYPE.micro, color: T.muted, marginBottom: 8 }}>TEXTE EXTRAIT / SAISIE</div>
          <textarea
            value={ocrText || manualText}
            onChange={(e) => {
              setManualText(e.target.value)
              if (ocrText) setOcrText('')
            }}
            placeholder="Texte OCR, PDF ou saisie manuelle…"
            rows={10}
            style={{ ...fieldStyle, minHeight: 200, resize: 'vertical', cursor: 'text', border: 'none', background: 'transparent', padding: 0 }}
          />
        </div>
        <div style={{ ...cardStyle, padding: 14 }}>
          <div style={{ ...TYPE.micro, color: T.muted, marginBottom: 8 }}>
            TRADUCTION ({translationSourceLang} → {translationTargetLang})
          </div>
          <textarea
            value={translated}
            readOnly
            placeholder="Traduire pour afficher ici…"
            rows={10}
            style={{ ...fieldStyle, minHeight: 200, resize: 'vertical', cursor: 'default', opacity: translated ? 1 : 0.65, border: 'none', background: 'transparent', padding: 0 }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <GlassButton T={T} accent onClick={handleTranslate} disabled={translating || !sourceText.trim()} style={{ padding: '10px 18px', fontSize: 11, fontWeight: 800 }}>
          {translating ? 'Traduction…' : 'Traduire le document'}
        </GlassButton>
        <GlassButton T={T} onClick={handleCopy} disabled={!cleanTranslation} style={{ padding: '10px 14px', fontSize: 11 }}>Copier</GlassButton>
        <GlassButton T={T} onClick={() => setSendOpen(true)} disabled={!cleanTranslation} style={{ padding: '10px 14px', fontSize: 11 }}>Ajouter au carnet</GlassButton>
      </div>

      {sendOpen && (
        <ModalOverlay onClose={() => setSendOpen(false)}>
          <GlassPanel T={T} variant="modal" style={{ padding: 22, width: 400, maxWidth: '94vw', maxHeight: '70vh', overflowY: 'auto' }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16, marginBottom: 12 }}>Envoyer vers un carnet</div>
            {notebooks.length === 0 ? (
              <div style={{ fontSize: 13, color: T.muted, textAlign: 'center', padding: '20px 0' }}>Aucun carnet disponible</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {notebooks.map((nb) => (
                  <button
                    key={nb.id}
                    type="button"
                    onClick={() => handleSendPick(nb)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: `1px solid ${T.border}`,
                      background: T.bg,
                      color: T.ink,
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {nb.title}
                  </button>
                ))}
              </div>
            )}
            <button type="button" onClick={() => setSendOpen(false)} style={{ marginTop: 14, width: '100%', padding: '9px 0', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.muted, cursor: 'pointer', fontSize: 12 }}>
              Annuler
            </button>
          </GlassPanel>
        </ModalOverlay>
      )}
    </div>
  )
}
