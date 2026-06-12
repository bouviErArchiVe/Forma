/**
 * PauseModule — Pause V2 : minuteur focus + 5 mini-jeux canvas.
 * Meilleurs scores persistés dans moduleData.
 */
import { useState } from 'react'
import { Icon } from '../../components/ui/Icon'
import type { ModuleProps } from '../ModuleHost'
import { FocusTimer } from './FocusTimer'
import { GameCanvas } from './GameCanvas'
import { GAMES, updateBestScore } from './games/core'

interface PauseState {
  v: 1
  bestScores: Record<string, number>
  focus: { lastDuration: number }
}

function parseState(json: string): PauseState {
  const empty: PauseState = { v: 1, bestScores: {}, focus: { lastDuration: 25 } }
  if (json.trim() === '') return empty
  try {
    const parsed = JSON.parse(json) as Partial<PauseState>
    return {
      v: 1,
      bestScores:
        parsed.bestScores && typeof parsed.bestScores === 'object' ? parsed.bestScores : {},
      focus:
        parsed.focus && typeof parsed.focus.lastDuration === 'number'
          ? { lastDuration: parsed.focus.lastDuration }
          : { lastDuration: 25 },
    }
  } catch {
    return empty
  }
}

type Tab = 'timer' | 'games'

export function PauseModule({ data, onDataChange }: ModuleProps) {
  const [state, setState] = useState<PauseState>(() => parseState(data))
  const [tab, setTab] = useState<Tab>('timer')
  const [activeGameId, setActiveGameId] = useState<string | null>(null)

  const update = (next: PauseState) => {
    setState(next)
    onDataChange(JSON.stringify(next))
  }

  const activeGame = GAMES.find((g) => g.id === activeGameId)

  return (
    <div className="h-full overflow-y-auto min-h-0">
      <div className="max-w-2xl mx-auto p-6">
        {/* ── Onglets ───────────────────────────────────────────────────────── */}
        <div className="flex justify-center gap-1 mb-6">
          {(
            [
              { id: 'timer', label: 'Minuteur focus', icon: 'zap' },
              { id: 'games', label: 'Mini-jeux', icon: 'layout' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`text-xs px-4 py-1.5 rounded-lg border transition-colors inline-flex items-center gap-1.5 ${
                tab === t.id
                  ? 'border-forma-accent text-forma-accent bg-forma-accent/10 font-medium'
                  : 'border-forma-border text-forma-muted hover:border-forma-accent/50'
              }`}
            >
              <Icon name={t.icon} className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'timer' && (
          <FocusTimer
            lastDuration={state.focus.lastDuration}
            onDurationChange={(minutes) => update({ ...state, focus: { lastDuration: minutes } })}
          />
        )}

        {tab === 'games' && !activeGame && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {GAMES.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setActiveGameId(g.id)}
                className="text-left p-4 rounded-xl border border-forma-border bg-forma-surface hover:border-forma-accent/60 transition-colors"
              >
                <p className="text-sm font-semibold text-forma-text mb-0.5">{g.name}</p>
                <p className="text-xs text-forma-muted mb-2">{g.description}</p>
                <p className="text-[10px] text-forma-muted">
                  {state.bestScores[g.id]
                    ? `Meilleur score : ${state.bestScores[g.id]}`
                    : 'Jamais joué'}
                </p>
              </button>
            ))}
          </div>
        )}

        {tab === 'games' && activeGame && (
          <div>
            <button
              type="button"
              onClick={() => setActiveGameId(null)}
              className="text-xs text-forma-muted hover:text-forma-accent inline-flex items-center gap-1 mb-3"
            >
              <Icon name="chevron-left" className="w-3.5 h-3.5" />
              Tous les jeux
            </button>
            <GameCanvas
              game={activeGame}
              bestScore={state.bestScores[activeGame.id] ?? 0}
              onGameOver={(score) => {
                const bestScores = updateBestScore(state.bestScores, activeGame.id, score)
                if (bestScores !== state.bestScores) update({ ...state, bestScores })
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
