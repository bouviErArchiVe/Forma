import { useFormaTheme } from '@/theme/useFormaTheme'

/** @deprecated Préférer useFormaTheme() — alias conservé pour compatibilité */
export function useGlobalAppearance() {
  return useFormaTheme()
}

/** Thème résolu pour les pages */
export function useTheme() {
  const { T, baseTheme, appearanceMode, appFont, previewTheme } = useFormaTheme()
  return { T, baseTheme, appearanceMode, appFont, previewTheme }
}

export { useFormaTheme } from '@/theme/useFormaTheme'
