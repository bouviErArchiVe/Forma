import FormaAIChat from '@/components/formaai/FormaAIChat'

export default function FormaAIPanel({ open, onClose, initialText = '' }) {
  if (!open) return null
  return <FormaAIChat onClose={onClose} initialText={initialText} />
}
