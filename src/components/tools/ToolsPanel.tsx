import { CalculatorDrawer } from './CalculatorDrawer'
import { FormaDicoPanel } from './FormaDicoPanel'
import { TranslationWidget } from './TranslationWidget'
import { GlassPanel } from '../ui/GlassPanel'
import { useToolsStore, type ToolsPanelTab } from '../../stores/toolsStore'
import { useFormaDicoStore } from '../../stores/formadicoStore'
import { useNavigate } from 'react-router-dom'

const TABS: { id: Exclude<ToolsPanelTab, null>; label: string; emoji: string }[] = [
  { id: 'calc', label: 'Calc', emoji: '🧮' },
  { id: 'translate', label: 'Traduction', emoji: '🌐' },
  { id: 'dico', label: 'Dico', emoji: '📖' },
]

interface ToolsPanelProps {
  showCalcDrawer?: boolean
}

export function ToolsPanel({ showCalcDrawer = true }: ToolsPanelProps) {
  const navigate = useNavigate()
  const openPanel = useToolsStore((s) => s.openPanel)
  const setOpenPanel = useToolsStore((s) => s.setOpenPanel)
  const closeAll = useToolsStore((s) => s.closeAll)
  const setPendingWord = useFormaDicoStore((s) => s.setPendingWord)

  if (showCalcDrawer && openPanel === 'calc') {
    return <CalculatorDrawer open onClose={closeAll} />
  }

  if (!openPanel || openPanel === 'calc') return null

  return (
    <div className="fixed inset-y-0 right-0 z-[115] w-full max-w-md flex flex-col shadow-2xl">
      <GlassPanel variant="panel" className="h-full flex flex-col border-l border-forma-border/60 rounded-none">
        <header className="flex items-center justify-between px-4 py-3 border-b border-forma-border/50">
          <h2 className="font-semibold text-sm">Outils Forma</h2>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => navigate('/formulas')}
              className="text-xs text-forma-accent px-2 py-1"
            >
              📐 Formules
            </button>
            <button type="button" onClick={closeAll} className="text-forma-muted px-2">
              ✕
            </button>
          </div>
        </header>

        <div className="flex border-b border-forma-border/40">
          {TABS.filter((t) => t.id !== 'calc').map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setOpenPanel(t.id)}
              className={`flex-1 py-2 text-xs ${
                openPanel === t.id ? 'text-forma-accent border-b-2 border-forma-accent font-medium' : 'text-forma-muted'
              }`}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {openPanel === 'translate' && (
            <TranslationWidget
              compact
              onOpenDico={(word) => {
                setPendingWord(word)
                setOpenPanel('dico')
              }}
            />
          )}
          {openPanel === 'dico' && (
            <FormaDicoPanel
              compact
              onClose={closeAll}
              onOpenTranslate={() => {
                setOpenPanel('translate')
              }}
            />
          )}
        </div>
      </GlassPanel>
    </div>
  )
}

export function ToolsToolbarButtons({ className = '' }: { className?: string }) {
  const openPanel = useToolsStore((s) => s.openPanel)
  const setOpenPanel = useToolsStore((s) => s.setOpenPanel)
  const closeAll = useToolsStore((s) => s.closeAll)
  const navigate = useNavigate()

  const toggle = (tab: ToolsPanelTab) => {
    if (openPanel === tab) closeAll()
    else setOpenPanel(tab)
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        type="button"
        title="Calculatrice"
        onClick={() => toggle('calc')}
        className={`text-sm px-2 py-1 border rounded-lg ${openPanel === 'calc' ? 'bg-forma-accent/10 border-forma-accent' : ''}`}
      >
        🧮
      </button>
      <button
        type="button"
        title="Traduction EN↔FR"
        onClick={() => toggle('translate')}
        className={`text-sm px-2 py-1 border rounded-lg ${openPanel === 'translate' ? 'bg-forma-accent/10 border-forma-accent' : ''}`}
      >
        🌐
      </button>
      <button
        type="button"
        title="FormaDico"
        onClick={() => toggle('dico')}
        className={`text-sm px-2 py-1 border rounded-lg ${openPanel === 'dico' ? 'bg-forma-accent/10 border-forma-accent' : ''}`}
      >
        📖
      </button>
      <button
        type="button"
        title="Catalogue formules"
        onClick={() => navigate('/formulas')}
        className="text-sm px-2 py-1 border rounded-lg hidden sm:inline"
      >
        📐
      </button>
    </div>
  )
}
