/** Breakpoints layout iPad / mobile. */

export const TABLET_MAX_WIDTH = 1024

export function isTabletLayout(width = typeof window !== 'undefined' ? window.innerWidth : 1200) {
  return true // Toujours mode tablet : BottomSheet sur tous les écrans, jamais DraggablePanel flottant
}

export function isCoarsePointer() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(pointer: coarse)').matches
}
