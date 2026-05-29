import { useCallback, useEffect, useState } from 'react'
import { downloadShareBundle, exportShareBundle } from '../../../lib/share-bundle'
import {
  createShareLink,
  deleteShareLink,
  getShareLinks,
  shareUrl,
} from '../../../services/share'
import { getNotebook } from '../../../services/library'
import { useToastStore } from '../../../stores/toastStore'
import type { ShareLink } from '../../../types'

export function SharePanel({ notebookId }: { notebookId: string }) {
  const [links, setLinks] = useState<ShareLink[]>([])
  const [copied, setCopied] = useState('')
  const [exporting, setExporting] = useState('')

  const load = useCallback(async () => {
    setLinks(await getShareLinks(notebookId))
  }, [notebookId])

  useEffect(() => {
    load()
  }, [load])

  const create = async (perm: 'view' | 'edit') => {
    const link = await createShareLink(notebookId, perm)
    await load()
    const url = shareUrl(link.token)
    await navigator.clipboard.writeText(url)
    setCopied(url)
    useToastStore.getState().show('Lien copié dans le presse-papiers')
  }

  const copyLink = async (token: string) => {
    const url = shareUrl(token)
    await navigator.clipboard.writeText(url)
    setCopied(url)
    useToastStore.getState().show('Lien copié')
  }

  const exportPack = async (link: ShareLink) => {
    setExporting(link.id)
    try {
      const nb = await getNotebook(notebookId)
      const blob = await exportShareBundle(notebookId, link)
      downloadShareBundle(blob, `${nb?.name ?? 'carnet'}-partage`)
    } finally {
      setExporting('')
    }
  }

  return (
    <div className="space-y-3 text-sm">
      <h3 className="font-medium">Collaboration</h3>
      <p className="text-xs text-forma-muted">
        Liens locaux (même navigateur). Exportez un <strong>pack portable</strong> (.forma-share.zip)
        pour ouvrir le lien sur un autre appareil après import dans Paramètres.
      </p>
      <button type="button" onClick={() => create('view')} className="w-full py-1.5 border rounded">
        Lien lecture seule
      </button>
      <button type="button" onClick={() => create('edit')} className="w-full py-1.5 bg-forma-accent text-white rounded">
        Lien édition
      </button>
      {copied && <p className="text-xs text-green-600 break-all">Copié : {copied}</p>}
      <ul className="text-xs space-y-2 max-h-48 overflow-y-auto">
        {links.map((l) => (
          <li key={l.id} className="p-2 border border-forma-border rounded">
            <p className="font-medium">{l.permission === 'edit' ? 'Édition' : 'Lecture'}</p>
            <p className="truncate text-forma-muted">{shareUrl(l.token)}</p>
            <div className="flex flex-wrap gap-2 mt-1">
              <button type="button" className="text-forma-accent" onClick={() => copyLink(l.token)}>
                Copier
              </button>
              <button
                type="button"
                className="text-forma-accent"
                disabled={exporting === l.id}
                onClick={() => void exportPack(l)}
              >
                {exporting === l.id ? '…' : 'Pack portable'}
              </button>
              <button
                type="button"
                className="text-red-600"
                onClick={async () => {
                  await deleteShareLink(l.id)
                  load()
                }}
              >
                Révoquer
              </button>
            </div>
          </li>
        ))}
        {links.length === 0 && <li className="text-forma-muted">Aucun lien actif</li>}
      </ul>
    </div>
  )
}
