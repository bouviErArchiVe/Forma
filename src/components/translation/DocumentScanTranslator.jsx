import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAppStore from '@/stores/useAppStore'
import { useOCR } from '@/hooks/useOCR'
import { translateText } from '@/lib/translation'
import GlassButton from '@/components/ui/GlassButton'
import ModalOverlay from '@/components/ui/ModalOverlay'
import GlassPanel from '@/components/ui/GlassPanel'
import { rgbaFromHex } from '@/theme/glass'
import { TOKENS } from '@/theme/tokens'

export default function DocumentScanTranslator({ T, notebooks = [], embedded = false }) {
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const { recognize, isProcessing, progress } = useOCR()
  const {
    addNotification,
    setPendingFormulaNote,
    setActiveNotebook,
    translationSourceLang,
    translationTargetLang,
    translationMode,
  } = useAppStore()

  const [preview, setPreview] = useState(null)
  const [ocrText, setOcrText] = useState('')
  const [manualText, setManualText] = useState('')
  const [translated, setTranslated] = useState('')
  const [translating, setTranslating] = useState(false)
  const [sendOpen, setSendOpen] = useState(false)
  const [ocrError, setOcrError] = useState(null)

  const sourceText = ocrText || manualText

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

  const handleFile = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setOcrError(null)
    setOcrText('')
    setTranslated('')
    setManualText('')

    const url = URL.createObjectURL(file)
    setPreview({ url, name: file.name, type: file.type })

    const text = await recognize(file, translationSourceLang === 'fr' ? 'fra' : 'eng')
    if (text?.trim()) {
      setOcrText(text.trim())
      addNotification('Texte extrait par OCR', 'success')
    } else {
      setOcrError('OCR sans résultat — saisissez le texte manuellement ci-dessous.')
      addNotification('OCR échoué — saisie manuelle', 'error')
    }
    e.target.value = ''
  }, [recognize, translationSourceLang, addNotification])

  const handleTranslate = useCallback(async () => {
    if (!sourceText.trim()) return
    setTranslating(true)
    try {
      const out = await translateText(sourceText, {
        from: translationSourceLang,
        to: translationTargetLang,
        mode: translationMode,
      })
      setTranslated(out)
    } catch {
      addNotification('Traduction impossible', 'error')
    } finally {
      setTranslating(false)
    }
  }, [sourceText, translationSourceLang, translationTargetLang, translationMode, addNotification])

  const cleanTranslation = translated.replace(/\n\n—[\s\S]*$/, '').trim()

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

  return (
    <div style={wrapStyle}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleFile} />
        <GlassButton T={T} accent onClick={() => fileRef.current?.click()} disabled={isProcessing}>
          {isProcessing ? `OCR ${progress}%…` : '📷 Importer image / PDF'}
        </GlassButton>
        <span style={{ fontSize: 11, color: T.muted }}>Tesseract chargé à la demande · pas au démarrage</span>
      </div>

      {preview && (
        <div style={{ borderRadius: 12, border: `1px solid ${T.border}`, overflow: 'hidden', background: T.surface, maxHeight: 220 }}>
          {preview.type.startsWith('image/') ? (
            <img src={preview.url} alt="" style={{ width: '100%', maxHeight: 220, objectFit: 'contain', display: 'block' }} />
          ) : (
            <div style={{ padding: 20, textAlign: 'center', color: T.muted, fontSize: 12 }}>
              📄 {preview.name} — OCR appliqué si possible
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
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: T.muted, letterSpacing: 0.8, marginBottom: 6 }}>TEXTE EXTRAIT / SAISIE</div>
          <textarea
            value={ocrText || manualText}
            onChange={(e) => {
              setManualText(e.target.value)
              if (ocrText) setOcrText('')
            }}
            placeholder="Texte OCR ou saisie manuelle…"
            rows={10}
            style={{ ...fieldStyle, minHeight: 200, resize: 'vertical', cursor: 'text' }}
          />
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: T.muted, letterSpacing: 0.8, marginBottom: 6 }}>TRADUCTION ({translationSourceLang} → {translationTargetLang})</div>
          <textarea
            value={translated}
            readOnly
            placeholder="Traduire pour afficher ici…"
            rows={10}
            style={{ ...fieldStyle, minHeight: 200, resize: 'vertical', cursor: 'default', opacity: translated ? 1 : 0.65 }}
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
