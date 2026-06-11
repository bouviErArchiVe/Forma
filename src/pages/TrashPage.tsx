import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { formatRelativeTime } from '../lib/format-relative'
import { confirm } from '../stores/confirmStore'
import { useToastStore } from '../stores/toastStore'
import {
  emptyTrash,
  getTrashNotebooks,
  permanentDeleteNotebook,
  purgeTrashOlderThan,
  restoreNotebook,
} from '../services/library'
import type { Notebook } from '../types'

export function TrashPage() {
  const [items, setItems] = useState<Notebook[]>([])
  const [query, setQuery] = useState('')

  const load = async () => setItems(await getTrashNotebooks())

  useEffect(() => {
    void purgeTrashOlderThan(30).then((n) => {
      if (n > 0) load()
    })
    load()
  }, [])

  return (
    <div className="min-h-full p-6 max-w-4xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-forma-muted hover:text-forma-accent transition-colors mb-6">
        <Icon name="chevron-left" className="w-4 h-4" />
        Bibliothèque
      </Link>
      <div className="flex items-center justify-between mt-4 mb-4 gap-3 flex-wrap">
        <h1 className="text-xl font-semibold">
          Corbeille ({items.length})
        </h1>
        {items.length > 0 && (
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrer…"
            className="text-sm border rounded-lg px-3 py-1.5 max-w-xs"
          />
        )}
        {items.length > 0 && (
          <>
          <button
            type="button"
            className="text-sm px-3 py-1.5 border border-forma-border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            onClick={async () => {
              for (const nb of items) await restoreNotebook(nb.id)
              useToastStore.getState().show(`${items.length} élément(s) restauré(s)`)
              load()
            }}
          >
            Tout restaurer
          </button>
          <button
            type="button"
            className="text-sm px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
            onClick={async () => {
              if (
                !(await confirm(
                  `Vider la corbeille (${items.length} élément(s)) ? Action irréversible.`,
                  {
                  title: 'Vider la corbeille',
                    danger: true,
                    confirmLabel: 'Tout supprimer',
                  },
                ))
              )
                return
              await emptyTrash()
              load()
            }}
          >
            Vider la corbeille
          </button>
          </>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-forma-muted">Corbeille vide</p>
      ) : (
        <ul className="space-y-2">
          {items
            .filter((nb) => !query.trim() || nb.name.toLowerCase().includes(query.toLowerCase()))
            .map((nb) => (
            <li key={nb.id} className="flex items-center gap-3 p-3 border border-forma-border rounded-xl bg-forma-surface hover:shadow-sm transition-shadow">
              <div className="w-8 h-10 rounded shrink-0" style={{ backgroundColor: nb.coverColor }} />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{nb.name}</p>
                {nb.deletedAt && (
                  <p className="text-xs text-forma-muted" title={new Date(nb.deletedAt).toLocaleString('fr-FR')}>
                    Supprimé {formatRelativeTime(nb.deletedAt)}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="text-sm text-forma-accent shrink-0"
                onClick={async () => {
                  await restoreNotebook(nb.id)
                  useToastStore.getState().show(`« ${nb.name} » restauré`)
                  load()
                }}
              >
                Restaurer
              </button>
              <button
                type="button"
                className="text-sm text-red-600 shrink-0"
                onClick={async () => {
                  if (
                    await confirm(`Supprimer définitivement « ${nb.name} » ?`, {
                      danger: true,
                      confirmLabel: 'Supprimer',
                    })
                  ) {
                    await permanentDeleteNotebook(nb.id)
                    load()
                  }
                }}
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
