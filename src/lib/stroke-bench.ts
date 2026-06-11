import type { Page, Point, Stroke } from '../types'
import { createId } from './id'

function estimateStrokeSegments(page: Page): number {
  let cost = 0
  for (const s of page.strokes) {
    const n = s.points.length
    if (n < 2) continue
    cost += s.tool === 'pencil' ? n - 1 : n
  }
  return cost
}

/** Génère une page synthétique avec N traits pour benchmarks dev/CI. */
export function generateSyntheticStrokePage(strokeCount: number, pageId = 'bench-page'): Page {
  const strokes: Stroke[] = []
  for (let i = 0; i < strokeCount; i++) {
    const points: Point[] = []
    const baseX = (i % 50) * 14
    const baseY = Math.floor(i / 50) * 14
    for (let j = 0; j < 12; j++) {
      points.push({
        x: baseX + j * 2,
        y: baseY + Math.sin(j * 0.4) * 4,
        pressure: 0.5,
        timestamp: i * 100 + j,
      })
    }
    strokes.push({
      id: createId(),
      tool: i % 3 === 0 ? 'pencil' : 'pen',
      color: '#111',
      width: 2,
      opacity: 1,
      pageId,
      points,
    })
  }
  return {
    id: pageId,
    notebookId: 'bench-nb',
    order: 0,
    template: 'blank',
    rotation: 0,
    strokes,
    shapes: [],
    texts: [],
    images: [],
    stickers: [],
    tapes: [],
  }
}

export interface StrokeBenchResult {
  strokeCount: number
  segmentEstimate: number
  elapsedMs: number
}

/** Mesure le coût estimé (segments) sur une page synthétique — sans rendu GPU. */
export function benchmarkStrokePage(strokeCount: number): StrokeBenchResult {
  const t0 = performance.now()
  const page = generateSyntheticStrokePage(strokeCount)
  const segmentEstimate = estimateStrokeSegments(page)
  return {
    strokeCount,
    segmentEstimate,
    elapsedMs: Math.round(performance.now() - t0),
  }
}

export const STROKE_BENCH_LEVELS = [1000, 5000, 10_000] as const

export function benchmarkStrokeLevels(
  levels: readonly number[] = STROKE_BENCH_LEVELS,
): StrokeBenchResult[] {
  return levels.map((n) => benchmarkStrokePage(n))
}
