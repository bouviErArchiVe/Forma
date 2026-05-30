/** FFocus — helpers purs pour le minuteur Pomodoro (sans I/O). */

export type FocusMode = 'work' | 'break'

export const FOCUS_ALARM_KEY = 'forma_alarm'
export const MIN_MINUTES = 1
export const MAX_MINUTES = 120

export function clampMinutes(n: number): number {
  if (!Number.isFinite(n)) return MIN_MINUTES
  return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Math.round(n)))
}

export function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const mm = String(Math.floor(s / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

export function nextMode(mode: FocusMode): FocusMode {
  return mode === 'work' ? 'break' : 'work'
}

export function modeMinutes(mode: FocusMode, workMin: number, breakMin: number): number {
  return mode === 'work' ? workMin : breakMin
}

/** Fraction restante (0..1) pour l'anneau de progression. */
export function remainingFraction(secondsLeft: number, totalSeconds: number): number {
  if (totalSeconds <= 0) return 0
  return Math.min(1, Math.max(0, secondsLeft / totalSeconds))
}

/** Décalage strokeDashoffset pour un anneau SVG de circonférence `circ`. */
export function ringOffset(secondsLeft: number, totalSeconds: number, circ: number): number {
  return circ * (1 - remainingFraction(secondsLeft, totalSeconds))
}

export function readStoredAlarm(): string | null {
  try {
    return localStorage.getItem(FOCUS_ALARM_KEY)
  } catch {
    return null
  }
}

export function writeStoredAlarm(dataUrl: string): void {
  try {
    localStorage.setItem(FOCUS_ALARM_KEY, dataUrl)
  } catch {
    /* quota */
  }
}

export function clearStoredAlarm(): void {
  try {
    localStorage.removeItem(FOCUS_ALARM_KEY)
  } catch {
    /* ignore */
  }
}
