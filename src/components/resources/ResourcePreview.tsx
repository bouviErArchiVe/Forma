/**
 * ResourcePreview — panneau de détail d'une ressource graphique : grand
 * aperçu SVG, description, tags, avertissement, copie SVG et rappel
 * d'insertion via la bibliothèque de blocs.
 */
import { Icon } from '../ui/Icon'
import { blockToSvg } from '../../lib/blocks/types'
import { resourceToBlock } from '../../lib/resources/resourceToBlock'
import { RESOURCE_TYPE_LABELS, type GraphicResource } from '../../lib/resources/resourceTypes'
import { useToastStore } from '../../stores/toastStore'

export function ResourcePreview({
  resource,
  insertTabLabel,
}: {
  resource: GraphicResource | null
  /** Libellé de l'onglet de la bibliothèque de blocs (rappel d'insertion). */
  insertTabLabel?: string
}) {
  if (!resource) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center py-12">
        <Icon name="layout" className="w-8 h-8 text-forma-muted mb-2" />
        <p className="text-sm text-forma-muted max-w-sm">Sélectionnez une ressource pour voir son aperçu, ses tags et comment l’insérer dans un dessin.</p>
      </div>
    )
  }

  const copySvg = async () => {
    try {
      await navigator.clipboard.writeText(blockToSvg(resourceToBlock(resource), { stroke: '#1f2937' }))
      useToastStore.getState().show('Ressource copiée (SVG)')
    } catch {
      useToastStore.getState().show('Copie impossible')
    }
  }

  const copyMarkdown = async () => {
    const md = [
      `## ${resource.name}`,
      '',
      resource.description,
      resource.notes ? `\n**Notes :** ${resource.notes}` : '',
      resource.tags.length ? `\n**Tags :** ${resource.tags.join(', ')}` : '',
      resource.disclaimer ? `\n*${resource.disclaimer}*` : '',
    ].filter(Boolean).join('\n')
    try {
      await navigator.clipboard.writeText(md)
      useToastStore.getState().show('Ressource copiée (Markdown)')
    } catch {
      useToastStore.getState().show('Copie impossible')
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-lg font-semibold text-forma-text">{resource.name}</h2>
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" onClick={() => void copySvg()} title="Copier (SVG)" className="p-1 text-forma-muted hover:text-forma-accent"><Icon name="copy" className="w-4 h-4" /></button>
          <button type="button" onClick={() => void copyMarkdown()} title="Copier (Markdown)" className="p-1 text-forma-muted hover:text-forma-accent"><Icon name="file-text" className="w-4 h-4" /></button>
        </div>
      </div>
      <p className="text-[10px] uppercase tracking-wide text-forma-accent mb-3">
        <span className="text-forma-muted">{RESOURCE_TYPE_LABELS[resource.type]}</span>
        <span className="mx-1 text-forma-muted">·</span>
        {resource.categoryLabel}
      </p>
      <div
        className="border border-forma-border rounded-xl p-4 bg-forma-surface mb-3 w-full max-w-sm h-44 flex items-center justify-center text-forma-text [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto"
        dangerouslySetInnerHTML={{ __html: blockToSvg(resourceToBlock(resource), { stroke: 'currentColor' }) }}
      />
      <p className="text-sm text-forma-text leading-relaxed mb-2">{resource.description}</p>
      {resource.notes && (
        <p className="text-xs text-forma-muted leading-relaxed mb-2"><span className="font-medium text-forma-text">Notes :</span> {resource.notes}</p>
      )}
      <div className="flex flex-wrap gap-1 mb-3">
        {resource.tags.map((t) => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-forma-bg text-forma-muted">{t}</span>)}
      </div>
      {resource.disclaimer && (
        <div className="p-2.5 rounded-lg border border-amber-300/50 bg-amber-50 dark:bg-amber-950/20 text-[11px] text-amber-700 dark:text-amber-300 inline-flex items-start gap-1.5 mb-3">
          <Icon name="alert" className="w-3.5 h-3.5 shrink-0 mt-px" />
          {resource.disclaimer}
        </div>
      )}
      {resource.insertable && insertTabLabel && (
        <p className="text-[11px] text-forma-muted">Pour insérer cette ressource dans un dessin, ouvrez un carnet puis la bibliothèque de blocs (onglet « {insertTabLabel} »).</p>
      )}
    </div>
  )
}
