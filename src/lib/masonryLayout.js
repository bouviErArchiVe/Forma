/** Distribution masonry — colonne la plus courte reçoit l'item suivant. */

export function distributeMasonry(items, columnCount, getHeight) {
  if (!items.length || columnCount < 1) return Array.from({ length: columnCount }, () => [])
  const cols = Array.from({ length: columnCount }, () => ({ items: [], height: 0 }))
  items.forEach((item) => {
    const shortest = cols.reduce((min, col, i) => (col.height < cols[min].height ? i : min), 0)
    cols[shortest].items.push(item)
    cols[shortest].height += getHeight(item) + 10
  })
  return cols.map((c) => c.items)
}

export function masonryColumnCount(width) {
  if (width >= 1100) return 4
  if (width >= 760) return 3
  if (width >= 480) return 2
  return 1
}
