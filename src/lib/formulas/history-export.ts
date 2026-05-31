import type { FormulaHistoryEntry } from '../../stores/formulaHistoryStore'

function formatValues(values: Record<string, string>): string {
  const keys = Object.keys(values).filter((k) => values[k]?.trim())
  if (keys.length === 0) return '  (aucune valeur)'
  return keys.map((k) => `  ${k}: ${values[k]}`).join('\n')
}

/** Texte copiable pour un calcul conservé. */
export function formatHistoryEntry(entry: FormulaHistoryEntry): string {
  const date = new Date(entry.createdAt).toLocaleString('fr-FR')
  const lines = [
    entry.title,
    `Date : ${date}`,
    '',
    'Valeurs :',
    formatValues(entry.values),
    '',
    `Résultat : ${entry.summary}`,
  ]
  return lines.join('\n')
}

/** Rapport texte de l'historique complet (plus récent en premier). */
export function formatHistoryReport(entries: FormulaHistoryEntry[]): string {
  if (entries.length === 0) return ''
  const header = `Historique Formules — ${entries.length} calcul${entries.length !== 1 ? 's' : ''}\n${'='.repeat(40)}\n`
  const body = entries.map((e, i) => `${i + 1}. ${formatHistoryEntry(e)}`).join('\n\n' + '-'.repeat(40) + '\n\n')
  return header + body + '\n'
}

export function downloadHistoryReport(entries: FormulaHistoryEntry[]): void {
  const text = formatHistoryReport(entries)
  if (!text) return
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `forma-formules-${new Date().toISOString().slice(0, 10)}.txt`
  a.click()
  URL.revokeObjectURL(url)
}
