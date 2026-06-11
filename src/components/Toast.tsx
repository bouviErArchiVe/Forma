import { useToastStore } from '../stores/toastStore'

export function Toast() {
  const message = useToastStore((s) => s.message)
  const clear = useToastStore((s) => s.clear)
  if (!message) return null
  return (
    <button
      type="button"
      onClick={() => clear()}
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 bg-gray-900 dark:bg-gray-800 text-white text-sm rounded-xl shadow-lg max-w-md text-center print-hide cursor-pointer hover:bg-gray-800 dark:hover:bg-gray-700 border border-white/10"
      style={{
        animation: 'toast-in 180ms cubic-bezier(0.16,1,0.3,1)',
        backdropFilter: 'blur(8px)',
      }}
      role="status"
      title="Cliquer pour fermer"
    >
      {message}
    </button>
  )
}
