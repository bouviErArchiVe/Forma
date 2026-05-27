import { useState, useCallback, useEffect } from 'react'
import { evaluateExpression, formatResult, percentOf } from '@/lib/calculatorEngine'

const HIST_KEY = 'forma_calc_history'

function loadHistory() {
  try {
    const raw = JSON.parse(localStorage.getItem(HIST_KEY) || '[]')
    return Array.isArray(raw) ? raw.slice(0, 30) : []
  } catch {
    return []
  }
}

function saveHistory(h) {
  try {
    localStorage.setItem(HIST_KEY, JSON.stringify(h.slice(0, 30)))
  } catch { /* ignore */ }
}

export function useCalculator() {
  const [display, setDisplay] = useState('0')
  const [memory, setMemory] = useState(0)
  const [calcMode, setCalcMode] = useState('compact') // compact | scientific | arch
  const [angleMode, setAngleMode] = useState('deg')
  const [layout, setLayout] = useState('drawer') // drawer | float
  const [floatPos, setFloatPos] = useState({ x: 24, y: 72 })
  const [minimized, setMinimized] = useState(false)
  const [history, setHistory] = useState(loadHistory)

  useEffect(() => {
    saveHistory(history)
  }, [history])

  const pushHistory = useCallback((expr, result) => {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      expr: String(expr),
      result: String(result),
      ts: Date.now(),
    }
    setHistory((h) => [entry, ...h].slice(0, 30))
    return entry
  }, [])

  const evaluate = useCallback(() => {
    const r = evaluateExpression(display, { angleMode })
    const rs = formatResult(r)
    if (r !== null) pushHistory(display, rs)
    setDisplay(rs)
    return rs
  }, [display, angleMode, pushHistory])

  const applyPercent = useCallback(() => {
    const r = evaluateExpression(display, { angleMode })
    if (r === null) return
    const rs = formatResult(r / 100)
    pushHistory(`${display} %`, rs)
    setDisplay(rs)
  }, [display, angleMode, pushHistory])

  const memoryClear = useCallback(() => setMemory(0), [])
  const memoryRecall = useCallback(() => setDisplay(formatResult(memory)), [memory])
  const memoryAdd = useCallback(() => {
    const r = evaluateExpression(display, { angleMode })
    if (r !== null) setMemory((m) => m + r)
  }, [display, angleMode])
  const memorySub = useCallback(() => {
    const r = evaluateExpression(display, { angleMode })
    if (r !== null) setMemory((m) => m - r)
  }, [display, angleMode])
  const memoryStore = useCallback(() => {
    const r = evaluateExpression(display, { angleMode })
    if (r !== null) setMemory(r)
  }, [display, angleMode])

  const insertToken = useCallback((token) => {
    setDisplay((s) => {
      if (s === 'Erreur' || s === '0') {
        if (token === '.') return '0.'
        if (['+', '−', '×', '÷', '*', '/'].includes(token)) return s
        return token
      }
      return s + token
    })
  }, [])

  const backspace = useCallback(() => {
    setDisplay((s) => (s.length <= 1 || s === 'Erreur' ? '0' : s.slice(0, -1)))
  }, [])

  const clear = useCallback(() => setDisplay('0'), [])

  const reuseHistory = useCallback((entry) => {
    if (entry?.expr) setDisplay(entry.expr)
  }, [])

  const copyResult = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(String(text))
      return true
    } catch {
      return false
    }
  }, [])

  return {
    display,
    setDisplay,
    memory,
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
    history,
    setHistory,
    pushHistory,
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
    evaluateExpression: (expr) => evaluateExpression(expr, { angleMode }),
    formatResult,
    percentOf,
  }
}

export function calcDrawerWidth(calcMode, layout, open) {
  if (!open || layout === 'float') return 0
  if (calcMode === 'scientific') return 440
  if (calcMode === 'arch') return 400
  return 320
}
