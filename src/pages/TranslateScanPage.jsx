import { useNavigate } from 'react-router-dom'
import useAppStore from '@/stores/useAppStore'
import { useTheme } from '@/hooks/useAppearance'
import BrandLogo from '@/components/BrandLogo'
import DocumentScanTranslator from '@/components/translation/DocumentScanTranslator'

export default function TranslateScanPage() {
  const navigate = useNavigate()
  const { T } = useTheme()
  const notebooks = useAppStore((s) => s.notebooks)

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.ink }}>
      <header style={{
        padding: '14px 20px',
        borderBottom: `1px solid ${T.border}`,
        background: T.surface,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        flexWrap: 'wrap',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}>
        <button type="button" onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: T.accent, fontWeight: 600 }}>
          ← Accueil
        </button>
        <BrandLogo T={T} size={28} />
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18 }}>Scan & traduction</div>
          <div style={{ fontSize: 11, color: T.muted }}>OCR (Tesseract) · EN ↔ FR · copier ou carnet</div>
        </div>
      </header>

      <main style={{ padding: '24px 20px 48px', maxWidth: 1000, margin: '0 auto' }}>
        <DocumentScanTranslator T={T} notebooks={notebooks} embedded />
      </main>
    </div>
  )
}
