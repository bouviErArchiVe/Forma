import { useDocLive } from '@/hooks/useDocLive'
import DocPreview from '@/components/docs/DocPreview'
import { PAGE_W, PAGE_H } from '@/lib/docs/model'

export default function DocPlacedView({ el, width, height }) {
  const doc = useDocLive(el?.docId)

  if (el?.mode === 'image' && el?.imageSrc) {
    return (
      <img src={el.imageSrc} alt={el.l || 'Document'} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none' }} />
    )
  }

  if (!doc) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6f8', border: '1px dashed #bbb', fontSize: 11, color: '#666' }}>
        Document introuvable
      </div>
    )
  }

  const scale = Math.min((width || 280) / PAGE_W, (height || 200) / PAGE_H)
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', background: '#eee', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 4, boxSizing: 'border-box' }}>
      <DocPreview doc={doc} pageIndex={el?.pageIndex || 0} scale={scale * 0.95} />
    </div>
  )
}

export function DocPlacedStatic({ el, sx = 1, sy = 1 }) {
  const doc = useDocLive(el?.docId)
  const W = Math.max((el.pw || el.w || 280) * sx, 40)
  const H = Math.max((el.ph || el.h || 200) * sy, 30)

  if (el?.mode === 'image' && el?.imageSrc) {
    return <img src={el.imageSrc} alt={el.l || 'Document'} style={{ width: W, height: H, objectFit: 'contain', display: 'block' }} />
  }
  if (!doc) {
    return <div style={{ width: W, height: H, background: '#f0f0f0', border: '1px solid #ccc', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{el.l || 'Document'}</div>
  }
  const scale = Math.min(W / PAGE_W, H / PAGE_H)
  return (
    <div style={{ width: W, height: H, overflow: 'hidden', background: '#eee', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
      <DocPreview doc={doc} pageIndex={el.pageIndex || 0} scale={scale * 0.92} />
    </div>
  )
}

/** @deprecated utiliser DocPlacedStatic */
export function renderDocPlaced(el, sx = 1, sy = 1) {
  return <DocPlacedStatic el={el} sx={sx} sy={sy} />
}
