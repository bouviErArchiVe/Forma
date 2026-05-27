/** Aide formules — menu simple pour Forma Sheets. */

const EXAMPLES = [
  { label: 'Additionner deux cellules', formula: '=A1+A2' },
  { label: 'Soustraire', formula: '=A1-A2' },
  { label: 'Multiplier', formula: '=A1*A2' },
  { label: 'Diviser', formula: '=A1/A2' },
  { label: 'Somme d\'une plage', formula: '=SOMME(A1:A10)' },
  { label: 'Moyenne', formula: '=MOYENNE(A1:A10)' },
  { label: 'Minimum', formula: '=MIN(A1:A10)' },
  { label: 'Maximum', formula: '=MAX(A1:A10)' },
]

export default function SpreadsheetFormulaHelp({ T, open, onClose }) {
  if (!open) return null

  return (
    <div style={{
      marginBottom: 8, padding: '10px 12px', borderRadius: 8,
      border: `1px solid ${T.border}`, background: T.surface,
      fontSize: 11, lineHeight: 1.55, color: T.ink,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <strong style={{ fontFamily: "'Syne',sans-serif", fontSize: 12 }}>Aide — Formules</strong>
        <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 16 }}>×</button>
      </div>
      <p style={{ margin: '0 0 8px', color: T.muted }}>
        Commencez par <code style={{ background: T.bg, padding: '1px 4px', borderRadius: 4 }}>=</code>.
        La cellule affiche le résultat ; la formule reste visible dans la barre de formule.
      </p>
      <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
        {EXAMPLES.map((ex) => (
          <li key={ex.formula} style={{ marginBottom: 4 }}>
            <span style={{ color: T.muted }}>{ex.label} : </span>
            <code style={{ background: T.bg, padding: '1px 5px', borderRadius: 4, color: T.ink, fontFamily: 'monospace' }}>{ex.formula}</code>
          </li>
        ))}
      </ul>
      <p style={{ margin: '8px 0 0', fontSize: 10, color: T.muted }}>
        Références : A1, B2, C3… · Plages : A1:A5 · Fonctions FR : SOMME, MOYENNE, MIN, MAX, COMPTER
      </p>
    </div>
  )
}
