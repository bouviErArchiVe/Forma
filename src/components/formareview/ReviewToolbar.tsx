import type { FormaReviewRole, FormaReviewTool } from '../../types'
import { MARKUP_COLORS, REVIEW_TOOLS } from '../../lib/formareview/constants'

interface ReviewToolbarProps {
  tool: FormaReviewTool
  onToolChange: (tool: FormaReviewTool) => void
  color: string
  onColorChange: (color: string) => void
  role: FormaReviewRole
  onRoleChange: (role: FormaReviewRole) => void
}

export function ReviewToolbar({
  tool,
  onToolChange,
  color,
  onColorChange,
  role,
  onRoleChange,
}: ReviewToolbarProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-forma-panel border-b border-forma-border/50 flex-wrap">
      <span className="text-[11px] text-forma-muted mr-1">Outils</span>
      {Object.values(REVIEW_TOOLS).map((t) => (
        <button
          key={t.id}
          type="button"
          title={t.label}
          onClick={() => onToolChange(t.id)}
          className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center gap-1 ${
            tool === t.id
              ? 'bg-forma-accent text-white border-forma-accent'
              : 'bg-forma-surface border-forma-border text-forma-ink'
          }`}
        >
          <span>{t.icon}</span>
          <span>{t.label}</span>
        </button>
      ))}

      <div className="w-px h-6 bg-forma-border mx-1" />

      <span className="text-[11px] text-forma-muted">Couleur</span>
      {MARKUP_COLORS.slice(0, 5).map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onColorChange(c)}
          className="w-5 h-5 rounded-full shrink-0"
          style={{
            background: c,
            border: color === c ? '2px solid white' : '2px solid transparent',
          }}
        />
      ))}

      <div className="w-px h-6 bg-forma-border mx-1" />

      <span className="text-[11px] text-forma-muted">Rôle</span>
      <select
        value={role}
        onChange={(e) => onRoleChange(e.target.value as FormaReviewRole)}
        className="px-2 py-1 rounded-md border border-forma-border bg-forma-surface text-xs"
      >
        <option value="prof">Professeur</option>
        <option value="student">Étudiant</option>
        <option value="team">Équipe</option>
        <option value="jury">Jury</option>
      </select>
    </div>
  )
}
