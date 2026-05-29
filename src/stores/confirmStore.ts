import { create } from 'zustand'

interface ConfirmOptions {
  title?: string
  confirmLabel?: string
  danger?: boolean
}

interface ConfirmState {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  danger: boolean
  resolve: ((ok: boolean) => void) | null
  ask: (message: string, options?: ConfirmOptions) => Promise<boolean>
  answer: (ok: boolean) => void
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  open: false,
  title: 'Confirmer',
  message: '',
  confirmLabel: 'OK',
  danger: false,
  resolve: null,
  ask: (message, options) =>
    new Promise((resolve) => {
      set({
        open: true,
        title: options?.title ?? 'Confirmer',
        message,
        confirmLabel: options?.confirmLabel ?? 'OK',
        danger: options?.danger ?? false,
        resolve,
      })
    }),
  answer: (ok) => {
    const { resolve } = get()
    resolve?.(ok)
    set({ open: false, resolve: null })
  },
}))

export function confirm(message: string, options?: ConfirmOptions): Promise<boolean> {
  return useConfirmStore.getState().ask(message, options)
}
