/**
 * event-suggest — analyse locale d'une phrase en français pour pré-remplir
 * un événement de calendrier (« examen structure vendredi 9h »,
 * « cours construction chaque mercredi 13h », « remise projet demain »).
 *
 * Parsing pur et déterministe, sans IA — utilisé en mode local, et comme
 * fallback quand la réponse du provider cloud n'est pas exploitable.
 * La suggestion pré-remplit le modal : l'utilisateur confirme TOUJOURS.
 */
import { addDays, parseISODate, type CalendarEvent, type EventRecurrence } from './calendar-data'

const WEEKDAYS: { names: string[]; jsDay: number }[] = [
  { names: ['lundi'], jsDay: 1 },
  { names: ['mardi'], jsDay: 2 },
  { names: ['mercredi'], jsDay: 3 },
  { names: ['jeudi'], jsDay: 4 },
  { names: ['vendredi'], jsDay: 5 },
  { names: ['samedi'], jsDay: 6 },
  { names: ['dimanche'], jsDay: 0 },
]

/** Prochaine occurrence du jour de semaine (aujourd'hui inclus). */
function nextWeekday(todayIso: string, jsDay: number): string {
  const today = parseISODate(todayIso)
  const delta = (jsDay - today.getDay() + 7) % 7
  return addDays(todayIso, delta)
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Analyse `text` et retourne une suggestion partielle d'événement, ou null
 * si rien d'exploitable. `today` est la date du jour `YYYY-MM-DD` (injectée
 * pour la testabilité).
 */
export function parseEventSuggestion(
  text: string,
  today: string,
): Partial<CalendarEvent> | null {
  const raw = text.trim()
  if (raw === '') return null
  const norm = normalize(raw)
  let title = raw
  let date: string | undefined
  let startTime: string | undefined
  let recurrence: EventRecurrence | undefined

  const stripFromTitle = (pattern: RegExp) => {
    title = title.replace(pattern, ' ').replace(/\s{2,}/g, ' ').trim()
  }

  // ── Récurrence : « chaque jour / chaque <jour> / tous les <jour> / chaque mois »
  if (/\b(chaque|tous les)\s+jours?\b/.test(norm)) {
    recurrence = 'daily'
    stripFromTitle(/\b(chaque|tous les)\s+jours?\b/gi)
  } else if (/\b(chaque|tous les)\s+mois\b/.test(norm)) {
    recurrence = 'monthly'
    stripFromTitle(/\b(chaque|tous les)\s+mois\b/gi)
  } else {
    for (const wd of WEEKDAYS) {
      const re = new RegExp(`\\b(chaque|tous les)\\s+${wd.names[0]}s?\\b`)
      if (re.test(norm)) {
        recurrence = 'weekly'
        date = nextWeekday(today, wd.jsDay)
        stripFromTitle(new RegExp(`\\b(chaque|tous les)\\s+${wd.names[0]}s?\\b`, 'gi'))
        break
      }
    }
  }

  // ── Dates relatives
  if (!date) {
    if (/\baujourd'?hui\b/.test(norm)) {
      date = today
      stripFromTitle(/\baujourd'?hui\b/gi)
    } else if (/\bapres[- ]demain\b/.test(norm)) {
      date = addDays(today, 2)
      stripFromTitle(/\bapr[èe]s[- ]demain\b/gi)
    } else if (/\bdemain\b/.test(norm)) {
      date = addDays(today, 1)
      stripFromTitle(/\bdemain\b/gi)
    }
  }

  // ── Jour de semaine simple (« vendredi », « lundi prochain »)
  if (!date) {
    for (const wd of WEEKDAYS) {
      const reNext = new RegExp(`\\b${wd.names[0]}\\s+prochain\\b`)
      const re = new RegExp(`\\b${wd.names[0]}\\b`)
      if (reNext.test(norm)) {
        const base = nextWeekday(today, wd.jsDay)
        // « prochain » : si l'occurrence calculée est aujourd'hui, pousser d'une semaine
        date = base === today ? addDays(base, 7) : base
        stripFromTitle(new RegExp(`\\b${wd.names[0]}\\s+prochain\\b`, 'gi'))
        break
      }
      if (re.test(norm)) {
        const base = nextWeekday(today, wd.jsDay)
        date = base === today ? addDays(base, 7) : base
        stripFromTitle(new RegExp(`\\b${wd.names[0]}\\b`, 'gi'))
        break
      }
    }
  }

  // ── Date explicite JJ/MM ou JJ/MM/AAAA
  if (!date) {
    const m = norm.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/)
    if (m) {
      const dd = Number(m[1])
      const mm = Number(m[2])
      const todayDate = parseISODate(today)
      let yyyy = m[3] ? Number(m[3]) : todayDate.getFullYear()
      if (yyyy < 100) yyyy += 2000
      if (dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12) {
        const candidate = `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`
        // sans année explicite, une date passée bascule à l'année suivante
        date = !m[3] && candidate < today ? `${yyyy + 1}-${candidate.slice(5)}` : candidate
        stripFromTitle(new RegExp(m[0].replace(/\//g, '\\/'), 'g'))
      }
    }
  }

  // ── Heure : « 9h », « 13h30 », « 9:00 »
  const timeMatch = norm.match(/\b(\d{1,2})\s*(?:h|:)\s*(\d{2})?\b/)
  if (timeMatch) {
    const h = Number(timeMatch[1])
    const min = timeMatch[2] ? Number(timeMatch[2]) : 0
    if (h >= 0 && h <= 23 && min >= 0 && min <= 59) {
      startTime = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
      stripFromTitle(new RegExp(`\\b${timeMatch[1]}\\s*(?:h|:)\\s*(?:${timeMatch[2] ?? ''})?\\b`, 'gi'))
    }
  }

  // Rien d'exploitable : ni date, ni heure, ni récurrence → null
  if (!date && !startTime && !recurrence) return null

  // Titre nettoyé (mots de liaison résiduels en bordure)
  title = title.replace(/^[,;:à\-–\s]+|[,;:à\-–\s]+$/g, '').trim()
  if (title === '') title = 'Nouvel événement'
  else title = title.charAt(0).toUpperCase() + title.slice(1)

  return {
    title,
    date: date ?? today,
    ...(startTime ? { startTime } : {}),
    ...(recurrence ? { recurrence } : {}),
  }
}
