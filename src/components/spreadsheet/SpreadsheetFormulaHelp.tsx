const EXAMPLES = [
  { label: 'Additionner deux cellules', formula: '=A1+A2' },
  { label: 'Somme d\'une plage', formula: '=SOMME(A1:A10)' },
  { label: 'Moyenne', formula: '=MOYENNE(A1:A10)' },
  { label: 'Minimum', formula: '=MIN(A1:A10)' },
  { label: 'Maximum', formula: '=MAX(A1:A10)' },
]

interface SpreadsheetFormulaHelpProps {
  open: boolean
  onClose: () => void
}

export function SpreadsheetFormulaHelp({ open, onClose }: SpreadsheetFormulaHelpProps) {
  if (!open) return null

  return (
    <div className="mb-2 p-3 rounded-xl border border-forma-border/50 bg-forma-surface text-xs">
      <div className="flex justify-between items-center mb-2">
        <strong>Aide — Formules</strong>
        <button type="button" onClick={onClose} className="text-forma-muted hover:text-forma-text">
          ×
        </button>
      </div>
      <p className="text-forma-muted mb-2">
        Commencez par <code className="bg-white/50 px-1 rounded">=</code>. Fonctions FR : SOMME,
        MOYENNE, MIN, MAX, COMPTER.
      </p>
      <ul className="list-disc pl-4 space-y-1">
        {EXAMPLES.map((ex) => (
          <li key={ex.formula}>
            <span className="text-forma-muted">{ex.label} : </span>
            <code className="font-mono bg-white/50 px-1 rounded">{ex.formula}</code>
          </li>
        ))}
      </ul>
    </div>
  )
}
