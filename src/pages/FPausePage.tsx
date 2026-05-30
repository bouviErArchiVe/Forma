import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type LazyExoticComponent,
} from 'react'
import { Link } from 'react-router-dom'
import { BrandLogo } from '../components/BrandLogo'
import { GameCard } from '../components/games/GameCard'
import { GAMES, getGameById } from '../lib/games/catalog'
import { getBest, readScores, saveBest, type GameScores } from '../lib/games/scores'
import { readGameTheme, type GameProps } from '../games/theme'

type GameComponent = ComponentType<GameProps>

const GAME_COMPONENTS: Record<string, LazyExoticComponent<GameComponent>> = {
  dino: lazy(() => import('../games/DinoGame')),
  snake: lazy(() => import('../games/SnakeGame')),
  pong: lazy(() => import('../games/PongGame')),
  bounce: lazy(() => import('../games/BallBounceGame')),
  breakout: lazy(() => import('../games/BreakoutGame')),
}

export function FPausePage() {
  const [activeGameId, setActiveGameId] = useState<string | null>(null)
  const [scores, setScores] = useState<GameScores>(() => readScores())
  const theme = useMemo(() => readGameTheme(), [activeGameId])

  const activeGame = getGameById(activeGameId)
  const ActiveComponent = activeGameId ? GAME_COMPONENTS[activeGameId] : null

  const handleSaveScore = useCallback((gameId: string, score: number) => {
    setScores((prev) => saveBest(gameId, score, prev))
  }, [])

  const close = useCallback(() => setActiveGameId(null), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeGameId) setActiveGameId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeGameId])

  return (
    <div className="min-h-full flex flex-col max-w-3xl mx-auto w-full p-4">
      <header className="forma-glass-header rounded-xl px-4 py-3 mb-6 flex flex-wrap items-center gap-3 border border-forma-border/50">
        <BrandLogo size="sm" subtitle="FPause" />
        <div className="flex-1" />
        <Link to="/" className="text-sm text-forma-accent hover:underline">
          ← Bibliothèque
        </Link>
      </header>

      <p className="text-sm text-forma-muted leading-relaxed mb-5 max-w-lg">
        Un coin détente discret pour une mini-pause. Les jeux se chargent uniquement à l'ouverture
        et tournent entièrement hors-ligne. Records gardés sur cet appareil.
      </p>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3.5">
        {GAMES.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            bestScore={getBest(game.id, scores)}
            onPlay={setActiveGameId}
          />
        ))}
      </div>

      {activeGame && ActiveComponent && (
        <div
          className="fixed inset-0 z-[3000] bg-black/60 flex items-start justify-center p-4 pt-[8vh] overflow-auto"
          onClick={close}
          role="presentation"
        >
          <div
            className="forma-glass-panel w-[min(680px,96vw)] max-h-[92dvh] overflow-auto p-5 rounded-2xl border border-forma-border/60 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Suspense
              fallback={<div className="py-8 text-center text-forma-muted text-sm">Chargement…</div>}
            >
              <ActiveComponent
                T={theme}
                onClose={close}
                bestScore={getBest(activeGame.id, scores)}
                onSaveScore={(score) => handleSaveScore(activeGame.id, score)}
              />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  )
}
