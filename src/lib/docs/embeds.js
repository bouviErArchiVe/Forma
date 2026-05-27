import { getSheet } from '@/lib/spreadsheet/persistence'
import { computeSheet } from '@/lib/spreadsheet/formulas'
import { cellKey } from '@/lib/spreadsheet/cells'

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function sheetToEmbedHtml(sheet) {
  if (!sheet) return '<p><em>Tableau introuvable</em></p>'
  const computed = computeSheet(sheet)
  const rows = Math.min(sheet.rows, 14)
  const cols = Math.min(sheet.cols, 10)
  let table = '<table border="1" cellpadding="6" style="border-collapse:collapse;width:100%;font-size:11px"><tbody>'
  for (let r = 0; r < rows; r++) {
    table += '<tr>'
    for (let c = 0; c < cols; c++) {
      const v = computed[cellKey(r, c)]?.value ?? ''
      table += `<td>${esc(v)}</td>`
    }
    table += '</tr>'
  }
  table += '</tbody></table>'
  return table
}

export function insertSheetEmbedMarker(sheetId, sheetName) {
  return `<div contenteditable="false" data-forma-embed="sheet" data-sheet-id="${esc(sheetId)}" data-sheet-name="${esc(sheetName || 'Tableau')}" class="forma-sheet-embed" style="border:1px solid #ccd3dc;border-radius:8px;padding:10px;margin:12px 0;background:#fafbfc;overflow:auto"><div style="font-weight:700;margin-bottom:6px;font-size:12px">📊 ${esc(sheetName || 'Tableau')} <span style="color:#888;font-weight:400">· lié</span></div><div class="forma-sheet-embed-body">Chargement…</div></div><p></p>`
}

export function hydrateSheetEmbeds(root) {
  if (!root?.querySelectorAll) return
  root.querySelectorAll('[data-forma-embed="sheet"]').forEach((node) => {
    const id = node.getAttribute('data-sheet-id')
    const body = node.querySelector('.forma-sheet-embed-body')
    if (!id || !body) return
    const sheet = getSheet(id)
    body.innerHTML = sheet ? sheetToEmbedHtml(sheet) : '<em>Tableau introuvable</em>'
  })
}
