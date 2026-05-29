import { getCards } from '../services/study'

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

export async function downloadStudyCardsCsv(
  notebookId: string,
  notebookName: string,
): Promise<number> {
  const cards = await getCards(notebookId)
  if (!cards.length) throw new Error('Aucune carte Study dans ce carnet')

  const header = 'front,back,mastery,nextReview'
  const rows = cards.map(
    (c) =>
      `${escapeCsv(c.front)},${escapeCsv(c.back)},${c.mastery},${new Date(c.nextReview).toISOString()}`,
  )
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const safe = notebookName.replace(/[^\w\s.-]/g, '').trim() || 'study'
  a.href = url
  a.download = `${safe}-study.csv`
  a.click()
  URL.revokeObjectURL(url)
  return cards.length
}
