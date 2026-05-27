/** Stats profil agrégées depuis les carnets locaux / store. */

export function computeProfileStats(notebooks = [], { friendsCount = 0, streak = 0, foldersCount = 0 } = {}) {
  const list = Array.isArray(notebooks) ? notebooks : []
  return {
    notebookCount: list.length,
    pageCount: list.reduce((sum, nb) => sum + (Number(nb.pages_count) || 1), 0),
    starredCount: list.filter((nb) => nb.starred).length,
    friendsCount: friendsCount || 0,
    foldersCount: foldersCount || 0,
    streak: streak || 0,
  }
}

export function streakLabel(streak) {
  if (!streak || streak < 1) return 'Commencez votre série'
  if (streak === 1) return '1 jour actif'
  return `${streak} jours d'affilée`
}
