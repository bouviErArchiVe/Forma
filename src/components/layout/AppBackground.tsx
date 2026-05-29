import { useSettingsStore } from '../../stores/settingsStore'
import { rgbaFromHex } from '../../theme/color-utils'
import { getThemeById } from '../../theme/themes'

/** Fond ambiance — dégradé doux depuis le thème actif. */
export function AppBackground() {
  const themeId = useSettingsStore((s) => s.visualThemeId)
  const t = getThemeById(themeId)
  const accentGlow = rgbaFromHex(t.accent, 0.12)
  const accent2Glow = rgbaFromHex(t.accent2, 0.08)

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background: `linear-gradient(145deg, var(--forma-bg) 0%, ${rgbaFromHex(t.surface, 0.95)} 45%, var(--forma-bg) 100%)`,
        }}
      />
      <div
        className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full blur-3xl"
        style={{ background: accentGlow }}
      />
      <div
        className="absolute -bottom-32 -left-16 w-[360px] h-[360px] rounded-full blur-3xl"
        style={{ background: accent2Glow }}
      />
    </div>
  )
}
