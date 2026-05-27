/** Breakpoints layout iPad / mobile. */

export const TABLET_MAX_WIDTH = 1024

export function isTabletLayout(width = typeof window !== 'undefined' ? window.innerWidth : 1200) {
  return width <= TABLET_MAX_WIDTH
}

export function isCoarsePointer() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(pointer: coarse)').matches
}
