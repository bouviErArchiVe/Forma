import { useMemo } from 'react'
import { getSheet } from '@/lib/spreadsheet/persistence'
import SpreadsheetPreview from '@/components/spreadsheet/SpreadsheetPreview'

export default function SpreadsheetPlacedView({ el, width, height }) {
  const sheet = useMemo(() => {
    if (!el?.sheetId) return null
    return getSheet(el.sheetId)
  }, [el?.sheetId, el?.updatedAt])

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

export function renderSpreadsheetPlaced(el, sx = 1, sy = 1) {
  const W = Math.max((el.pw || el.w || 320) * sx, 40)
  const H = Math.max((el.ph || el.h || 180) * sy, 30)
  if (el.mode === 'image' && el.imageSrc) {
    return <img src={el.imageSrc} alt={el.l || 'Tableau'} style={{ width: W, height: H, objectFit: 'contain', display: 'block' }} />
  }
  const sheet = el.sheetId ? getSheet(el.sheetId) : null
  if (!sheet) {
    return <div style={{ width: W, height: H, background: '#f0f0f0', border: '1px solid #ccc', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{el.l || 'Tableau'}</div>
  }
  return (
    <div style={{ width: W, height: H, overflow: 'hidden', background: '#fff', border: '1px solid #ccd3dc' }}>
      <SpreadsheetPreview sheet={sheet} maxRows={Math.min(sheet.rows, 8)} maxCols={Math.min(sheet.cols, 6)} compact />
    </div>
  )
}
