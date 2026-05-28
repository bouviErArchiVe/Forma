import { useSearchParams } from 'react-router-dom'
import { useTheme } from '@/hooks/useAppearance'
import useAppStore from '@/stores/useAppStore'
import FormaModuleHeader from '@/components/FormaModuleHeader'
import FormaDicoPanel from '@/components/formadico/FormaDicoPanel'

export default function FormaDicoPage() {
  const { T } = useTheme()
  const [params] = useSearchParams()
  const consumePendingDicoWord = useAppStore((s) => s.consumePendingDicoWord)
  const initialWord = params.get('q') || consumePendingDicoWord() || ''

  return (
    <div className="forma-page-shell" style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: T.bg }}>
      <FormaModuleHeader title="FormaDico" subtitle="Dictionnaire · définitions · synonymes · conjugaison" sticky />
      <main style={{ flex: 1, maxWidth: 720, width: '100%', margin: '0 auto', padding: '20px 16px 40px', boxSizing: 'border-box' }}>
        <FormaDicoPanel T={T} initialWord={initialWord} />
        <p style={{ fontSize: 10, color: T.muted, marginTop: 20, lineHeight: 1.5 }}>
          Contenu sous licence libre Wiktionary (CC BY-SA). Anglais : Wiktionary + dictionaryapi.dev.
          Cache local pour consultation hors ligne limitée. API personnalisée : VITE_DICO_API_URL.
        </p>
      </main>
    </div>
  )
}
