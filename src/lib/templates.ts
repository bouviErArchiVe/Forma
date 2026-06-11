import type { PaperTemplate } from '../types'

export const TEMPLATE_LABELS: Record<PaperTemplate, string> = {
  blank: 'Blanc',
  lined: 'Ligné',
  'lined-wide': 'Ligné large',
  'lined-narrow': 'Ligné étroit',
  grid: 'Quadrillé',
  dots: 'Points',
  cornell: 'Cornell',
  planner: 'Planning',
  music: 'Partition',
}

export function drawTemplate(
  ctx: CanvasRenderingContext2D,
  template: PaperTemplate,
  width: number,
  height: number,
): void {
  const paper =
    getComputedStyle(document.documentElement).getPropertyValue('--color-forma-paper').trim() ||
    '#fffef9'
  ctx.fillStyle = paper || '#fffef9'
  ctx.fillRect(0, 0, width, height)
  ctx.strokeStyle = '#e5e0d5'
  ctx.lineWidth = 1

  switch (template) {
    case 'lined':
      drawLines(ctx, width, height, 32)
      break
    case 'lined-wide':
      drawLines(ctx, width, height, 48)
      break
    case 'lined-narrow':
      drawLines(ctx, width, height, 24)
      break
    case 'grid':
      drawGrid(ctx, width, height, 32)
      break
    case 'dots':
      drawDots(ctx, width, height, 24)
      break
    case 'cornell':
      drawCornell(ctx, width, height)
      break
    case 'planner':
      drawPlanner(ctx, width, height)
      break
    case 'music':
      drawMusicStaff(ctx, width, height)
      break
    default:
      break
  }
}

function drawMusicStaff(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const gap = 80
  const lineGap = 10
  for (let y = gap; y < height - gap; y += gap) {
    for (let i = 0; i < 5; i++) {
      const ly = y + i * lineGap
      ctx.beginPath()
      ctx.moveTo(40, ly)
      ctx.lineTo(width - 40, ly)
      ctx.stroke()
    }
  }
}

function drawLines(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  spacing: number,
): void {
  const margin = 56
  ctx.beginPath()
  ctx.moveTo(margin, 0)
  ctx.lineTo(margin, height)
  ctx.stroke()
  for (let y = spacing * 2; y < height; y += spacing) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  spacing: number,
): void {
  for (let x = spacing; x < width; x += spacing) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  for (let y = spacing; y < height; y += spacing) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
}

function drawDots(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  spacing: number,
): void {
  ctx.fillStyle = '#d4cfc4'
  for (let x = spacing; x < width; x += spacing) {
    for (let y = spacing; y < height; y += spacing) {
      ctx.beginPath()
      ctx.arc(x, y, 1.2, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function drawCornell(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const cueW = width * 0.3
  const summaryH = 120
  ctx.beginPath()
  ctx.moveTo(cueW, 0)
  ctx.lineTo(cueW, height - summaryH)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(0, height - summaryH)
  ctx.lineTo(width, height - summaryH)
  ctx.stroke()
  drawLines(ctx, width, height, 32)
}

function drawPlanner(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const headerH = 80
  ctx.fillStyle = '#f5f3ef'
  ctx.fillRect(0, 0, width, headerH)
  ctx.strokeRect(0, 0, width, headerH)
  const colW = width / 7
  for (let i = 1; i < 7; i++) {
    ctx.beginPath()
    ctx.moveTo(i * colW, 0)
    ctx.lineTo(i * colW, height)
    ctx.stroke()
  }
  for (let y = headerH + 60; y < height; y += 60) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
}
