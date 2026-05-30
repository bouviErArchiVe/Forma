import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { BrandLogo } from '../components/BrandLogo'
import { FormaDicoPanel } from '../components/tools/FormaDicoPanel'

export function FormaDicoPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const initialWord = params.get('q') || ''

  return (
    <div className="min-h-full flex flex-col max-w-3xl mx-auto w-full p-4">
      <header className="forma-glass-header rounded-xl px-4 py-3 mb-4 flex flex-wrap items-center gap-3 border border-forma-border/50">
        <BrandLogo size="sm" subtitle="FormaDico" />
        <div className="flex-1" />
        <Link to="/" className="text-sm text-forma-accent hover:underline">
          ← Bibliothèque
        </Link>
      </header>

      <p className="text-xs text-forma-muted mb-4">
        Dictionnaire · définitions · synonymes · conjugaison
      </p>

      <FormaDicoPanel
        initialWord={initialWord}
        onOpenTranslate={(word) => navigate(`/translate?text=${encodeURIComponent(word)}`)}
      />

      <p className="text-[10px] text-forma-muted mt-6 leading-relaxed">
        Contenu sous licence libre Wiktionary (CC BY-SA). Anglais : Wiktionary + dictionaryapi.dev.
        Cache local pour consultation hors-ligne limitée. API personnalisée : VITE_DICO_API_URL.
      </p>
    </div>
  )
}
