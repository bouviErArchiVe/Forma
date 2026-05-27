import { useNavigate } from 'react-router-dom'
import useAppStore from '@/stores/useAppStore'
import { useTheme } from '@/hooks/useAppearance'
import BrandLogo from '@/components/BrandLogo'
import DocumentScanTranslator from '@/components/translation/DocumentScanTranslator'
import { ELEVATION, TYPE } from '@/lib/design'
import { rgbaFromHex } from '@/theme/glass'
import { TOKENS } from '@/theme/tokens'

export default function TranslateScanPage() {
  const navigate = useNavigate()
  const { T } = useTheme()
  const notebooks = useAppStore((s) => s.notebooks)

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.ink }}>
      <header style={{
        padding: '14px 20px',
        borderBottom: `1px solid ${rgbaFromHex(T.border, 0.4)}`,
        background: T.surface,
        boxShadow: ELEVATION.toolbar,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        flexWrap: 'wrap',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}>
        <button
          type="button"
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: T.accent, fontWeight: 600 }}
        >
          ← Accueil
        </button>
        <BrandLogo T={T} size={28} />
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ ...TYPE.display, fontSize: 18 }}>Scan & traduction</div>
          <div style={{ ...TYPE.caption, color: T.muted, marginTop: 2 }}>
            OCR (Tesseract) · PDF natif ou raster · EN ↔ FR
          </div>
        </div>
      </header>

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
