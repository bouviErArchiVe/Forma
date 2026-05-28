import FormaAppShell from '@/components/FormaAppShell'
import FormaAIChat from '@/components/formaai/FormaAIChat'

export default function FormaAIPage() {
  return (
    <FormaAppShell title="FormaAI" subtitle="Discussion · architecture & cours">
      <div style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <FormaAIChat embedded />
      </div>
    </FormaAppShell>
  )
}
