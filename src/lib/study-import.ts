import { addCard } from '../services/study'

function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"'
        i++
      } else if (ch === '"') inQuotes = false
      else cur += ch
    } else if (ch === '"') inQuotes = true
    else if (ch === ',') {
      out.push(cur)
      cur = ''
    } else cur += ch
  }
  out.push(cur)
  return out
}

export async function importStudyCardsFromCsv(
  notebookId: string,
  file: File,
): Promise<number> {
  const text = await file.text()
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) throw new Error('CSV vide ou sans données')

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim())
  const frontIdx = header.indexOf('front')
  const backIdx = header.indexOf('back')
  if (frontIdx < 0 || backIdx < 0) {
    throw new Error('Colonnes front et back requises')
  }

  let count = 0
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i])
    const front = cols[frontIdx]?.trim()
    const back = cols[backIdx]?.trim()
    if (!front || !back) continue
    await addCard(notebookId, front, back)
    count++
  }
  if (!count) throw new Error('Aucune carte valide dans le fichier')
  return count
}
