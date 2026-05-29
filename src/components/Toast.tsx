import { useToastStore } from '../stores/toastStore'

const VARIANT_CLASS = {
  info: 'bg-gray-900 text-white dark:bg-gray-800',
  success: 'bg-emerald-800 text-white dark:bg-emerald-950',
  error: 'bg-red-800 text-white dark:bg-red-950',
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
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 text-sm rounded-lg shadow-lg max-w-md text-center print-hide cursor-pointer hover:opacity-90 ${VARIANT_CLASS[variant]}`}
      role="status"
      title="Cliquer pour fermer"
    >
      {message}
    </button>
  )
}
