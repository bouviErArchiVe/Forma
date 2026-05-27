import { useSheetLive } from '@/hooks/useSheetLive'
import SpreadsheetPreview from '@/components/spreadsheet/SpreadsheetPreview'

export default function SpreadsheetPlacedView({ el, width, height }) {
  const sheet = useSheetLive(el?.sheetId)

  if (el?.mode === 'image' && el?.imageSrc) {
    return (
      <img
        src={el.imageSrc}
        alt={el.l || 'Tableau'}
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none' }}
      />
    )
  }

  if (!sheet) {
    return (
      <div style={{
        width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f4f6f8', border: '1px dashed #bbb', fontSize: 11, color: '#666',
      }}>
        Tableau introuvable
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', background: '#fff', border: '1px solid #ccd3dc', borderRadius: 4 }}>
      <SpreadsheetPreview sheet={sheet} maxRows={Math.min(sheet.rows, 12)} maxCols={Math.min(sheet.cols, 8)} compact />
    </div>
  )
}

export function SpreadsheetPlacedStatic({ el, sx = 1, sy = 1 }) {
  const sheet = useSheetLive(el?.sheetId)
  const W = Math.max((el.pw || el.w || 320) * sx, 40)
  const H = Math.max((el.ph || el.h || 180) * sy, 30)

  if (el?.mode === 'image' && el?.imageSrc) {
    return <img src={el.imageSrc} alt={el.l || 'Tableau'} style={{ width: W, height: H, objectFit: 'contain', display: 'block' }} />
  }
  if (!sheet) {
    return <div style={{ width: W, height: H, background: '#f0f0f0', border: '1px solid #ccc', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{el.l || 'Tableau'}</div>
  }
  return (
    <div style={{ width: W, height: H, overflow: 'hidden', background: '#fff', border: '1px solid #ccd3dc' }}>
      <SpreadsheetPreview sheet={sheet} maxRows={Math.min(sheet.rows, 8)} maxCols={Math.min(sheet.cols, 6)} compact />
    </div>
  )
}

/** @deprecated utiliser SpreadsheetPlacedStatic */
export function renderSpreadsheetPlaced(el, sx = 1, sy = 1) {
  return <SpreadsheetPlacedStatic el={el} sx={sx} sy={sy} />
}
