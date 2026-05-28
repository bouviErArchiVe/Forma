import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAppStore from '@/stores/useAppStore'
import { translateText, TRANSLATION_LANGUAGES, TRANSLATION_PROVIDERS, getTranslationProvider, getTranslationText } from '@/lib/translation'
import GlassButton from '@/components/ui/GlassButton'
import ModalOverlay from '@/components/ui/ModalOverlay'
import GlassPanel from '@/components/ui/GlassPanel'
import { glassStyle, rgbaFromHex } from '@/theme/glass'
import { TOKENS } from '@/theme/tokens'

function TranslationBody({
  T,
  sourceText,
  setSourceText,
  resultText,
  setResultText,
  sourceLang,
  setSourceLang,
  targetLang,
  setTargetLang,
  mode,
  setMode,
  loading,
  error,
  warning,
  providerLabel,
  onTranslate,
  onCopy,
  onSend,
  onOpenScan,
  onOpenDico,
  fieldStyle,
  compact,
}) {
  const swapLangs = () => {
    setSourceLang(targetLang)
    setTargetLang(sourceLang)
    if (resultText) {
      setSourceText(resultText.replace(/\n\n—[\s\S]*$/, '').trim())
      setResultText('')
    }
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: compact ? 10 : 14, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 9, color: T.muted, lineHeight: 1.35, padding: '6px 8px', borderRadius: 8, background: `${T.accent}10`, border: `1px solid ${T.border}` }}>
        {providerLabel}
      </div>

      {warning && (
        <div style={{ fontSize: 10, color: T.accent, padding: '8px 10px', borderRadius: 8, background: `${T.accent}12`, border: `1px solid ${T.accent}44` }}>
          {warning}
        </div>
      )}

      {error && (
        <div style={{ fontSize: 10, color: '#e94560', padding: '8px 10px', borderRadius: 8, background: '#e9456012', border: '1px solid #e9456044' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)} style={{ ...fieldStyle, flex: 1, minWidth: 90 }}>
          {TRANSLATION_LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
        </select>
        <button type="button" onClick={swapLangs} title="Inverser" className="forma-btn-glass" style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16, padding: '4px 6px', color: T.muted }}>⇄</button>
        <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} style={{ ...fieldStyle, flex: 1, minWidth: 90 }}>
          {TRANSLATION_LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[['standard', 'Base'], ['advanced', 'Avancé']].map(([id, label]) => (
          <GlassButton
            key={id}
            T={T}
            active={mode === id}
            onClick={() => setMode(id)}
            style={{ padding: '5px 10px', fontSize: 9, fontWeight: mode === id ? 800 : 600 }}
          >
            {label}
          </GlassButton>
        ))}
      </div>

      <div>
        <div style={{ fontSize: 9, fontWeight: 800, color: T.muted, letterSpacing: 0.8, marginBottom: 5 }}>TEXTE SOURCE</div>
        <textarea
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          placeholder="Collez vos consignes, fiches techniques…"
          rows={5}
          style={{ ...fieldStyle, minHeight: 88, resize: 'vertical', cursor: 'text', lineHeight: 1.4 }}
        />
      </div>

      <GlassButton T={T} accent onClick={onTranslate} disabled={loading || !sourceText.trim()} style={{ width: '100%', padding: '10px 0', fontSize: 11, fontWeight: 800 }}>
        {loading ? 'Traduction…' : 'Traduire'}
      </GlassButton>

      <div>
        <div style={{ fontSize: 9, fontWeight: 800, color: T.muted, letterSpacing: 0.8, marginBottom: 5 }}>RÉSULTAT</div>
        <textarea
          value={resultText}
          readOnly
          placeholder="La traduction apparaîtra ici…"
          rows={5}
          style={{ ...fieldStyle, minHeight: 88, resize: 'vertical', cursor: 'default', lineHeight: 1.4, opacity: resultText ? 1 : 0.65 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <GlassButton T={T} onClick={onCopy} disabled={!resultText} style={{ flex: 1, padding: '8px 6px', fontSize: 10 }}>Copier</GlassButton>
        <GlassButton T={T} onClick={onSend} disabled={!resultText} style={{ flex: 1, padding: '8px 6px', fontSize: 10 }}>Carnet</GlassButton>
        {onOpenScan && (
          <GlassButton T={T} onClick={onOpenScan} style={{ flex: '1 1 100%', padding: '8px 6px', fontSize: 10 }}>📷 Scan OCR</GlassButton>
        )}
        {onOpenDico && (
          <GlassButton T={T} onClick={onOpenDico} style={{ flex: '1 1 100%', padding: '8px 6px', fontSize: 10 }}>📖 FormaDico</GlassButton>
        )}
      </div>
    </div>
  )
}

export default function TranslationWidget({
  T,
  variant = 'drawer',
  open = true,
  onClose,
  stackOffset = 0,
  notebooks = [],
  onOpenScan,
}) {
  const navigate = useNavigate()
  const {
    addNotification,
    setPendingFormulaNote,
    setActiveNotebook,
    translationSourceLang,
    translationTargetLang,
    translationMode,
    setTranslationSourceLang,
    setTranslationTargetLang,
    setTranslationMode,
    setPendingTranslationSourceText,
    setPendingDicoWord,
  } = useAppStore()

  const [sourceText, setSourceText] = useState('')
  const [resultText, setResultText] = useState('')
  const [loading, setLoading] = useState(false)
  const [sendOpen, setSendOpen] = useState(false)
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')

  const provider = getTranslationProvider()
  const providerLabel = TRANSLATION_PROVIDERS[provider] || provider

  const fieldStyle = {
    width: '100%',
    padding: '8px 9px',
    borderRadius: TOKENS.radius.sm,
    border: `1px solid ${rgbaFromHex(T.border, 0.45)}`,
    background: rgbaFromHex(T.bg, 0.4),
    color: T.ink,
    fontSize: 12,
    outline: 'none',
    boxSizing: 'border-box',
  }

  const handleTranslate = useCallback(async () => {
    if (!sourceText.trim()) return
    setLoading(true)
    setError('')
    setWarning('')
    setResultText('')
    try {
      const result = await translateText(sourceText, {
        from: translationSourceLang,
        to: translationTargetLang,
        mode: translationMode,
      })
      if (result.error) {
        setError(result.error)
        addNotification(result.error, 'error')
        return
      }
      setResultText(result.text || '')
      if (result.warning) setWarning(result.warning)
      if (!result.text?.trim()) {
        const msg = 'Aucune traduction retournée'
        setError(msg)
        addNotification(msg, 'error')
      }
    } catch (err) {
      const msg = err?.message || 'Traduction impossible'
      setError(msg)
      addNotification(msg, 'error')
    } finally {
      setLoading(false)
    }
  }, [sourceText, translationSourceLang, translationTargetLang, translationMode, addNotification])

  const handleCopy = useCallback(async () => {
    const clean = getTranslationText(resultText)
    if (!clean) return
    try {
      await navigator.clipboard.writeText(clean)
      addNotification('Traduction copiée', 'success')
    } catch {
      addNotification('Copie impossible', 'error')
    }
  }, [resultText, addNotification])

  const handleSendPick = useCallback((nb) => {
    const clean = getTranslationText(resultText)
    if (!clean) return
    setPendingFormulaNote({ notebookId: nb.id, text: clean })
    setActiveNotebook(nb)
    setSendOpen(false)
    addNotification(`Traduction envoyée vers « ${nb.title} »`, 'success')
    navigate(`/editor/${nb.id}`)
  }, [resultText, setPendingFormulaNote, setActiveNotebook, addNotification, navigate])

  const handleOpenScan = useCallback(() => {
    if (sourceText.trim()) setPendingTranslationSourceText(sourceText.trim())
    onOpenScan?.()
  }, [sourceText, setPendingTranslationSourceText, onOpenScan])

  const bodyProps = {
    T,
    sourceText,
    setSourceText,
    resultText,
    setResultText,
    sourceLang: translationSourceLang,
    setSourceLang: setTranslationSourceLang,
    targetLang: translationTargetLang,
    setTargetLang: setTranslationTargetLang,
    mode: translationMode,
    setMode: setTranslationMode,
    loading,
    error,
    warning,
    providerLabel,
    onTranslate: handleTranslate,
    onCopy: handleCopy,
    onSend: () => setSendOpen(true),
    onOpenScan: handleOpenScan,
    onOpenDico: () => {
      const w = sourceText.trim().split(/\s+/)[0]?.replace(/[^\p{L}'-]/gu, '')
      if (w) setPendingDicoWord(w)
      navigate('/formadico')
    },
    fieldStyle,
    compact: variant === 'embedded',
  }

  if (variant === 'embedded') {
    return (
      <>
        <TranslationBody {...bodyProps} />
        {sendOpen && (
          <NotebookPickerModal T={T} notebooks={notebooks} onPick={handleSendPick} onClose={() => setSendOpen(false)} />
        )}
      </>
    )
  }

  const header = (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 14px 10px',
      borderBottom: `1px solid ${rgbaFromHex(T.border, 0.35)}`,
      flexShrink: 0,
    }}>
      <div style={{ fontWeight: 900, fontSize: 12, color: T.ink }}>🌐 Traduction</div>
      <button
        type="button"
        onClick={onClose}
        className="forma-btn-glass"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 20, lineHeight: 1, padding: '2px 6px' }}
      >
        ×
      </button>
    </div>
  )

  return (
    <>
      <div
        className={open ? 'forma-animate-in' : ''}
        style={{
          position: 'fixed',
          top: 0,
          right: stackOffset,
          bottom: 0,
          width: 320,
          transform: open ? 'translateX(0)' : 'translateX(110%)',
          transition: `transform ${TOKENS.transition.slow}, right ${TOKENS.transition.slow}`,
          zIndex: TOKENS.zIndex.modal - 1,
          pointerEvents: open ? 'auto' : 'none',
          display: 'flex',
          flexDirection: 'column',
          borderLeft: `1px solid ${rgbaFromHex(T.border, 0.45)}`,
          ...glassStyle(T, { variant: 'panel', blur: TOKENS.blur.lg, opacity: 0.88 }),
        }}
      >
        {header}
        <TranslationBody {...bodyProps} />
      </div>
      {sendOpen && (
        <NotebookPickerModal T={T} notebooks={notebooks} onPick={handleSendPick} onClose={() => setSendOpen(false)} />
      )}
    </>
  )
}

function NotebookPickerModal({ T, notebooks, onPick, onClose }) {
  return (
    <ModalOverlay onClose={onClose}>
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
                onClick={() => onPick(nb)}
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
        <button type="button" onClick={onClose} style={{ marginTop: 14, width: '100%', padding: '9px 0', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.muted, cursor: 'pointer', fontSize: 12 }}>
          Annuler
        </button>
      </GlassPanel>
    </ModalOverlay>
  )
}
