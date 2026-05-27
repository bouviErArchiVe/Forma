import { Suspense, useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/hooks/useAppearance'
import { GAMES, getGameById, loadGameComponent } from '@/data/games'
import { useGameScores } from '@/hooks/useGameScores'
import GameCard from '@/components/games/GameCard'
import BrandLogo from '@/components/BrandLogo'
import ModalOverlay from '@/components/ui/ModalOverlay'

function GameLoader({ gameId, T, onClose, bestScore, onSaveScore }) {
  const [Component, setComponent] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setComponent(null)
    setError(null)
    loadGameComponent(gameId)
      .then((m) => { if (!cancelled) setComponent(() => m.default) })
      .catch((e) => { if (!cancelled) setError(e.message) })
    return () => { cancelled = true }
  }, [gameId])

  if (error) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: T.muted }}>
        Impossible de charger le jeu.
        <button type="button" onClick={onClose} style={{ display: 'block', margin: '12px auto 0', padding: '8px 14px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, cursor: 'pointer' }}>Fermer</button>
      </div>
    )
  }

  if (!Component) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: T.muted, fontSize: 13 }}>
        Chargement du jeu…
      </div>
    )
  }

  return (
    <Component
      T={T}
      onClose={onClose}
      bestScore={bestScore}
      onSaveScore={onSaveScore}
    />
  )
}

export default function GamesPage() {
  const navigate = useNavigate()
  const { T } = useTheme()
  const { getBest, saveBest } = useGameScores()
  const [activeGameId, setActiveGameId] = useState(null)
  const [, bump] = useState(0)

  const activeGame = getGameById(activeGameId)

  const handleSaveScore = useCallback((gameId, score) => {
    saveBest(gameId, score)
    bump((n) => n + 1)
  }, [saveBest])

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.ink }}>
      <header style={{
        padding: '14px 20px',
        borderBottom: `1px solid ${T.border}`,
        background: T.surface,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        flexWrap: 'wrap',
      }}>
        <button type="button" onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: T.accent, fontWeight: 600 }}>
          ← Accueil
        </button>
        <BrandLogo T={T} size={26} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 17 }}>FPause</div>
          <div style={{ fontSize: 11, color: T.muted }}>Mini-jeux · détente rapide</div>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px 48px' }}>
        <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, margin: '0 0 22px', maxWidth: 520 }}>
          Un coin fun discret pour une mini-pause. Les jeux se chargent uniquement quand vous les ouvrez.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
          {GAMES.map((game) => (
            <GameCard
              key={game.id}
              T={T}
              game={game}
              bestScore={getBest(game.id)}
              onPlay={setActiveGameId}
            />
          ))}
        </div>
      </main>

      {activeGame && (
        <ModalOverlay onClose={() => setActiveGameId(null)}>
          <div style={{
            width: 'min(680px, 96vw)',
            maxHeight: '92vh',
            overflow: 'auto',
            padding: 20,
            borderRadius: 16,
            background: T.surface,
            border: `1px solid ${T.border}`,
            boxShadow: '0 20px 60px rgba(0,0,0,.2)',
          }}>
            <Suspense fallback={<div style={{ padding: 32, textAlign: 'center', color: T.muted }}>Chargement…</div>}>
              <GameLoader
                gameId={activeGame.id}
                T={T}
                onClose={() => setActiveGameId(null)}
                bestScore={getBest(activeGame.id)}
                onSaveScore={(score) => handleSaveScore(activeGame.id, score)}
              />
            </Suspense>
          </div>
        </ModalOverlay>
      )}
    </div>
  )
}
