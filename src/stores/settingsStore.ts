import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  AppSettings,
  PageViewMode,
  PaperTemplate,
  PaperTone,
  SyncInterval,
  ThemeMode,
} from '../types'
import { COVER_COLORS, PAPER_TONE_COLORS } from '../types'

function readLegacySyncInterval(): SyncInterval {
  try {
    const v = localStorage.getItem('forma-sync-interval') as SyncInterval
    if (v === 'daily' || v === 'weekly' || v === 'off') return v
  } catch {
    /* ignore */
  }
  return 'off'
}

interface SettingsState extends AppSettings {
  setTheme: (t: ThemeMode) => void
  setPalmRejection: (v: boolean) => void
  setFingerScroll: (v: boolean) => void
  setGridSnap: (v: boolean) => void
  setDefaultPenWidth: (v: number) => void
  setDefaultZoom: (v: number) => void
  setShapeHoldMs: (v: number) => void
  setOnboardingDone: (v: boolean) => void
  setPageViewMode: (v: PageViewMode) => void
  setAutoSnapshot: (v: boolean) => void
  setScribbleErase: (v: boolean) => void
  setShowRuler: (v: boolean) => void
  setShowPerfHud: (v: boolean) => void
  setSyncInterval: (v: SyncInterval) => void
  setPaperTone: (v: PaperTone) => void
  setDefaultPaperTemplate: (v: PaperTemplate) => void
  setDefaultCoverColor: (v: string) => void
  applyTheme: () => void
  applyPaperTone: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      palmRejection: true,
      fingerScroll: true,
      gridSnap: false,
      defaultPenWidth: 2,
      defaultZoom: 0.75,
      shapeHoldMs: 600,
      onboardingDone: false,
      pageViewMode: 'single',
      autoSnapshot: false,
      scribbleErase: true,
      showRuler: false,
      showPerfHud: false,
      syncInterval: readLegacySyncInterval(),
      paperTone: 'cream',
      defaultPaperTemplate: 'lined',
      defaultCoverColor: COVER_COLORS[4],
      setTheme: (theme) => {
        set({ theme })
        get().applyTheme()
      },
      setPalmRejection: (palmRejection) => set({ palmRejection }),
      setFingerScroll: (fingerScroll) => set({ fingerScroll }),
      setGridSnap: (gridSnap) => set({ gridSnap }),
      setDefaultPenWidth: (defaultPenWidth) => set({ defaultPenWidth }),
      setDefaultZoom: (defaultZoom) =>
        set({ defaultZoom: Math.min(1.6, Math.max(0.35, defaultZoom)) }),
      setShapeHoldMs: (shapeHoldMs) => set({ shapeHoldMs }),
      setOnboardingDone: (onboardingDone) => set({ onboardingDone }),
      setPageViewMode: (pageViewMode) => set({ pageViewMode }),
      setAutoSnapshot: (autoSnapshot) => set({ autoSnapshot }),
      setScribbleErase: (scribbleErase) => set({ scribbleErase }),
      setShowRuler: (showRuler) => set({ showRuler }),
      setShowPerfHud: (showPerfHud) => set({ showPerfHud }),
      setSyncInterval: (syncInterval) => {
        localStorage.setItem('forma-sync-interval', syncInterval)
        set({ syncInterval })
      },
      setPaperTone: (paperTone) => {
        set({ paperTone })
        get().applyPaperTone()
      },
      setDefaultPaperTemplate: (defaultPaperTemplate) => set({ defaultPaperTemplate }),
      setDefaultCoverColor: (defaultCoverColor) => set({ defaultCoverColor }),
      applyPaperTone: () => {
        document.documentElement.style.setProperty(
          '--color-forma-paper',
          PAPER_TONE_COLORS[get().paperTone],
        )
      },
      applyTheme: () => {
        const { theme } = get()
        const root = document.documentElement
        const dark =
          theme === 'dark' ||
          (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
        root.classList.toggle('dark', dark)
        get().applyPaperTone()
      },
    }),
    {
      name: 'forma-settings',
      onRehydrateStorage: () => (state) => {
        state?.applyPaperTone()
      },
    },
  ),
)
