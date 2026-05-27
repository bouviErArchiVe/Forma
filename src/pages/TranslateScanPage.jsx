import useAppStore from '@/stores/useAppStore'
import { useTheme } from '@/hooks/useAppearance'
import FormaModuleHeader from '@/components/FormaModuleHeader'
import DocumentScanTranslator from '@/components/translation/DocumentScanTranslator'
import { TYPE } from '@/lib/design'
import { rgbaFromHex } from '@/theme/glass'
import { TOKENS } from '@/theme/tokens'

export default function TranslateScanPage() {
  const { T } = useTheme()
  const notebooks = useAppStore((s) => s.notebooks)

  return (
    <div style={{ minHeight: '100dvh', background: T.bg, color: T.ink }}>
      <FormaModuleHeader
        title="Scan & traduction"
        subtitle="OCR (Tesseract) · PDF multi-pages (jusqu'à 12) · EN ↔ FR"
        sticky
      />

      <main style={{ padding: '24px 20px 48px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{
          marginBottom: 20,
          padding: '12px 14px',
          borderRadius: TOKENS.radius.lg,
          background: `${T.accent}0c`,
          border: `1px solid ${rgbaFromHex(T.accent, 0.25)}`,
          ...TYPE.caption,
          color: T.ink,
          lineHeight: 1.45,
        }}>
          Importez une photo de fiche technique ou un PDF. Le texte est extrait automatiquement, puis traduit.
          Vous pouvez aussi coller du texte depuis le widget 🌐 avant d&apos;ouvrir cette page.
        </div>
        <DocumentScanTranslator T={T} notebooks={notebooks} embedded />
      </main>
    </div>
  )
}
