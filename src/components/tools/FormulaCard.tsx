import type { FormulaDef } from '../../lib/formulas/types'

interface FormulaCardProps {
  formula: FormulaDef
  favorite?: boolean
  onOpen: () => void
  categoryLabel?: string
}

export function FormulaCard({ formula, favorite, onOpen, categoryLabel }: FormulaCardProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="text-left p-4 rounded-xl forma-glass-card hover:shadow-md transition-all w-full"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{formula.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm truncate">{formula.title}</h3>
            {favorite && <span className="text-amber-400 text-xs">★</span>}
          </div>
          <p className="text-xs text-forma-muted mt-1 line-clamp-2">{formula.description}</p>
          <p className="text-[10px] font-mono text-forma-accent/80 mt-2 truncate">{formula.formulaText}</p>
          {categoryLabel && (
            <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-forma-accent/10 text-forma-accent">
              {categoryLabel}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
