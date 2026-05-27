/** FORMATCAL — export PDF / ICS */

import jsPDF from 'jspdf'
import { fmtDate, fmtTime, fmtRange } from './dates'
import { autoStatus } from './model'
import { getCategoryMeta } from './model'

export function exportEventsIcs(events, calName = 'FORMATCAL') {
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

function toIcs(ts, allDay) {
  const d = new Date(ts)
  if (allDay) {
    return d.toISOString().slice(0, 10).replace(/-/g, '')
  }
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function escapeIcs(s) {
  return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function downloadText(content, filename, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportAgendaPdf(events, { title = 'FORMATCAL', from, to } = {}) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  let y = 18
  pdf.setFontSize(16)
  pdf.text(title, 14, y)
  y += 8
  pdf.setFontSize(9)
  pdf.setTextColor(120)
  pdf.text(`Généré le ${fmtDate(Date.now())}`, 14, y)
  y += 10
  pdf.setTextColor(0)

  const sorted = [...events].sort((a, b) => a.startAt - b.startAt)
  sorted.forEach((ev) => {
    if (y > 275) {
      pdf.addPage()
      y = 18
    }
    const cat = getCategoryMeta(ev.category)
    pdf.setFontSize(11)
    pdf.setTextColor(40)
    pdf.text(`${cat.icon} ${ev.title}`, 14, y)
    y += 5
    pdf.setFontSize(9)
    pdf.setTextColor(100)
    pdf.text(fmtRange(ev), 14, y)
    y += 4
    pdf.text(`Statut: ${autoStatus(ev)} · Priorité: ${ev.priority}`, 14, y)
    y += 4
    if (ev.description) {
      const lines = pdf.splitTextToSize(ev.description, 180)
      pdf.text(lines, 14, y)
      y += lines.length * 4
    }
    y += 6
  })

  return pdf.output('blob')
}

export function exportMonthPng(containerEl) {
  if (!containerEl) return null
  return import('html2canvas').then(({ default: html2canvas }) =>
    html2canvas(containerEl, { backgroundColor: '#0e1016', scale: 2 }).then((c) => c.toDataURL('image/png'))
  )
}
