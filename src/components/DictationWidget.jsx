import useAppStore from '@/stores/useAppStore'
import { DICTATION_LANGUAGES } from '@/lib/speechRecognition'
import { useDictation } from '@/hooks/useDictation'
import GlassButton from '@/components/ui/GlassButton'
import { rgbaFromHex } from '@/theme/glass'
import { TOKENS } from '@/theme/tokens'

function SoundBars({ active, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 22 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={active ? 'forma-dictation-bar' : ''}
          style={{
            width: 4,
            borderRadius: 2,
            background: active ? color : `${color}44`,
            height: active ? undefined : 6,
            animationDelay: `${i * 0.12}s`,
          }}
        />
      ))}
    </div>
  )
}

function DictationBody({ T, lang, setLang, onInsert, compact }) {
  const {
    supported,
    listening,
    transcript,
    interim,
    error,
    setTranscript,
    clear,
    toggle,
    stop,
  } = useDictation({ lang })

  const displayText = `${transcript}${interim ? (transcript ? ' ' : '') + interim : ''}`.trim()

  const fieldStyle = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: TOKENS.radius.sm,
    border: `1px solid ${rgbaFromHex(T.border, 0.45)}`,
    background: rgbaFromHex(T.bg, 0.55),
    color: T.ink,
    fontSize: 13,
    lineHeight: 1.45,
    outline: 'none',
    resize: 'vertical',
    minHeight: compact ? 88 : 110,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: compact ? 10 : 14 }}>
      {!supported && (
        <div style={{ fontSize: 10, color: '#e94560', padding: '8px 10px', borderRadius: 8, background: '#e9456012', border: '1px solid #e9456044' }}>
          Dictée vocale indisponible sur ce navigateur. Essayez Safari sur iPad ou Chrome.
        </div>
      )}

      {error && (
        <div style={{ fontSize: 10, color: '#e94560', padding: '8px 10px', borderRadius: 8, background: '#e9456012', border: '1px solid #e9456044' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          disabled={listening}
          style={{
            flex: 1,
            minWidth: 120,
            padding: '6px 8px',
            borderRadius: TOKENS.radius.sm,
            border: `1px solid ${T.border}`,
            background: T.surface,
            color: T.ink,
            fontSize: 11,
            outline: 'none',
          }}
        >
          {DICTATION_LANGUAGES.map((l) => (
            <option key={l.id} value={l.id}>{l.label}</option>
          ))}
        </select>
        <SoundBars active={listening} color={listening ? '#e94560' : T.muted} />
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          type="button"
          onClick={toggle}
          disabled={!supported}
          className="forma-btn-glass forma-tap-target"
          title={listening ? 'Arrêter la dictée' : 'Démarrer la dictée'}
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            border: `2px solid ${listening ? '#e94560' : T.accent}`,
            background: listening ? '#e9456022' : `${T.accent}18`,
            color: listening ? '#e94560' : T.accent,
            cursor: supported ? 'pointer' : 'not-allowed',
            fontSize: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: listening ? '0 0 0 6px rgba(233,69,96,.15)' : 'none',
            transition: 'box-shadow .25s, transform .15s',
          }}
        >
          {listening ? '⏹' : '🎙'}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: listening ? '#e94560' : T.ink }}>
            {listening ? 'Écoute en cours…' : 'Appuyez pour dicter'}
          </div>
          <div style={{ fontSize: 9, color: T.muted, marginTop: 3, lineHeight: 1.35 }}>
            Parlez clairement. Le texte s&apos;ajoute au fur et à mesure. Insérez-le sur la page comme objet texte éditable.
          </div>
        </div>
      </div>

      <textarea
        value={displayText}
        onChange={(e) => {
          if (listening) stop()
          setTranscript(e.target.value)
        }}
        placeholder="La transcription apparaît ici…"
        rows={compact ? 4 : 5}
        style={fieldStyle}
      />

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <GlassButton
          T={T}
          accent
          disabled={!displayText}
          onClick={() => onInsert?.(displayText)}
          style={{ flex: 1, minWidth: 120, justifyContent: 'center' }}
        >
          Insérer sur la page
        </GlassButton>
        <GlassButton T={T} onClick={clear} style={{ padding: '7px 12px' }}>
          Effacer
        </GlassButton>
      </div>
    </div>
  )
}

/** Widget dictée vocale — panneau embarqué dans l'éditeur */
export default function DictationWidget({ T, variant = 'embedded', onInsert, onClose }) {
  const { dictationLang, setDictationLang } = useAppStore()
  const compact = variant === 'embedded'

  if (variant === 'modal') {
    return (
      <div style={{ width: 360, maxWidth: '94vw' }}>
        <DictationBody T={T} lang={dictationLang} setLang={setDictationLang} onInsert={onInsert} compact={compact} />
        {onClose && (
          <div style={{ padding: '0 14px 14px' }}>
            <GlassButton T={T} onClick={onClose} style={{ width: '100%' }}>Fermer</GlassButton>
          </div>
        )}
      </div>
    )
  }

  return (
    <DictationBody T={T} lang={dictationLang} setLang={setDictationLang} onInsert={onInsert} compact={compact} />
  )
}
