import type { FormaSheet } from '../../types'
import { sheetToCsv } from './formulas'

function safeFilename(name: string): string {
  return (name || 'tableau').replace(/[^\w\- ]+/g, '_').trim() || 'tableau'
}

function downloadText(filename: string, content: string, mime = 'text/plain'): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportSheetCsv(sheet: FormaSheet): void {
  downloadText(`${safeFilename(sheet.name)}.csv`, sheetToCsv(sheet), 'text/csv')
}

export function exportSheetJson(sheet: FormaSheet): void {
  downloadText(`${safeFilename(sheet.name)}.json`, JSON.stringify(sheet, null, 2), 'application/json')
}
