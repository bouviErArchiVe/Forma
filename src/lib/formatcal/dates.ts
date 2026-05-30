const LO = 'fr-FR'

export function toDate(ts: number | string): Date {
  return new Date(typeof ts === 'number' ? ts : Date.parse(ts))
}

export function startOfDay(d: Date): Date {
  const r = new Date(d)
  r.setHours(0, 0, 0, 0)
  return r
}

export function endOfDay(d: Date): Date {
  const r = new Date(d)
  r.setHours(23, 59, 59, 999)
  return r
}

export function startOfDayTs(ts: number): number {
  return startOfDay(toDate(ts)).getTime()
}

export function startOfWeek(d: Date, weekStartsOn = 1): Date {
  const day = d.getDay()
  const diff = (day + 7 - weekStartsOn) % 7
  const r = startOfDay(d)
  r.setDate(r.getDate() - diff)
  return r
}

export function endOfWeek(d: Date, weekStartsOn = 1): Date {
  const start = startOfWeek(d, weekStartsOn)
  const r = new Date(start)
  r.setDate(r.getDate() + 6)
  return endOfDay(r)
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export function endOfMonth(d: Date): Date {
  return endOfDay(new Date(d.getFullYear(), d.getMonth() + 1, 0))
}

export function addDays(d: Date | number, n: number): Date {
  const r = new Date(typeof d === 'number' ? d : d.getTime())
  r.setDate(r.getDate() + n)
  return r
}

export function addMonths(d: Date | number, n: number): Date {
  const src = typeof d === 'number' ? new Date(d) : d
  return new Date(src.getFullYear(), src.getMonth() + n, src.getDate(), src.getHours(), src.getMinutes())
}

export function addYears(d: Date | number, n: number): Date {
  const src = typeof d === 'number' ? new Date(d) : d
  return new Date(src.getFullYear() + n, src.getMonth(), src.getDate(), src.getHours(), src.getMinutes())
}

export function isSameDay(a: Date | number, b: Date | number): boolean {
  const da = toDate(typeof a === 'number' ? a : a.getTime())
  const db = toDate(typeof b === 'number' ? b : b.getTime())
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate()
}

export function isSameMonthTs(a: number, b: number): boolean {
  const da = toDate(a)
  const db = toDate(b)
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth()
}

export function monthGrid(cursorTs: number, weekStartsOn = 1): Date[] {
  const cur = toDate(cursorTs)
  const start = startOfWeek(startOfMonth(cur), weekStartsOn)
  const end = endOfWeek(endOfMonth(cur), weekStartsOn)
  const days: Date[] = []
  const d = new Date(start)
  while (d <= end) {
    days.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return days
}

export function weekDays(cursorTs: number, weekStartsOn = 1): Date[] {
  const start = startOfWeek(toDate(cursorTs), weekStartsOn)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function fmtDate(ts: number, style = 'medium'): string {
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

export function fmtTime(ts: number): string {
  return toDate(ts).toLocaleTimeString(LO, { hour: '2-digit', minute: '2-digit' })
}

export function fmtRange(ev: { startAt: number; endAt: number; allDay: boolean }): string {
  if (ev.allDay) return fmtDate(ev.startAt, 'EEE d')
  return `${fmtDate(ev.startAt, 'EEE d')} · ${fmtTime(ev.startAt)}–${fmtTime(ev.endAt)}`
}

export function durationLabel(ev: { startAt: number; endAt: number }): string {
  const m = Math.round((ev.endAt - ev.startAt) / 60000)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const r = m % 60
  return r ? `${h}h${String(r).padStart(2, '0')}` : `${h}h`
}

export function isToday(ts: number): boolean {
  return isSameDay(toDate(ts), new Date())
}
