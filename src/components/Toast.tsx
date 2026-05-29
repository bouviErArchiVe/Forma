import { useToastStore } from '../stores/toastStore'

const VARIANT_CLASS = {
  info: 'bg-gray-900/90 text-white forma-toast-glass',
  success: 'bg-emerald-800/90 text-white forma-toast-glass',
  error: 'bg-red-800/90 text-white forma-toast-glass',
} as const

export function Toast() {
  const message = useToastStore((s) => s.message)
  const variant = useToastStore((s) => s.variant)
  const clear = useToastStore((s) => s.clear)
  if (!message) return null
  return (
    <button
      type="button"
      onClick={() => clear()}
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 text-sm rounded-xl max-w-md text-center print-hide cursor-pointer hover:opacity-90 forma-animate-in ${VARIANT_CLASS[variant]}`}
      role="status"
      title="Cliquer pour fermer"
    >
      {message}
    </button>
  )
}
