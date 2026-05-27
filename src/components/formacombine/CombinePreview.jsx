import { useEffect, useState } from 'react'
import { FCMB_DARK } from '@/lib/formacombine/constants'
import { pageToDataUrl } from '@/lib/formacombine/render'

export default function CombinePreview({ page, pageNumber }) {
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    let cancelled = false
    if (!page) { setPreview(null); return undefined }
    pageToDataUrl(page, { pageNumber }).then((url) => {
      if (!cancelled) setPreview(url)
    })
    return () => { cancelled = true }
  }, [page, pageNumber])

  if (!page) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: FCMB_DARK.muted, fontSize: 14,
      }}>
        Sélectionnez une page ou déposez des fichiers
      </div>
    )
  }

  return (
    <div style={{
      flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, background: '#0a0c10',
    }}>
      {preview ? (
        <img
          src={preview}
          alt={page.name}
          style={{
            maxWidth: '100%', maxHeight: '100%', objectFit: 'contain',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)', borderRadius: 4,
          }}
        />
      ) : (
        <span style={{ color: FCMB_DARK.muted }}>Chargement…</span>
      )}
    </div>
  )
}
