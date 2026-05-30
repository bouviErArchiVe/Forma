import { useCallback, useState } from 'react'
import { GlassPanel } from '../ui/GlassPanel'
import { GlassButton } from '../ui/GlassButton'
import {
  calcAngleFromSides,
  calcAreaRect,
  calcSlope,
  calcVolumeBox,
  convertDrawingScale,
  convertValue,
  proportion,
  ruleOfThree,
  simplifyRatio,
} from '../../lib/arch-calculator'
import { evaluateExpression, formatResult } from '../../lib/calculator-engine'
import { UNIT_CATEGORIES, UNITS_BY_CATEGORY, type UnitCategoryId } from '../../lib/units'

type ArchTool =
  | 'area'
  | 'volume'
  | 'slope'
  | 'angle'
  | 'scale'
  | 'conv'
  | 'ratio'
  | 'prop'
  | 'rule3'

const ARCH_TOOLS: { id: ArchTool; label: string }[] = [
  { id: 'area', label: 'Surface' },
  { id: 'volume', label: 'Volume' },
  { id: 'slope', label: 'Pente' },
  { id: 'angle', label: 'Angle' },
  { id: 'scale', label: 'Échelle' },
  { id: 'conv', label: 'Unités' },
  { id: 'ratio', label: 'Ratio' },
  { id: 'prop', label: 'Proportion' },
  { id: 'rule3', label: 'Règle de 3' },
]

const CALC_KEYS = [
  ['C', '⌫', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '='],
]

interface CalculatorDrawerProps {
  open: boolean
  onClose: () => void
}

export function CalculatorDrawer({ open, onClose }: CalculatorDrawerProps) {
  const [tab, setTab] = useState<'calc' | 'arch'>('calc')
  const [expr, setExpr] = useState('')
  const [memory, setMemory] = useState<number | null>(null)
  const [angleMode, setAngleMode] = useState<'deg' | 'rad'>('deg')
  const [archTool, setArchTool] = useState<ArchTool>('area')
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [c, setC] = useState('')
  const [scaleStr, setScaleStr] = useState('1:50')
  const [convCat, setConvCat] = useState<UnitCategoryId>('length')
  const [convFrom, setConvFrom] = useState('m')
  const [convTo, setConvTo] = useState('mm')
  const [archOut, setArchOut] = useState('')

  const append = useCallback((key: string) => {
    if (key === 'C') {
      setExpr('')
      return
    }
    if (key === '⌫') {
      setExpr((e) => e.slice(0, -1))
      return
    }
    if (key === '=') {
      const r = evaluateExpression(expr, { angleMode })
      setExpr(formatResult(r))
      return
    }
    setExpr((e) => e + key)
  }, [expr, angleMode])

  const runArch = () => {
    let label = ''
    switch (archTool) {
      case 'area': {
        const r = calcAreaRect(a, b)
        label = r != null ? `Surface = ${formatResult(r)} (L×l)` : 'Erreur'
        break
      }
      case 'volume': {
        const r = calcVolumeBox(a, b, c)
        label = r != null ? `Volume = ${formatResult(r)}` : 'Erreur'
        break
      }
      case 'slope': {
        const s = calcSlope(a, b)
        label = s ? `Pente ${formatResult(s.pct)} % · ${formatResult(s.deg)}°` : 'Erreur'
        break
      }
      case 'angle': {
        const r = calcAngleFromSides(a, b)
        label = r != null ? `Angle = ${formatResult(r)}°` : 'Erreur'
        break
      }
      case 'scale': {
        const r = convertDrawingScale(a, convFrom, scaleStr)
        label = r ? `Réel : ${r.mm} mm · ${r.cm} cm · ${r.m} m` : 'Erreur'
        break
      }
      case 'conv': {
        const r = convertValue(a, convCat, convFrom, convTo)
        label = r !== '' ? `${a} ${convFrom} = ${r} ${convTo}` : 'Erreur'
        break
      }
      case 'ratio': {
        const r = simplifyRatio(a, b)
        label = r ? `${r.a}:${r.b} (${formatResult(r.decimal)})` : 'Erreur'
        break
      }
      case 'prop':
      case 'rule3': {
        const r = archTool === 'prop' ? proportion(a, b, c) : ruleOfThree(a, b, c)
        label = r != null ? `Résultat = ${formatResult(r)}` : 'Erreur'
        break
      }
    }
    setArchOut(label)
  }

  if (!open) return null

  const units = UNITS_BY_CATEGORY[convCat] || []

  return (
    <div className="fixed inset-y-0 right-0 z-[120] w-full max-w-sm flex flex-col shadow-2xl">
      <GlassPanel variant="panel" className="h-full flex flex-col border-l border-forma-border/60 rounded-none">
        <header className="flex items-center justify-between px-4 py-3 border-b border-forma-border/50">
          <div>
            <h2 className="font-semibold text-sm">Calculatrice</h2>
            <p className="text-[10px] text-forma-muted">Scientifique + outils architecture</p>
          </div>
          <button type="button" onClick={onClose} className="text-forma-muted hover:text-forma-text px-2">
            ✕
          </button>
        </header>

        <div className="flex border-b border-forma-border/40">
          {(['calc', 'arch'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-xs font-medium ${
                tab === t ? 'text-forma-accent border-b-2 border-forma-accent' : 'text-forma-muted'
              }`}
            >
              {t === 'calc' ? '🔢 Calc' : '📐 Archi'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {tab === 'calc' ? (
            <>
              <div className="flex justify-between items-center mb-2">
                <button
                  type="button"
                  className={`text-[10px] px-2 py-0.5 rounded ${angleMode === 'deg' ? 'bg-forma-accent/15 text-forma-accent' : ''}`}
                  onClick={() => setAngleMode('deg')}
                >
                  DEG
                </button>
                <button
                  type="button"
                  className={`text-[10px] px-2 py-0.5 rounded ${angleMode === 'rad' ? 'bg-forma-accent/15 text-forma-accent' : ''}`}
                  onClick={() => setAngleMode('rad')}
                >
                  RAD
                </button>
                <span className="text-[10px] text-forma-muted">M={memory != null ? formatResult(memory) : '—'}</span>
              </div>
              <input
                readOnly
                value={expr}
                className="w-full mb-3 px-3 py-2 text-right text-lg font-mono border border-forma-border rounded-lg bg-white/20"
              />
              <div className="grid grid-cols-4 gap-1.5">
                {CALC_KEYS.flat().map((key, i) => (
                  <button
                    key={`${key}-${i}`}
                    type="button"
                    onClick={() => {
                      if (key === 'M+') {
                        const r = evaluateExpression(expr, { angleMode })
                        if (r != null) setMemory(r)
                        return
                      }
                      append(key)
                    }}
                    className={`min-h-[44px] rounded-lg text-sm font-semibold forma-glass-card hover:bg-white/40 ${
                      key === '=' ? 'bg-forma-accent text-white' : ''
                    } ${key === '0' ? 'col-span-2' : ''}`}
                  >
                    {key}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 mt-2">
                <GlassButton size="sm" onClick={() => {
                  const r = evaluateExpression(expr, { angleMode })
                  if (r != null) setMemory(r)
                }}>
                  M+
                </GlassButton>
                <GlassButton size="sm" onClick={() => memory != null && setExpr(String(memory))}>
                  MR
                </GlassButton>
                <GlassButton size="sm" onClick={() => setMemory(null)}>
                  MC
                </GlassButton>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-wrap gap-1 mb-3">
                {ARCH_TOOLS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setArchTool(t.id)}
                    className={`text-[10px] px-2 py-1 rounded-full ${
                      archTool === t.id ? 'bg-forma-accent text-white' : 'bg-white/30 dark:bg-white/5'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {archTool === 'conv' && (
                <select
                  value={convCat}
                  onChange={(e) => {
                    const cat = e.target.value as UnitCategoryId
                    setConvCat(cat)
                    const u = UNITS_BY_CATEGORY[cat][2]?.id || 'm'
                    setConvFrom(u)
                    setConvTo(UNITS_BY_CATEGORY[cat][0]?.id || 'mm')
                  }}
                  className="w-full mb-2 border rounded-lg px-2 py-1 text-sm"
                >
                  {UNIT_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              )}

              <div className="grid grid-cols-2 gap-2 mb-2">
                <label className="text-xs">
                  <span className="text-forma-muted block mb-0.5">A</span>
                  <input value={a} onChange={(e) => setA(e.target.value)} type="number" className="w-full border rounded px-2 py-1.5 text-sm" />
                </label>
                <label className="text-xs">
                  <span className="text-forma-muted block mb-0.5">B</span>
                  <input value={b} onChange={(e) => setB(e.target.value)} type="number" className="w-full border rounded px-2 py-1.5 text-sm" />
                </label>
                {(archTool === 'volume' || archTool === 'prop' || archTool === 'rule3') && (
                  <label className="text-xs col-span-2">
                    <span className="text-forma-muted block mb-0.5">C</span>
                    <input value={c} onChange={(e) => setC(e.target.value)} type="number" className="w-full border rounded px-2 py-1.5 text-sm" />
                  </label>
                )}
              </div>

              {(archTool === 'conv' || archTool === 'scale') && (
                <div className="flex gap-2 mb-2">
                  <select value={convFrom} onChange={(e) => setConvFrom(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm">
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>{u.label}</option>
                    ))}
                  </select>
                  {archTool === 'conv' && (
                    <select value={convTo} onChange={(e) => setConvTo(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm">
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>{u.label}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {archTool === 'scale' && (
                <input
                  value={scaleStr}
                  onChange={(e) => setScaleStr(e.target.value)}
                  placeholder="1:50"
                  className="w-full mb-2 border rounded px-2 py-1.5 text-sm"
                />
              )}

              <GlassButton accent className="w-full mb-2" onClick={runArch}>
                Calculer
              </GlassButton>
              {archOut && (
                <p className="text-sm p-2 rounded-lg bg-forma-accent/10 text-forma-text">{archOut}</p>
              )}
            </>
          )}
        </div>
      </GlassPanel>
    </div>
  )
}
