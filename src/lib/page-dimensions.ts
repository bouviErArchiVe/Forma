import type { Orientation } from '../types'

export const PAGE_WIDTH_PORTRAIT = 794
export const PAGE_HEIGHT_PORTRAIT = 1123

export function basePageDimensions(orientation: Orientation = 'portrait') {
  if (orientation === 'landscape') {
    return { width: PAGE_HEIGHT_PORTRAIT, height: PAGE_WIDTH_PORTRAIT }
  }
  return { width: PAGE_WIDTH_PORTRAIT, height: PAGE_HEIGHT_PORTRAIT }
}

export function displayPageDimensions(
  orientation: Orientation = 'portrait',
  rotation: 0 | 90 | 180 | 270 = 0,
) {
  const { width, height } = basePageDimensions(orientation)
  if (rotation === 90 || rotation === 270) return { width: height, height: width }
  return { width, height }
}

export function unrotatePoint(
  x: number,
  y: number,
  rotation: 0 | 90 | 180 | 270,
  width: number,
  height: number,
): { x: number; y: number } {
  if (!rotation) return { x, y }
  const cx = width / 2
  const cy = height / 2
  const rad = (-rotation * Math.PI) / 180
  const dx = x - cx
  const dy = y - cy
  return {
    x: cx + dx * Math.cos(rad) - dy * Math.sin(rad),
    y: cy + dx * Math.sin(rad) + dy * Math.cos(rad),
  }
}
