import { create } from 'zustand'

export type ToastVariant = 'info' | 'success' | 'error'

interface ToastState {
  message: string | null
  variant: ToastVariant
  show: (message: string, ms?: number, variant?: ToastVariant) => void
  clear: () => void
}

let hideTimer: ReturnType<typeof setTimeout> | null = null

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  variant: 'info',
  show: (message, ms = 4000, variant = 'info') => {
    if (hideTimer) clearTimeout(hideTimer)
    set({ message, variant })
    hideTimer = setTimeout(() => set({ message: null, variant: 'info' }), ms)
  },
  clear: () => set({ message: null, variant: 'info' }),
}))
