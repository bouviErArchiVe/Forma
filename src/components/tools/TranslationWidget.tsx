import { useState } from 'react'
import { GlassButton } from '../ui/GlassButton'
import {
  getTranslationProvider,
  getTranslationText,
  TRANSLATION_LANGUAGES,
  TRANSLATION_PROVIDERS,
  translateText,
} from '../../lib/translation'
import { useToastStore } from '../../stores/toastStore'

interface TranslationWidgetProps {
  compact?: boolean
  initialText?: string
  onOpenDico?: (word: string) => void
}

export function TranslationWidget({ compact, initialText = '', onOpenDico }: TranslationWidgetProps) {
  const [sourceText, setSourceText] = useState(initialText)
  const [resultText, setResultText] = useState('')
  const [sourceLang, setSourceLang] = useState('en')
  const [targetLang, setTargetLang] = useState('fr')
  const [mode, setMode] = useState<'standard' | 'advanced'>('standard')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)

  const provider = getTranslationProvider()
  const providerLabel = TRANSLATION_PROVIDERS[provider as keyof typeof TRANSLATION_PROVIDERS] || provider

  const swapLangs = () => {
    setSourceLang(targetLang)
    setTargetLang(sourceLang)
    if (resultText) {
      setSourceText(getTranslationText(resultText))
      setResultText('')
    }
  }

  const runTranslate = async () => {
    setLoading(true)
    setError(null)
    setWarning(null)
    const res = await translateText(sourceText, { from: sourceLang, to: targetLang, mode })
    setLoading(false)
    if (res.error) setError(res.error)
    if (res.warning) setWarning(res.warning)
    setResultText(res.text)
  }

  return (
    <div className={`flex flex-col gap-3 ${compact ? 'h-full min-h-0' : ''}`}>
      <p className="text-[11px] text-forma-muted px-2 py-1 rounded-lg bg-forma-accent/10 border border-forma-border/60">
        {providerLabel}
      </p>
      {warning && <p className="text-xs text-amber-700 dark:text-amber-400">{warning}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2 items-center flex-wrap">
        <select
          value={sourceLang}
          onChange={(e) => setSourceLang(e.target.value)}
          className="flex-1 min-w-[90px] border border-forma-border rounded-lg px-2 py-1.5 text-sm"
        >
          {TRANSLATION_LANGUAGES.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
        <button type="button" onClick={swapLangs} className="text-forma-muted px-1" title="Inverser">
          ⇄
        </button>
        <select
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value)}
          className="flex-1 min-w-[90px] border border-forma-border rounded-lg px-2 py-1.5 text-sm"
        >
          {TRANSLATION_LANGUAGES.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-1">
        {(['standard', 'advanced'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`text-xs px-2 py-1 rounded-lg ${
              mode === m ? 'bg-forma-accent text-white' : 'border border-forma-border'
            }`}
          >
            {m === 'standard' ? 'Base' : 'Avancé'}
          </button>
        ))}
      </div>

      <div>
        <label className="text-[10px] font-bold text-forma-muted uppercase">Texte source</label>
        <textarea
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          rows={compact ? 4 : 5}
          placeholder="Collez vos consignes, fiches techniques…"
          className="w-full mt-1 border border-forma-border rounded-lg px-3 py-2 text-sm resize-y"
        />
      </div>

      <GlassButton accent className="w-full" onClick={() => void runTranslate()} disabled={loading || !sourceText.trim()}>
        {loading ? 'Traduction…' : 'Traduire'}
      </GlassButton>

      <div>
        <label className="text-[10px] font-bold text-forma-muted uppercase">Résultat</label>
        <textarea
          value={resultText}
          readOnly
          rows={compact ? 4 : 5}
          placeholder="La traduction apparaîtra ici…"
          className="w-full mt-1 border border-forma-border rounded-lg px-3 py-2 text-sm resize-y bg-white/20"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <GlassButton
          size="sm"
          disabled={!resultText}
          onClick={() => {
            void navigator.clipboard.writeText(resultText)
            useToastStore.getState().show('Copié')
          }}
        >
          Copier
        </GlassButton>
        {onOpenDico && resultText && (
          <GlassButton
            size="sm"
            onClick={() => onOpenDico(resultText.split(/\s+/)[0] || '')}
          >
            📖 Dico
          </GlassButton>
        )}
      </div>
    </div>
  )
}
