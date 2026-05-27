/** FORMATCAL — utilitaires dates (sans locale date-fns lourde) */

import {
  startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  startOfYear, endOfYear, addDays, addMonths, addYears, isSameDay, isSameMonth,
  eachDayOfInterval, differenceInMinutes,
} from 'date-fns'

export function toDate(ts) {
  return new Date(typeof ts === 'number' ? ts : Date.parse(ts))
}

export function startOfDayTs(ts) {
  return startOfDay(toDate(ts)).getTime()
}

export function monthGrid(cursorTs, weekStartsOn = 1) {
  const cur = toDate(cursorTs)
  const start = startOfWeek(startOfMonth(cur), { weekStartsOn })
  const end = endOfWeek(endOfMonth(cur), { weekStartsOn })
  return eachDayOfInterval({ start, end })
}

export function weekDays(cursorTs, weekStartsOn = 1) {
  const start = startOfWeek(toDate(cursorTs), { weekStartsOn })
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

const LO = 'fr-FR'

export function fmtDate(ts, style = 'medium') {
  const d = toDate(ts)
  if (style === 'EEEE d MMMM yyyy') {
    return d.toLocaleDateString(LO, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }
  if (style === 'EEEE d MMMM') {
    return d.toLocaleDateString(LO, { weekday: 'long', day: 'numeric', month: 'long' })
  }
  if (style === 'EEE d') {
    return d.toLocaleDateString(LO, { weekday: 'short', day: 'numeric' })
  }
  if (style === 'd MMM') {
    return d.toLocaleDateString(LO, { day: 'numeric', month: 'short' })
  }
  if (style === 'MMMM yyyy') {
    return d.toLocaleDateString(LO, { month: 'long', year: 'numeric' })
  }
  if (style === 'yyyy') {
    return d.toLocaleDateString(LO, { year: 'numeric' })
  }
  if (style === 'yyyy-MM-dd') {
    return d.toISOString().slice(0, 10)
  }
  return d.toLocaleDateString(LO, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function fmtTime(ts) {
  return toDate(ts).toLocaleTimeString(LO, { hour: '2-digit', minute: '2-digit' })
}

export function fmtRange(ev) {
  if (ev.allDay) return fmtDate(ev.startAt, 'EEE d')
  return `${fmtDate(ev.startAt, 'EEE d')} · ${fmtTime(ev.startAt)}–${fmtTime(ev.endAt)}`
}

export function durationLabel(ev) {
  const m = differenceInMinutes(toDate(ev.endAt), toDate(ev.startAt))
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const r = m % 60
  return r ? `${h}h${String(r).padStart(2, '0')}` : `${h}h`
}

export function isToday(ts) {
  return isSameDay(toDate(ts), new Date())
}

export function isSameMonthTs(a, b) {
  return isSameMonth(toDate(a), toDate(b))
}

export {
  startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  startOfYear, endOfYear, addDays, addMonths, addYears, isSameDay,
}
