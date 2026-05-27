/** FORMATCAL — rappels locaux */

const fired = new Set()

export async function requestNotificationPermission() {
  if (typeof Notification === 'undefined') return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

export function checkReminders(events, onNotify) {
  const now = Date.now()
  events.forEach((ev) => {
    if (ev.completed || ev.status === 'done') return
    const offsets = ev.reminderOffsets || []
    offsets.forEach((min) => {
      const triggerAt = ev.startAt - min * 60000
      const key = `${ev.id}_${min}`
      if (now >= triggerAt && now < ev.startAt && !fired.has(key)) {
        fired.add(key)
        const msg = min >= 1440 ? 'Demain' : min >= 60 ? `Dans ${Math.round(min / 60)} h` : `Dans ${min} min`
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
              icon: '/favicon.ico',
            })
          } catch { /* ignore */ }
        }
      }
    })
  })
}

export function startReminderLoop(eventsRef, onNotify, intervalMs = 30000) {
  const id = setInterval(() => {
    const events = typeof eventsRef === 'function' ? eventsRef() : eventsRef
    if (events?.length) checkReminders(events, onNotify)
  }, intervalMs)
  return () => clearInterval(id)
}

export function clearFiredReminders() {
  fired.clear()
}
