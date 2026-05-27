/** Profils d'apparence visuelle Forma */

export const VISUAL_PROFILE_FIELDS = [
  'themeId', 'appearanceMode', 'animationsEnabled', 'animType', 'animSpeed',
  'bgId', 'customBg', 'appFont', 'libraryView', 'librarySort',
]

export const DEFAULT_VISUAL_PROFILES = [
  {
    id: 'vp-dark-horizon',
    name: 'Sombre · Horizon · Crayon',
    isDefault: true,
    settings: {
      themeId: 'horizon',
      appearanceMode: 'dark',
      animationsEnabled: true,
      animType: 'pencil',
      animSpeed: 1,
      bgId: 'villa-savoye',
      customBg: '',
      appFont: '',
    },
  },
  {
    id: 'vp-light-neutral',
    name: 'Clair · Neutre',
    settings: {
      themeId: 'horizon',
      appearanceMode: 'light',
      animationsEnabled: false,
      animType: '',
      animSpeed: 1,
      bgId: '',
      customBg: '',
      appFont: '',
    },
  },
  {
    id: 'vp-presentation',
    name: 'Présentation · Propre',
    settings: {
      themeId: 'lumiere',
      appearanceMode: 'light',
      animationsEnabled: false,
      animType: '',
      animSpeed: 1,
      bgId: '',
      customBg: '',
      appFont: '',
    },
  },
]

export function captureAppearanceSettings(state) {
  return VISUAL_PROFILE_FIELDS.reduce((acc, key) => {
    if (state[key] !== undefined) acc[key] = state[key]
    return acc
  }, {})
}

export function createVisualProfile(name, state, { isDefault = false } = {}) {
  return {
    id: `vp-${Date.now()}`,
    name: (name || 'Nouveau profil').trim().slice(0, 48),
    isDefault: !!isDefault,
    createdAt: Date.now(),
    settings: captureAppearanceSettings(state),
  }
}

export function duplicateVisualProfile(profile, newName) {
  return {
    ...profile,
    id: `vp-${Date.now()}`,
    name: (newName || `${profile.name} (copie)`).slice(0, 48),
    isDefault: false,
    createdAt: Date.now(),
  }
}

export function applyVisualProfileSettings(profile, store) {
  const s = profile?.settings
  if (!s) return
  if (s.themeId != null) store.setTheme(s.themeId)
  if (s.appearanceMode != null) store.setAppearanceMode(s.appearanceMode)
  if (s.animationsEnabled != null) store.setAnimationsEnabled(s.animationsEnabled)
  if (s.animType != null) store.setAnimType(s.animType)
  if (s.animSpeed != null) store.setAnimSpeed(s.animSpeed)
  if (s.bgId != null) store.setBgId(s.bgId)
  if (s.customBg != null) store.setCustomBg(s.customBg)
  if (s.appFont != null) store.setAppFont(s.appFont)
  if (s.libraryView != null) store.setLibraryView(s.libraryView)
  if (s.librarySort != null) store.setLibrarySort(s.librarySort)
}

export function seedVisualProfiles(existing) {
  if (Array.isArray(existing) && existing.length) return existing
  return DEFAULT_VISUAL_PROFILES.map((p) => ({ ...p }))
}
