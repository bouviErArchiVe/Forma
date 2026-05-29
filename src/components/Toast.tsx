import { useToastStore } from '../stores/toastStore'

export function Toast() {
  const message = useToastStore((s) => s.message)
  const clear = useToastStore((s) => s.clear)
  if (!message) return null
  return (
    <button
      type="button"
      onClick={() => clear()}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 bg-gray-900 text-white text-sm rounded-lg shadow-lg max-w-md text-center print-hide cursor-pointer hover:bg-gray-800"
      role="status"
      title="Cliquer pour fermer"
    >
      {message}
    </button>
  )
}
