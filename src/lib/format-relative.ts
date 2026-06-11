/** Date relative courte (fr). */
export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 0) return "À l'instant"
  const sec = Math.floor(diff / 1000)
  if (sec < 45) return "À l'instant"
  const min = Math.floor(sec / 60)
  if (min < 60) return `Il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `Il y a ${h} h`
  const d = Math.floor(h / 24)
  if (d === 1) return 'Hier'
  if (d < 7) return `Il y a ${d} j`
  if (d < 30) return `Il y a ${Math.floor(d / 7)} sem.`
  return new Date(ts).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
