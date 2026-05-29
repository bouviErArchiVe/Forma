import { useNavigate } from 'react-router-dom'
import { TemplatePreview } from '../components/library/TemplatePreview'
import { TEMPLATE_PACKS } from '../lib/template-gallery'
import { createNotebook } from '../services/library'
import { useLibraryStore } from '../stores/libraryStore'

export function TemplatesPage() {
  const navigate = useNavigate()
  const currentFolderId = useLibraryStore((s) => s.currentFolderId)

  const categories = ['study', 'work', 'creative', 'planner'] as const
  const catLabels: Record<(typeof categories)[number], string> = {
    study: 'Études',
    work: 'Travail',
    creative: 'Créatif',
    planner: 'Planning',
  }

  return (
    <div className="min-h-full p-4 max-w-4xl mx-auto">
      <button type="button" onClick={() => navigate('/')} className="text-sm text-forma-accent">
        ← Bibliothèque
      </button>
      <h1 className="text-2xl font-bold mt-4 mb-2">Galerie de modèles</h1>
      <p className="text-sm text-forma-muted mb-6">
        Modèles de pages Forma — les modèles premium sont inclus gratuitement en local.
      </p>

      {categories.map((cat) => (
        <section key={cat} className="mb-8">
          <h2 className="text-sm font-semibold uppercase text-forma-muted mb-3">
            {catLabels[cat]}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {TEMPLATE_PACKS.filter((p) => p.category === cat).map((pack) => (
              <button
                key={pack.id}
                type="button"
                onClick={async () => {
                  const nb = await createNotebook({
                    name: pack.name,
                    folderId: currentFolderId,
                    coverColor: '#3b82f6',
                    paperTemplate: pack.template,
                    orientation: 'portrait',
                  })
                  navigate(`/document/${nb.id}`)
                }}
                className="text-left p-4 rounded-xl border border-forma-border bg-forma-surface hover:shadow-md transition"
              >
                <TemplatePreview template={pack.template} />
                <p className="font-medium text-sm">{pack.name}</p>
                <p className="text-xs text-forma-muted mt-1">{pack.description}</p>
                {pack.premium && (
                  <span className="inline-block mt-2 text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                    Pro
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
