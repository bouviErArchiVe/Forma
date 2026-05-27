import { useRef, useState, useCallback } from 'react'
import { glassStyle, rgbaFromHex } from '@/theme/glass'
import { TOKENS } from '@/theme/tokens'
import GlassButton from '@/components/ui/GlassButton'
import {
  calcAreaRect,
  calcVolumeBox,
  calcSlope,
  calcAngleFromSides,
  ruleOfThree,
  proportion,
  simplifyRatio,
  convertValue,
  convertDrawingScale,
} from '@/lib/archCalculator'
import { formatResult } from '@/lib/calculatorEngine'
import { calcDrawerWidth } from '@/hooks/useCalculator'

function CalcBtn({ label, onClick, T, variant = 'num', wide, tall, title, active }) {
  const op = ['÷', '×', '−', '+', '='].includes(label)
  const fn = variant === 'fn'
  const mem = variant === 'mem'
  const danger = variant === 'danger'
  return (
    <button
      type="button"
      title={title || label}
      onClick={onClick}
      className="forma-btn-glass"
      style={{
        gridColumn: wide ? 'span 2' : undefined,
        gridRow: tall ? 'span 2' : undefined,
        minHeight: tall ? 88 : 48,
        padding: '10px 4px',
        borderRadius: TOKENS.radius.md,
        border: active ? `2px solid ${T.accent}` : 'none',
        cursor: 'pointer',
        fontSize: fn ? 11 : label?.length > 3 ? 10 : 15,
        fontWeight: op || label === '=' ? 800 : 600,
        touchAction: 'manipulation',
        userSelect: 'none',
        background: label === '='
          ? T.accent
          : danger
            ? '#e9456018'
            : op || fn
              ? `${T.accent}18`
              : mem
                ? rgbaFromHex(T.border, 0.25)
                : rgbaFromHex(T.bg, 0.5),
        color: label === '=' ? '#fff' : danger ? '#e94560' : op || fn ? T.accent : T.ink,
      }}
    >
      {label}
    </button>
  )
}

function ArchField({ label, value, onChange, T, unit }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 0 }}>
      <span style={{ fontSize: 8, fontWeight: 700, color: T.muted, letterSpacing: 0.5 }}>{label}</span>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: '8px 8px',
          borderRadius: 8,
          border: `1px solid ${rgbaFromHex(T.border, 0.45)}`,
          background: rgbaFromHex(T.bg, 0.45),
          color: T.ink,
          fontSize: 13,
          width: '100%',
          boxSizing: 'border-box',
        }}
      />
      {unit && <span style={{ fontSize: 8, color: T.muted }}>{unit}</span>}
    </label>
  )
}

function ArchToolsPanel({ T, scale, onResult }) {
  const [tool, setTool] = useState('area')
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [c, setC] = useState('')
  const [convCat, setConvCat] = useState('length')
  const [convFrom, setConvFrom] = useState('m')
  const [convTo, setConvTo] = useState('mm')
  const [out, setOut] = useState('')

  const tools = [
    ['area', 'Surface'],
    ['volume', 'Volume'],
    ['slope', 'Pente'],
    ['angle', 'Angle'],
    ['scale', 'Échelle'],
    ['conv', 'Unités'],
    ['ratio', 'Ratio'],
    ['prop', 'Proportion'],
    ['rule3', 'Règle de 3'],
  ]

  const run = () => {
    let r = null
    let label = ''
    switch (tool) {
      case 'area':
        r = calcAreaRect(a, b)
        label = r != null ? `Surface = ${formatResult(r)} (L×l)` : 'Erreur'
        break
      case 'volume':
        r = calcVolumeBox(a, b, c)
        label = r != null ? `Volume = ${formatResult(r)}` : 'Erreur'
        break
      case 'slope': {
        const s = calcSlope(a, b)
        label = s ? `Pente ${formatResult(s.pct)} % · ${formatResult(s.deg)}°` : 'Erreur'
        r = s?.pct
        break
      }
      case 'angle': {
        r = calcAngleFromSides(a, b)
        label = r != null ? `Angle = ${formatResult(r)}°` : 'Erreur'
        break
      }
      case 'scale': {
        const s = convertDrawingScale(a, convFrom, scale || '1:50')
        label = s ? `Réel : ${s.mm} mm · ${s.cm} cm · ${s.m} m` : 'Erreur'
        r = s?.mm
        break
      }
      case 'conv':
        r = convertValue(a, convCat, convFrom, convTo)
        label = r !== '' ? `${a} ${convFrom} = ${r} ${convTo}` : 'Erreur'
        break
      case 'ratio': {
        const s = simplifyRatio(a, b)
        label = s ? `${s.a}:${s.b} ≈ ${formatResult(s.decimal)}` : 'Erreur'
        r = s?.decimal
        break
      }
      case 'prop':
      case 'rule3':
        r = proportion(a, b, c)
        label = r != null ? `${a} → ${b} = ${c} → ${formatResult(r)}` : 'Erreur'
        break
      default:
        break
    }
    setOut(label)
    if (r != null && label !== 'Erreur') onResult?.(String(r), label)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 0' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {tools.map(([id, l]) => (
          <button
            key={id}
            type="button"
            onClick={() => { setTool(id); setOut('') }}
            style={{
              padding: '5px 8px',
              borderRadius: 8,
              border: `1px solid ${tool === id ? T.accent : T.border}`,
              background: tool === id ? `${T.accent}18` : T.bg,
              color: tool === id ? T.accent : T.muted,
              fontSize: 9,
              fontWeight: tool === id ? 700 : 500,
              cursor: 'pointer',
            }}
          >
            {l}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <ArchField label={tool === 'volume' ? 'Long.' : tool === 'slope' ? 'Montée' : 'A / L / Valeur'} value={a} onChange={setA} T={T} />
        <ArchField label={tool === 'volume' ? 'Larg.' : tool === 'slope' ? 'Base' : 'B / l / Valeur'} value={b} onChange={setB} T={T} />
        {(tool === 'volume' || tool === 'prop' || tool === 'rule3') && (
          <ArchField label={tool === 'volume' ? 'Haut.' : 'C / ?'} value={c} onChange={setC} T={T} />
        )}
      </div>

      {tool === 'scale' && (
        <div style={{ fontSize: 9, color: T.muted }}>Échelle plan : {scale || '1:50'} · unité dessin : {convFrom}</div>
      )}

      {tool === 'conv' && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <select value={convCat} onChange={(e) => setConvCat(e.target.value)} style={{ flex: 1, minWidth: 80, padding: 6, borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.ink, fontSize: 10 }}>
            <option value="length">Longueur</option>
            <option value="area">Surface</option>
            <option value="volume">Volume</option>
          </select>
          <select value={convFrom} onChange={(e) => setConvFrom(e.target.value)} style={{ flex: 1, padding: 6, borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.ink, fontSize: 10 }}>
            {['mm', 'cm', 'm', 'km', 'in', 'ft'].map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          <span style={{ alignSelf: 'center', color: T.muted }}>→</span>
          <select value={convTo} onChange={(e) => setConvTo(e.target.value)} style={{ flex: 1, padding: 6, borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.ink, fontSize: 10 }}>
            {['mm', 'cm', 'm', 'km', 'in', 'ft'].map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      )}

      <button type="button" onClick={run} style={{ padding: '10px', borderRadius: 10, border: 'none', background: T.accent, color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
        Calculer
      </button>
      {out && (
        <div style={{ padding: '10px 12px', borderRadius: 10, background: `${T.accent}12`, border: `1px solid ${T.accent}44`, fontSize: 11, color: T.ink, lineHeight: 1.4 }}>
          {out}
        </div>
      )}
    </div>
  )
}

export default function CalculatorDrawer({
  T,
  open,
  onClose,
  stackOffset = 0,
  scale,
  display,
  setDisplay,
  calcMode,
  setCalcMode,
  angleMode,
  setAngleMode,
  layout,
  setLayout,
  floatPos,
  setFloatPos,
  minimized,
  setMinimized,
  memory,
  history,
  evaluate,
  applyPercent,
  memoryClear,
  memoryRecall,
  memoryAdd,
  memorySub,
  memoryStore,
  insertToken,
  backspace,
  clear,
  reuseHistory,
  copyResult,
}) {
  const dragRef = useRef(null)
  const width = calcDrawerWidth(calcMode, layout, open)

  const press = useCallback((k) => {
    if (k === 'C') { clear(); return }
    if (k === '⌫') { backspace(); return }
    if (k === '%') { applyPercent(); return }
    if (k === '=') { evaluate(); return }
    if (k === '()') { insertToken('('); return }
    insertToken(k)
  }, [clear, backspace, applyPercent, evaluate, insertToken])

  const startDrag = (e) => {
    if (layout !== 'float') return
    e.preventDefault()
    dragRef.current = { ox: e.clientX - floatPos.x, oy: e.clientY - floatPos.y }
    const move = (ev) => {
      if (!dragRef.current) return
      setFloatPos({
        x: Math.max(8, ev.clientX - dragRef.current.ox),
        y: Math.max(8, ev.clientY - dragRef.current.oy),
      })
    }
    const up = () => {
      dragRef.current = null
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  if (!open) return null

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: layout === 'float' ? floatPos.x : 24 + stackOffset,
          zIndex: TOKENS.zIndex.modal + 1,
          padding: '12px 16px',
          borderRadius: 999,
          border: `1px solid ${T.accent}`,
          background: T.accent,
          color: '#fff',
          fontWeight: 800,
          fontSize: 13,
          cursor: 'pointer',
          boxShadow: TOKENS.shadow.panel,
        }}
      >
        🧮 {display?.slice(0, 12)}
      </button>
    )
  }

  const shellStyle = layout === 'float'
    ? {
        position: 'fixed',
        left: floatPos.x,
        top: floatPos.y,
        width: calcMode === 'scientific' ? 380 : 340,
        maxHeight: 'min(88vh, 640px)',
        borderRadius: TOKENS.radius.lg,
        boxShadow: TOKENS.shadow.panel,
        border: `1px solid ${rgbaFromHex(T.border, 0.45)}`,
      }
    : {
        position: 'fixed',
        top: 0,
        right: stackOffset,
        bottom: 0,
        width,
        transform: 'translateX(0)',
        borderLeft: `1px solid ${rgbaFromHex(T.border, 0.45)}`,
      }

  const compactKeys = [
    ['MC', 'MR', 'M+', 'M−'],
    ['C', '⌫', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '−'],
    ['1', '2', '3', '+'],
    ['0', '0', '.', '='],
  ]

  const sciKeys = [
    ['DEG', 'sin', 'cos', 'tan', 'log', 'ln'],
    ['(', ')', 'x^y', '√', 'π', 'e'],
    ['MC', 'MR', 'M+', 'M−', 'mod', 'abs'],
    ['C', '⌫', '%', '÷', '×', '−'],
    ['7', '8', '9', '+', '1/x', '±'],
    ['4', '5', '6', '1', '2', '3'],
    ['0', '0', '.', '=', '.', '.'],
  ]

  const handleSci = (k) => {
    if (k === 'DEG') { setAngleMode((m) => (m === 'deg' ? 'rad' : 'deg')); return }
    if (k === 'MC') { memoryClear(); return }
    if (k === 'MR') { memoryRecall(); return }
    if (k === 'M+') { memoryAdd(); return }
    if (k === 'M−') { memorySub(); return }
    if (k === 'x^y') { insertToken('^'); return }
    if (k === '√') { insertToken('sqrt('); return }
    if (k === 'π') { insertToken('PI'); return }
    if (k === 'e') { insertToken('E'); return }
    if (k === 'mod') { insertToken(' mod '); return }
    if (k === 'abs') { insertToken('abs('); return }
    if (k === '1/x') {
      setDisplay((s) => (s === 'Erreur' ? '0' : `1/(${s})`))
      return
    }
    if (k === '±') {
      setDisplay((s) => {
        if (s === 'Erreur' || s === '0') return '0'
        return s.startsWith('-') ? s.slice(1) : `-${s}`
      })
      return
    }
    if (['sin', 'cos', 'tan', 'log', 'ln'].includes(k)) { insertToken(`${k}(`); return }
    press(k === '0' && calcMode === 'scientific' ? '0' : k)
  }

  const handleCompact = (k, row, col) => {
    if (k === 'MC') { memoryClear(); return }
    if (k === 'MR') { memoryRecall(); return }
    if (k === 'M+') { memoryAdd(); return }
    if (k === 'M−') { memorySub(); return }
    if (row === 5 && col === 0) { /* wide 0 handled by grid */ }
    press(k)
  }

  const keyGrid = calcMode === 'scientific' ? sciKeys : compactKeys
  const cols = calcMode === 'scientific' ? 6 : 4

  return (
    <div
      className="forma-animate-in"
      style={{
        ...shellStyle,
        zIndex: TOKENS.zIndex.modal,
        display: 'flex',
        flexDirection: 'column',
        ...glassStyle(T, { variant: 'panel', blur: TOKENS.blur.lg, opacity: 0.92 }),
      }}
    >
      <div
        onPointerDown={layout === 'float' ? startDrag : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px 8px',
          borderBottom: `1px solid ${rgbaFromHex(T.border, 0.35)}`,
          cursor: layout === 'float' ? 'grab' : 'default',
          touchAction: 'none',
        }}
      >
        <div style={{ fontWeight: 900, fontSize: 12, color: T.ink }}>🧮 Calculatrice</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {['compact', 'scientific', 'arch'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setCalcMode(m)}
              style={{
                padding: '4px 8px',
                borderRadius: 8,
                border: `1px solid ${calcMode === m ? T.accent : T.border}`,
                background: calcMode === m ? `${T.accent}18` : 'transparent',
                color: calcMode === m ? T.accent : T.muted,
                fontSize: 9,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {m === 'compact' ? 'Simple' : m === 'scientific' ? 'Sci.' : 'Archi'}
            </button>
          ))}
          <GlassButton T={T} size="md" onClick={() => setLayout((l) => (l === 'drawer' ? 'float' : 'drawer'))} style={{ fontSize: 9 }}>
            {layout === 'float' ? 'Dock' : 'Flottant'}
          </GlassButton>
          <button type="button" onClick={() => setMinimized(true)} title="Réduire" className="forma-btn-glass" style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 16, padding: '2px 6px' }}>−</button>
          <button type="button" onClick={onClose} className="forma-btn-glass" style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 20, lineHeight: 1, padding: '2px 6px' }}>×</button>
        </div>
      </div>

      <div style={{ padding: '10px 14px 6px', background: rgbaFromHex(T.bg, 0.35) }}>
        {calcMode === 'scientific' && (
          <div style={{ fontSize: 9, color: T.muted, textAlign: 'right', marginBottom: 2 }}>
            {angleMode === 'deg' ? 'DEG' : 'RAD'} {memory !== 0 && `· M=${formatResult(memory)}`}
          </div>
        )}
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 700,
          fontSize: calcMode === 'scientific' ? 26 : 30,
          color: T.ink,
          textAlign: 'right',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          minHeight: 36,
        }}>
          {display}
        </div>
      </div>

      {calcMode !== 'arch' && (
        <div style={{ padding: '6px 14px 8px', borderBottom: `1px solid ${rgbaFromHex(T.border, 0.35)}`, maxHeight: 120, overflowY: 'auto' }}>
          <div style={{ fontSize: 8, fontWeight: 800, color: T.muted, letterSpacing: 0.8, marginBottom: 4 }}>HISTORIQUE</div>
          {history.length === 0 ? (
            <div style={{ fontSize: 10, color: T.muted }}>Aucun calcul.</div>
          ) : (
            history.slice(0, 8).map((h) => (
              <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <button type="button" onClick={() => reuseHistory(h)} style={{ flex: 1, textAlign: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: T.muted, padding: '2px 0' }}>
                  {h.expr} = <strong style={{ color: T.ink }}>{h.result}</strong>
                </button>
                <button type="button" onClick={() => copyResult(h.result)} title="Copier" style={{ background: `${T.accent}18`, border: 'none', borderRadius: 6, padding: '2px 6px', fontSize: 9, color: T.accent, cursor: 'pointer' }}>⧉</button>
              </div>
            ))
          )}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {calcMode === 'arch' ? (
          <ArchToolsPanel T={T} scale={scale} onResult={(val) => setDisplay(val)} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8 }}>
            {keyGrid.flatMap((row, ri) =>
              row.map((k, ci) => {
                if (calcMode === 'compact' && ri === 5 && ci === 1) return null
                if (calcMode === 'scientific' && ri === 6 && (ci === 1 || ci >= 4)) return null
                const wide = (calcMode === 'compact' && ri === 5 && ci === 0) || (calcMode === 'scientific' && ri === 6 && ci === 0)
                const isEq = calcMode === 'scientific' && ri === 6 && ci === 3
                return (
                  <CalcBtn
                    key={`${ri}-${ci}-${k}`}
                    label={isEq ? '=' : k === 'DEG' ? angleMode.toUpperCase() : k}
                    wide={wide}
                    T={T}
                    variant={['MC', 'MR', 'M+', 'M−'].includes(k) ? 'mem' : ['sin', 'cos', 'tan', 'log', 'ln', '√', 'π', 'e', 'mod', 'abs', 'x^y', '1/x', '±'].includes(k) ? 'fn' : ['C', '⌫'].includes(k) ? 'danger' : 'num'}
                    active={k === 'DEG'}
                    onClick={() => (calcMode === 'scientific' ? handleSci(isEq ? '=' : k) : handleCompact(k, ri, ci))}
                  />
                )
              }),
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export { calcDrawerWidth }
