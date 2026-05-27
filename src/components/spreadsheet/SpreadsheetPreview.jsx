import { useMemo } from 'react'
import { colToLetter, cellKey } from '@/lib/spreadsheet/cells'
import { computeSheet } from '@/lib/spreadsheet/formulas'
import { getMergeAt, isMergeHidden } from '@/lib/spreadsheet/model'

export default function SpreadsheetPreview({ sheet, maxRows, maxCols, compact = false }) {
  const computed = useMemo(() => computeSheet(sheet), [sheet])
  const rows = Math.min(sheet.rows, maxRows || sheet.rows)
  const cols = Math.min(sheet.cols, maxCols || sheet.cols)

  const cellStyle = (cell) => ({
    padding: compact ? '2px 4px' : '4px 8px',
    fontSize: cell?.style?.fontSize || (compact ? 9 : 11),
    fontWeight: cell?.style?.bold ? 700 : 400,
    fontStyle: cell?.style?.italic ? 'italic' : 'normal',
    textDecoration: cell?.style?.underline ? 'underline' : 'none',
    color: cell?.style?.color || '#1c1c24',
    background: cell?.style?.bg || '#fff',
    textAlign: cell?.style?.alignH || 'left',
    verticalAlign: cell?.style?.alignV || 'middle',
    border: cell?.style?.border !== false ? '1px solid #d0d5dd' : 'none',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    boxSizing: 'border-box',
  })

  return (
    <table style={{ borderCollapse: 'collapse', width: '100%', height: '100%', tableLayout: 'fixed', fontFamily: "'Inter',sans-serif" }}>
      {!compact && (
        <thead>
          <tr>
            <th style={{ width: 28, background: '#f4f6f8', border: '1px solid #d0d5dd' }} />
            {Array.from({ length: cols }, (_, c) => (
              <th key={c} style={{ background: '#f4f6f8', border: '1px solid #d0d5dd', fontSize: 10, fontWeight: 600, padding: 2 }}>
                {colToLetter(c)}
              </th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>
        {Array.from({ length: rows }, (_, r) => (
          <tr key={r} style={{ height: sheet.rowHeights?.[r] || 28 }}>
            {!compact && (
              <td style={{ background: '#f4f6f8', border: '1px solid #d0d5dd', fontSize: 10, textAlign: 'center', color: '#666' }}>{r + 1}</td>
            )}
            {Array.from({ length: cols }, (_, c) => {
              if (isMergeHidden(sheet, r, c)) return null
              const m = getMergeAt(sheet, r, c)
              const k = cellKey(r, c)
              const cell = computed[k]
              return (
                <td
                  key={c}
                  rowSpan={m ? m.r2 - m.r1 + 1 : 1}
                  colSpan={m ? m.c2 - m.c1 + 1 : 1}
                  style={cellStyle(cell)}
                >
                  {cell?.value ?? ''}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
