import { create } from 'zustand'

interface ToastState {
  message: string | null
  show: (message: string, ms?: number) => void
  clear: () => void
}

let hideTimer: ReturnType<typeof setTimeout> | null = null

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  show: (message, ms = 4000) => {
    if (hideTimer) clearTimeout(hideTimer)
    set({ message })
    hideTimer = setTimeout(() => set({ message: null }), ms)
  },
  clear: () => set({ message: null }),
}))
