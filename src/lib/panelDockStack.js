/** Registre léger pour empiler les panneaux dockés sur un même bord. */
const sides = { left: [], right: [], top: [], bottom: [] }
const listeners = new Set()

function notify() {
  listeners.forEach((fn) => fn())
}

export function subscribePanelDock(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function syncPanelDock(id, mode, open) {
  Object.keys(sides).forEach((side) => {
    sides[side] = sides[side].filter((x) => x !== id)
  })
  if (open && mode && mode !== 'float' && sides[mode]) {
    if (!sides[mode].includes(id)) sides[mode].push(id)
  }
  notify()
}

export function clearPanelDock(id) {
  Object.keys(sides).forEach((side) => {
    sides[side] = sides[side].filter((x) => x !== id)
  })
  notify()
}

export function getPanelStackIndex(id, mode) {
  if (!mode || mode === 'float') return 0
  const list = sides[mode] || []
  const idx = list.indexOf(id)
  return idx >= 0 ? idx : 0
}

export function getPanelStackCount(mode) {
  if (!mode || mode === 'float') return 1
  return Math.max(1, (sides[mode] || []).length)
}
