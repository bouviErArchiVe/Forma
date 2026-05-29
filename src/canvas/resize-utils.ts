/** Coordonnées page depuis un événement pointeur sur le canvas encre. */
export function clientToPagePoint(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
  pageWidth: number,
  pageHeight: number,
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect()
  return {
    x: ((clientX - rect.left) / rect.width) * pageWidth,
    y: ((clientY - rect.top) / rect.height) * pageHeight,
  }
}
