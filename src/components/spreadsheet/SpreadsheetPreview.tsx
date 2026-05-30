import { useMemo } from 'react'
import type { FormaSheet } from '../../types'
import { cellKey, colToLetter } from '../../lib/spreadsheet/cells'
import { computeSheet } from '../../lib/spreadsheet/formulas'
import { getMergeAt, isMergeHidden } from '../../lib/spreadsheet/model'

interface SpreadsheetPreviewProps {
  sheet: FormaSheet
  maxRows?: number
  maxCols?: number
  compact?: boolean
}

export function SpreadsheetPreview({
  sheet,
  maxRows,
  maxCols,
  compact = false,
}: SpreadsheetPreviewProps) {
  const computed = useMemo(() => computeSheet(sheet), [sheet])
  const rows = Math.min(sheet.rows, maxRows ?? sheet.rows)
  const cols = Math.min(sheet.cols, maxCols ?? sheet.cols)

  return (
    <table className="border-collapse w-full h-full table-fixed font-sans text-[10px]">
      {!compact && (
        <thead>
          <tr>
            <th className="w-7 bg-neutral-100 border border-neutral-200" />
            {Array.from({ length: cols }, (_, c) => (
              <th key={c} className="bg-neutral-100 border border-neutral-200 font-semibold p-0.5">
                {colToLetter(c)}
              </th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>
        {Array.from({ length: rows }, (_, r) => (
          <tr key={r} style={{ height: sheet.rowHeights[r] ?? 28 }}>
            {!compact && (
              <td className="bg-neutral-100 border border-neutral-200 text-center text-neutral-500">
                {r + 1}
              </td>
            )}
            {Array.from({ length: cols }, (_, c) => {
              if (isMergeHidden(sheet, r, c)) return null
              const m = getMergeAt(sheet, r, c)
              const cell = computed[cellKey(r, c)]
              return (
                <td
                  key={c}
                  rowSpan={m ? m.r2 - m.r1 + 1 : 1}
                  colSpan={m ? m.c2 - m.c1 + 1 : 1}
                  className="border border-neutral-200 overflow-hidden truncate px-1"
                  style={{
                    fontWeight: cell?.style?.bold ? 700 : 400,
                    fontStyle: cell?.style?.italic ? 'italic' : 'normal',
                    textAlign: cell?.style?.alignH || 'left',
                    background: cell?.style?.bg || '#fff',
                  }}
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

export function sheetSnippet(sheet: FormaSheet, maxLen = 80): string {
  const parts = Object.values(sheet.cells)
    .map((c) => c.raw)
    .filter(Boolean)
    .slice(0, 6)
  const text = parts.join(' · ')
  return text.slice(0, maxLen) + (text.length > maxLen ? '…' : '')
}
