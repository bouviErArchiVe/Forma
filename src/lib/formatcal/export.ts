import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { FormaCalEvent } from '../../types'
import { downloadText } from '../docs/htmlUtils'
import { fmtDate, fmtRange } from './dates'
import { autoStatus, getCategoryMeta } from './model'

function toIcs(ts: number, allDay: boolean): string {
  const d = new Date(ts)
  if (allDay) {
    return d.toISOString().slice(0, 10).replace(/-/g, '')
  }
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function escapeIcs(s: string): string {
  return String(s || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

export function exportEventsIcs(events: FormaCalEvent[], calName = 'FormatCal'): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//Forma//${calName}//FR`,
    'CALSCALE:GREGORIAN',
  ]

  events.forEach((ev) => {
    const uid = ev.id.replace(/[^a-zA-Z0-9]/g, '')
    const dtStart = toIcs(ev.startAt, ev.allDay)
    const dtEnd = toIcs(ev.endAt || ev.startAt + 3600000, ev.allDay)
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${uid}@forma.local`)
    lines.push(`DTSTAMP:${toIcs(Date.now(), false)}`)
    lines.push(`DTSTART${ev.allDay ? ';VALUE=DATE' : ''}:${dtStart}`)
    lines.push(`DTEND${ev.allDay ? ';VALUE=DATE' : ''}:${dtEnd}`)
    lines.push(`SUMMARY:${escapeIcs(ev.title)}`)
    if (ev.description) lines.push(`DESCRIPTION:${escapeIcs(ev.description)}`)
    lines.push('END:VEVENT')
  })

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export function exportEventsIcsFile(events: FormaCalEvent[]): void {
  downloadText('formatcal.ics', exportEventsIcs(events), 'text/calendar')
}

export async function exportAgendaPdf(
  events: FormaCalEvent[],
  { title = 'FormatCal — Agenda' } = {},
): Promise<void> {
  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const fontSize = 11
  const lineHeight = fontSize * 1.4
  const margin = 48
  const pageWidth = 595
  const pageHeight = 842

  let page = pdf.addPage([pageWidth, pageHeight])
  let y = pageHeight - margin

  const writeLine = (line: string, size = fontSize, color = rgb(0.1, 0.1, 0.1)) => {
    if (y < margin + lineHeight) {
      page = pdf.addPage([pageWidth, pageHeight])
      y = pageHeight - margin
    }
    page.drawText(line, { x: margin, y, size, font, color })
    y -= lineHeight
  }

  writeLine(title, 16)
  y -= lineHeight * 0.5
  writeLine(`Généré le ${fmtDate(Date.now())}`, 9, rgb(0.45, 0.45, 0.45))
  y -= lineHeight * 0.5

  const sorted = [...events].sort((a, b) => a.startAt - b.startAt)
  sorted.forEach((ev) => {
    const cat = getCategoryMeta(ev.category)
    writeLine(`${cat.icon} ${ev.title}`, 11)
    writeLine(fmtRange(ev), 9, rgb(0.4, 0.4, 0.4))
    writeLine(`Statut: ${autoStatus(ev)} · Priorité: ${ev.priority}`, 9, rgb(0.4, 0.4, 0.4))
    if (ev.description) {
      const trimmed = ev.description.slice(0, 200)
      writeLine(trimmed, 9, rgb(0.35, 0.35, 0.35))
    }
    y -= lineHeight * 0.5
  })

  const bytes = await pdf.save()
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'formatcal-agenda.pdf'
  a.click()
  URL.revokeObjectURL(url)
}
