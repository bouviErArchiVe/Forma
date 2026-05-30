import type { ReactNode } from 'react'
import type { GameTheme } from './theme'

interface GameShellProps {
  T: GameTheme
  title: string
  hint?: string
  score: number | string
  best?: number
  onClose: () => void
  children: ReactNode
}

export function GameShell({ title, hint, score, best = 0, onClose, children }: GameShellProps) {
  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="font-bold text-base text-forma-text">{title}</div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-forma-muted">
            Score <strong className="text-forma-text">{score}</strong>
          </span>
          {best > 0 && <span className="text-[11px] text-forma-accent">Record {best}</span>}
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-forma-border/60 text-[11px] text-forma-muted hover:text-forma-text"
          >
            Fermer ✕
          </button>
        </div>
      </div>
      <div
        className="rounded-xl overflow-hidden border border-forma-border/60 bg-forma-bg flex justify-center"
        style={{ touchAction: 'none' }}
      >
        {children}
      </div>
      {hint && <p className="m-0 text-[11px] text-forma-muted text-center">{hint}</p>}
    </div>
  )
}
