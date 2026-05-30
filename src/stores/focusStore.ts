import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  clampMinutes,
  clearStoredAlarm,
  modeMinutes,
  nextMode,
  readStoredAlarm,
  writeStoredAlarm,
  type FocusMode,
} from '../lib/focus/timer'

export type AlarmType = 'default' | 'custom'

interface FocusState {
  open: boolean
  running: boolean
  mode: FocusMode
  secondsLeft: number
  workMin: number
  breakMin: number
  alarmType: AlarmType
  customAlarm: string | null
  /** Incrémenté à chaque fin de cycle pour déclencher l'alarme côté UI. */
  dingCount: number

  setOpen: (open: boolean) => void
  toggleOpen: () => void
  toggleRun: () => void
  pause: () => void
  reset: () => void
  tick: () => void
  setMode: (mode: FocusMode) => void
  setWorkMin: (n: number) => void
  setBreakMin: (n: number) => void
  setAlarmType: (t: AlarmType) => void
  setCustomAlarm: (dataUrl: string) => void
  clearCustomAlarm: () => void
}

const initialAlarm = readStoredAlarm()

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      open: false,
      running: false,
      mode: 'work',
      secondsLeft: 25 * 60,
      workMin: 25,
      breakMin: 5,
      alarmType: initialAlarm ? 'custom' : 'default',
      customAlarm: initialAlarm,
      dingCount: 0,

      setOpen: (open) => set({ open }),
      toggleOpen: () => set((s) => ({ open: !s.open })),
      toggleRun: () => set((s) => ({ running: !s.running })),
      pause: () => set({ running: false }),
      reset: () =>
        set((s) => ({ running: false, mode: 'work', secondsLeft: clampMinutes(s.workMin) * 60 })),
      tick: () =>
        set((s) => {
          if (!s.running) return s
          if (s.secondsLeft > 1) return { secondsLeft: s.secondsLeft - 1 }
          const m = nextMode(s.mode)
          const mins = modeMinutes(m, clampMinutes(s.workMin), clampMinutes(s.breakMin))
          return { running: false, mode: m, secondsLeft: mins * 60, dingCount: s.dingCount + 1 }
        }),
      setMode: (mode) =>
        set((s) => ({
          running: false,
          mode,
          secondsLeft: modeMinutes(mode, clampMinutes(s.workMin), clampMinutes(s.breakMin)) * 60,
        })),
      setWorkMin: (n) =>
        set((s) => {
          const workMin = clampMinutes(n)
          const sync = !s.running && s.mode === 'work'
          return { workMin, ...(sync ? { secondsLeft: workMin * 60 } : {}) }
        }),
      setBreakMin: (n) =>
        set((s) => {
          const breakMin = clampMinutes(n)
          const sync = !s.running && s.mode === 'break'
          return { breakMin, ...(sync ? { secondsLeft: breakMin * 60 } : {}) }
        }),
      setAlarmType: (alarmType) => {
        if (alarmType === 'custom' && !get().customAlarm) return
        set({ alarmType })
      },
      setCustomAlarm: (dataUrl) => {
        writeStoredAlarm(dataUrl)
        set({ customAlarm: dataUrl, alarmType: 'custom' })
      },
      clearCustomAlarm: () => {
        clearStoredAlarm()
        set({ customAlarm: null, alarmType: 'default' })
      },
    }),
    {
      name: 'forma-focus-prefs',
      partialize: (s) => ({ workMin: s.workMin, breakMin: s.breakMin, alarmType: s.alarmType }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        const workMin = clampMinutes(state.workMin)
        state.workMin = workMin
        state.breakMin = clampMinutes(state.breakMin)
        state.secondsLeft = workMin * 60
        state.mode = 'work'
        state.running = false
        if (state.alarmType === 'custom' && !state.customAlarm) state.alarmType = 'default'
      },
    },
  ),
)
