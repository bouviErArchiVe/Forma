import type { GameDef } from '../../lib/games/catalog'

interface GameCardProps {
  game: GameDef
  bestScore: number
  onPlay: (id: string) => void
}

export function GameCard({ game, bestScore, onPlay }: GameCardProps) {
  return (
    <button
      type="button"
      onClick={() => onPlay(game.id)}
      className="forma-glass-panel text-left p-4 rounded-2xl border border-forma-border/50 hover:border-forma-accent/50 hover:-translate-y-0.5 transition-all w-full"
    >
      <div className="text-4xl mb-2.5">{game.icon}</div>
      <div className="font-bold text-[15px] text-forma-text mb-1.5">{game.title}</div>
      <div className="text-[11px] text-forma-muted leading-relaxed mb-3 min-h-[34px]">
        {game.description}
      </div>
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-forma-accent font-bold">▶ Jouer</span>
        {bestScore > 0 && <span className="text-[10px] text-forma-muted">Record : {bestScore}</span>}
      </div>
    </button>
  )
}
