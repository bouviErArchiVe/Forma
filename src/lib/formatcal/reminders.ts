import type { FormaCalEvent } from '../../types'

const fired = new Set<string>()

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof Notification === 'undefined') return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

export function checkReminders(
  events: FormaCalEvent[],
  onNotify?: (payload: { title: string; body: string; event: FormaCalEvent }) => void,
): void {
  const now = Date.now()
  events.forEach((ev) => {
    if (ev.completed || ev.status === 'done') return
    const offsets = ev.reminderOffsets || []
    offsets.forEach((min) => {
      const triggerAt = ev.startAt - min * 60000
      const key = `${ev.id}_${min}`
      if (now >= triggerAt && now < ev.startAt && !fired.has(key)) {
        fired.add(key)
        const msg =
          min >= 1440 ? 'Demain' : min >= 60 ? `Dans ${Math.round(min / 60)} h` : `Dans ${min} min`
        onNotify?.({
          title: ev.title,
          body: `${msg} · ${ev.description || ''}`.trim(),
          event: ev,
        })
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          try {
            new Notification(`FormatCal — ${ev.title}`, {
              body: msg,
              tag: key,
            })
          } catch {
            /* ignore */
          }
        }
      }
    })
  })
}

export function startReminderLoop(
  eventsRef: () => FormaCalEvent[],
  onNotify?: (payload: { title: string; body: string; event: FormaCalEvent }) => void,
  intervalMs = 30000,
): () => void {
  const id = setInterval(() => {
    const events = eventsRef()
    if (events.length) checkReminders(events, onNotify)
  }, intervalMs)
  return () => clearInterval(id)
}

export function clearFiredReminders(): void {
  fired.clear()
}
