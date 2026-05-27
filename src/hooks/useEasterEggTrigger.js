import useAppStore from '@/stores/useAppStore'

const prevBySource = {}

/** Détecte « caca » / « chat » une fois par apparition du mot (par source). */
export function checkEasterEggText(text, source = 'global') {
  const { easterEggsEnabled, triggerEasterEgg } = useAppStore.getState()
  if (easterEggsEnabled === false) return

  const lower = String(text || '').toLowerCase()
  const prevLower = String(prevBySource[source] || '').toLowerCase()

  if (/\bcaca\b/.test(lower) && !/\bcaca\b/.test(prevLower)) {
    triggerEasterEgg('poop')
  } else if (/\bchat\b/.test(lower) && !/\bchat\b/.test(prevLower)) {
    triggerEasterEgg('cat')
  }

  prevBySource[source] = text
}

export function useEasterEggEnabled() {
  return useAppStore((s) => s.easterEggsEnabled !== false)
}
