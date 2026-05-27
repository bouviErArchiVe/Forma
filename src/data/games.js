export const GAMES = [
  {
    id: 'dino',
    title: 'Dino Run',
    icon: '🦖',
    description: 'Saute les cactus — espace ou toucher.',
    hint: 'Espace / clic / toucher pour sauter',
  },
  {
    id: 'snake',
    title: 'Snake',
    icon: '🐍',
    description: 'Mange les pommes sans te mordre.',
    hint: 'Flèches ou swipe pour diriger',
  },
  {
    id: 'pong',
    title: 'Pong',
    icon: '🏓',
    description: 'Raquette vs IA — premier à 5 points.',
    hint: 'Souris / toucher pour déplacer la raquette',
  },
  {
    id: 'bounce',
    title: 'Ball Bounce',
    icon: '⚽',
    description: 'Garde la balle en l\'air le plus longtemps possible.',
    hint: 'Déplace la raquette sous la balle',
  },
  {
    id: 'breakout',
    title: 'Breakout',
    icon: '🧱',
    description: 'Casse toutes les briques.',
    hint: 'Flèches ou souris pour la raquette',
  },
]

export function getGameById(id) {
  return GAMES.find((g) => g.id === id) || null
}

export function loadGameComponent(id) {
  switch (id) {
    case 'dino': return import('@/games/DinoGame')
    case 'snake': return import('@/games/SnakeGame')
    case 'pong': return import('@/games/PongGame')
    case 'bounce': return import('@/games/BallBounceGame')
    case 'breakout': return import('@/games/BreakoutGame')
    default: return Promise.reject(new Error('Unknown game'))
  }
}
