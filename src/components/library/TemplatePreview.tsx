import { useEffect, useRef } from 'react'
import { drawTemplate } from '../../lib/templates'
import type { PaperTemplate } from '../../types'

export function TemplatePreview({ template }: { template: PaperTemplate }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const w = 160
    const h = 220
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#fafaf9'
    ctx.fillRect(0, 0, w, h)
    drawTemplate(ctx, template, w, h)
  }, [template])

  return <canvas ref={ref} className="w-full h-24 rounded border border-forma-border bg-forma-paper" />
}
