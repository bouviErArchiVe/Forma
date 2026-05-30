import { useEffect, useState } from 'react'
import type { FormaCombinePage } from '../../types'
import { pageToDataUrl } from '../../lib/formacombine/render'

interface CombinePreviewProps {
  page: FormaCombinePage | null
  pageNumber: number | null
}

export function CombinePreview({ page, pageNumber }: CombinePreviewProps) {
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!page) {
      setPreview(null)
      return
    }
    void pageToDataUrl(page, { pageNumber }).then((url) => {
      if (!cancelled) setPreview(url)
    })
    return () => {
      cancelled = true
    }
  }, [page, pageNumber])

  if (!page) {
    return (
      <div className="flex-1 flex items-center justify-center text-forma-muted text-sm">
        Sélectionnez une page ou déposez des fichiers
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto flex items-center justify-center p-6 bg-[#0a0c10]">
      {preview ? (
        <img
          src={preview}
          alt={page.name}
          className="max-w-full max-h-full object-contain shadow-2xl rounded"
        />
      ) : (
        <span className="text-forma-muted">Chargement…</span>
      )}
    </div>
  )
}
