/** FPause — catalogue des mini-jeux (chargés à la demande). */

export interface GameDef {
  id: string
  title: string
  icon: string
  description: string
  hint: string
}

export const GAMES: GameDef[] = [
  { id: 'dino', title: 'Dino Run', icon: '🦖', description: 'Saute les cactus — espace ou toucher.', hint: 'Espace / clic / toucher pour sauter' },
  { id: 'snake', title: 'Snake', icon: '🐍', description: 'Mange les pommes sans te mordre.', hint: 'Flèches ou swipe pour diriger' },
  { id: 'pong', title: 'Pong', icon: '🏓', description: 'Raquette vs IA — premier à 5 points.', hint: 'Souris / toucher pour la raquette gauche' },
  { id: 'bounce', title: 'Ball Bounce', icon: '⚽', description: "Garde la balle en l'air le plus longtemps.", hint: 'Déplace la raquette sous la balle' },
  { id: 'breakout', title: 'Breakout', icon: '🧱', description: 'Casse toutes les briques.', hint: 'Flèches ou souris pour la raquette' },
]

export function getGameById(id: string | null): GameDef | null {
  return GAMES.find((g) => g.id === id) ?? null
}
