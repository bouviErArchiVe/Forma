import useAppStore from '@/stores/useAppStore'
import FormaAppShell from '@/components/FormaAppShell'
import DocumentScanTranslator from '@/components/translation/DocumentScanTranslator'
import { TYPE } from '@/lib/design'
import { rgbaFromHex } from '@/theme/glass'
import { TOKENS } from '@/theme/tokens'
import { useTheme } from '@/hooks/useAppearance'

export default function TranslateScanPage() {
  const { T } = useTheme()
  const notebooks = useAppStore((s) => s.notebooks)

  return (
    <FormaAppShell
      title="Traduction"
      subtitle="OCR (Tesseract) · PDF multi-pages (jusqu'à 12) · EN ↔ FR"
    >
      <div style={{ padding: '24px 20px 48px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{
          marginBottom: 20,
          padding: '12px 14px',
          borderRadius: TOKENS.radius.lg,
          background: rgbaFromHex(T.accent, 0.08),
          border: `1px solid ${rgbaFromHex(T.accent, 0.25)}`,
          fontSize: TYPE.sm,
          color: T.ink,
          lineHeight: 1.55,
        }}>
          Importez une image ou un PDF scanné — le texte est extrait puis traduit. Vous pouvez envoyer le résultat vers un carnet Forma.
        </div>
        <DocumentScanTranslator T={T} notebooks={notebooks} />
      </div>
    </FormaAppShell>
  )
}
