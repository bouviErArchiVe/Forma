import type { Orientation } from '../types'
import { basePageDimensions } from '../lib/page-dimensions'

interface PagePlaceholderProps {
  orientation: Orientation
  zoom: number
}

/** Placeholder léger réutilisable quand PageCanvas n'est pas monté (vue continue). */
export function PagePlaceholder({ orientation, zoom }: PagePlaceholderProps) {
  const { width, height } = basePageDimensions(orientation)
  const displayW = Math.round(width * zoom)
  const displayH = Math.round(height * zoom)
  return (
    <div
      className="bg-forma-surface border border-forma-border rounded-sm mx-auto print-hide"
      style={{ width: displayW, height: displayH, maxWidth: '100%' }}
      aria-hidden
    />
  )
}
