import { addDocumentPage, updateDocumentPageHtml } from '../docs/model'
import type { FormulaResult } from './types'
import type { FormaDocument } from '../../types'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export interface CalculationDocInput {
  title: string
  formulaText: string
  values: Record<string, string>
  fieldLabels?: Record<string, string>
  result: FormulaResult
}

/** Bloc HTML insérable dans une page FormaDoc. */
export function formatCalculationHtml(input: CalculationDocInput): string {
  const { title, formulaText, values, fieldLabels = {}, result } = input
  const rows = result.rows || []
  const summary = result.summary || ''

  const valueLines = Object.entries(values)
    .filter(([, v]) => String(v ?? '').trim())
    .map(([key, val]) => {
      const label = fieldLabels[key] || key
      return `<li><strong>${escapeHtml(label)}</strong> : ${escapeHtml(String(val))}</li>`
    })

  const resultRows = rows
    .map(
      (r) =>
        `<tr><td>${escapeHtml(r.label)}</td><td>${escapeHtml(r.value)}</td></tr>`,
    )
    .join('')

  const parts = [
    `<section data-forma-calc="1">`,
    `<h3>${escapeHtml(title)}</h3>`,
    `<p><em>${escapeHtml(formulaText)}</em></p>`,
  ]

  if (valueLines.length) {
    parts.push(`<p><strong>Valeurs</strong></p><ul>${valueLines.join('')}</ul>`)
  }

  if (resultRows) {
    parts.push(
      `<table border="1" cellpadding="6" style="border-collapse:collapse;width:100%;max-width:480px">`,
      `<tbody>${resultRows}</tbody></table>`,
    )
  }

  if (summary) {
    parts.push(`<p><strong>Résultat :</strong> ${escapeHtml(summary)}</p>`)
  }

  parts.push(`</section>`)
  return parts.join('')
}

/** Ajoute le bloc à la fin de la dernière page du document. */
export function appendCalculationToDocument(doc: FormaDocument, htmlBlock: string): FormaDocument {
  if (doc.pages.length === 0) {
    return addDocumentPage({ ...doc, pages: [] }, 0, htmlBlock)
  }
  const lastIdx = doc.pages.length - 1
  const page = doc.pages[lastIdx]
  const sep = page.html.trim()
    ? '<hr style="margin:1.5em 0;border:none;border-top:1px solid #ccc"/>'
    : ''
  return updateDocumentPageHtml(doc, lastIdx, `${page.html}${sep}${htmlBlock}`)
}
