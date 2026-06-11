export const GRID_SIZE = 32

export function snapToGrid(x: number, y: number, size = GRID_SIZE): { x: number; y: number } {
  return {
    x: Math.round(x / size) * size,
    y: Math.round(y / size) * size,
  }
}
