import AppBackground from '@/components/AppBackground'
import ThemeAnimation from '@/theme/ThemeAnimation'
import { FormaThemeContext, useFormaThemeEngine } from '@/theme/useFormaTheme'

export default function ThemeProvider({ children }) {
  const theme = useFormaThemeEngine()

  return (
    <FormaThemeContext.Provider value={theme}>
      <div
        id="forma-app-root"
        className={theme.shellClassName}
        style={theme.shellStyle}
        data-theme={theme.themeId}
        data-appearance={theme.appearanceMode}
        data-animation={theme.animationsEnabled ? theme.resolvedAnim : 'off'}
        data-background={theme.customBg ? 'custom' : (theme.bgId || 'none')}
      >
        <AppBackground background={theme.background} accent={theme.T.accent} />
        {theme.animationsEnabled && (
          <ThemeAnimation
            T={theme.T}
            animType={theme.resolvedAnim}
            animSpeed={theme.animSpeed}
          />
        )}
        <div className="forma-app-content">
          {children}
        </div>
      </div>
    </FormaThemeContext.Provider>
  )
}
