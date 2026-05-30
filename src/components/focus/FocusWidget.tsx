import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { GlassPanel } from '../ui/GlassPanel'
import { useFocusStore } from '../../stores/focusStore'
import { formatTime, ringOffset } from '../../lib/focus/timer'

const R = 38
const CIRC = 2 * Math.PI * R

function playBeep() {
  try {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    const ctx = new Ctor()
    ;[0, 0.35, 0.7].forEach((t) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.connect(g)
      g.connect(ctx.destination)
      osc.frequency.value = 440
      g.gain.setValueAtTime(0.25, ctx.currentTime + t)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.3)
      osc.start(ctx.currentTime + t)
      osc.stop(ctx.currentTime + t + 0.35)
    })
  } catch {
    /* audio indisponible */
  }
}

export function FocusWidget() {
  const open = useFocusStore((s) => s.open)
  const running = useFocusStore((s) => s.running)
  const mode = useFocusStore((s) => s.mode)
  const secondsLeft = useFocusStore((s) => s.secondsLeft)
  const workMin = useFocusStore((s) => s.workMin)
  const breakMin = useFocusStore((s) => s.breakMin)
  const alarmType = useFocusStore((s) => s.alarmType)
  const customAlarm = useFocusStore((s) => s.customAlarm)
  const dingCount = useFocusStore((s) => s.dingCount)

  const setOpen = useFocusStore((s) => s.setOpen)
  const toggleRun = useFocusStore((s) => s.toggleRun)
  const reset = useFocusStore((s) => s.reset)
  const tick = useFocusStore((s) => s.tick)
  const setMode = useFocusStore((s) => s.setMode)
  const setWorkMin = useFocusStore((s) => s.setWorkMin)
  const setBreakMin = useFocusStore((s) => s.setBreakMin)
  const setAlarmType = useFocusStore((s) => s.setAlarmType)
  const setCustomAlarm = useFocusStore((s) => s.setCustomAlarm)

  const [showConfig, setShowConfig] = useState(false)
  const [recording, setRecording] = useState(false)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const lastDingRef = useRef(dingCount)

  const playAlarm = () => {
    if (alarmType === 'custom' && customAlarm) {
      new Audio(customAlarm).play().catch(() => {})
    } else {
      playBeep()
    }
  }

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => tick(), 1000)
    return () => window.clearInterval(id)
  }, [running, tick])

  useEffect(() => {
    if (dingCount !== lastDingRef.current) {
      lastDingRef.current = dingCount
      playAlarm()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dingCount])

  if (!open) return null

  const total = (mode === 'work' ? workMin : breakMin) * 60

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream)
      chunksRef.current = []
      rec.ondataavailable = (e) => chunksRef.current.push(e.data)
      rec.onstop = () => {
        const reader = new FileReader()
        reader.onload = () => setCustomAlarm(String(reader.result))
        reader.readAsDataURL(new Blob(chunksRef.current, { type: 'audio/webm' }))
        stream.getTracks().forEach((t) => t.stop())
      }
      rec.start()
      mediaRef.current = rec
      setRecording(true)
    } catch {
      setRecording(false)
    }
  }

  const stopRec = () => {
    mediaRef.current?.stop()
    setRecording(false)
  }

  const importAudio = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCustomAlarm(String(reader.result))
    reader.readAsDataURL(file)
  }

  return (
    <GlassPanel
      variant="float"
      className="fixed bottom-6 right-6 z-[200] w-[268px] rounded-2xl p-5 border border-forma-border/60 shadow-2xl"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="font-bold text-sm">⚡ Mode Focus</div>
        <div className="flex gap-2">
          <button
            type="button"
            title="Configurer"
            onClick={() => setShowConfig((v) => !v)}
            className={`text-base ${showConfig ? 'text-forma-accent' : 'text-forma-muted'}`}
          >
            ⚙
          </button>
          <button type="button" onClick={() => setOpen(false)} className="text-forma-muted text-lg leading-none">
            ×
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-3 bg-forma-bg/60 rounded-xl p-1 border border-forma-border/50">
        {(
          [
            ['work', '⚡ Focus'],
            ['break', '☕ Pause'],
          ] as const
        ).map(([m, label]) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
              mode === m ? 'bg-forma-accent text-white' : 'text-forma-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="relative flex justify-center items-center h-24 mb-3">
        <svg width={96} height={96} className="absolute -rotate-90">
          <circle cx={48} cy={48} r={R} fill="none" stroke="var(--forma-border)" strokeWidth={7} />
          <circle
            cx={48}
            cy={48}
            r={R}
            fill="none"
            stroke="var(--forma-accent)"
            strokeWidth={7}
            strokeDasharray={CIRC}
            strokeDashoffset={ringOffset(secondsLeft, total, CIRC)}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset .6s ease' }}
          />
        </svg>
        <div className="text-center z-[1]">
          <div className="font-mono text-2xl font-bold tracking-widest leading-none">{formatTime(secondsLeft)}</div>
          <div className="text-[9px] text-forma-muted mt-1">
            {mode === 'work' ? `${workMin} min focus` : `${breakMin} min pause`}
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-center mb-3">
        <button
          type="button"
          onClick={toggleRun}
          className="px-6 py-2 rounded-xl bg-forma-accent text-white font-bold text-sm shadow-lg"
        >
          {running ? '⏸' : '▶'}
        </button>
        <button
          type="button"
          onClick={reset}
          title="Réinitialiser"
          className="px-3.5 py-2 rounded-xl bg-forma-bg/60 border border-forma-border/60 text-forma-muted"
        >
          ↺
        </button>
        <button
          type="button"
          onClick={playAlarm}
          title="Tester l'alarme"
          className="px-3.5 py-2 rounded-xl bg-forma-bg/60 border border-forma-border/60 text-forma-muted"
        >
          🔔
        </button>
      </div>

      {showConfig && (
        <div className="border-t border-forma-border/50 pt-3 flex flex-col gap-2.5">
          <div className="flex gap-2">
            <label className="flex-1">
              <div className="text-[9px] text-forma-muted mb-1">FOCUS (min)</div>
              <input
                type="number"
                min={1}
                max={120}
                value={workMin}
                onChange={(e) => setWorkMin(Number(e.target.value))}
                className="w-full px-1.5 py-1 rounded-lg border border-forma-border bg-forma-bg/60 text-sm outline-none"
              />
            </label>
            <label className="flex-1">
              <div className="text-[9px] text-forma-muted mb-1">PAUSE (min)</div>
              <input
                type="number"
                min={1}
                max={120}
                value={breakMin}
                onChange={(e) => setBreakMin(Number(e.target.value))}
                className="w-full px-1.5 py-1 rounded-lg border border-forma-border bg-forma-bg/60 text-sm outline-none"
              />
            </label>
          </div>

          <div>
            <div className="text-[9px] text-forma-muted mb-1.5">ALARME</div>
            <div className="flex gap-1 mb-1.5">
              {(
                [
                  ['default', '🔔 Défaut'],
                  ['custom', '🎵 Perso'],
                ] as const
              ).map(([t, label]) => {
                const enabled = t === 'default' || !!customAlarm
                const active = alarmType === t && enabled
                return (
                  <button
                    key={t}
                    type="button"
                    disabled={!enabled}
                    onClick={() => setAlarmType(t)}
                    className={`flex-1 py-1 rounded-lg text-[10px] border ${
                      active ? 'border-forma-accent bg-forma-accent/10 text-forma-accent' : 'border-forma-border text-forma-muted'
                    } ${!enabled ? 'opacity-50' : ''}`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={recording ? stopRec : startRec}
                className={`flex-1 py-1 rounded-lg text-[10px] border ${
                  recording ? 'border-red-500 bg-red-500/10 text-red-500 font-bold' : 'border-forma-border text-forma-muted'
                }`}
              >
                {recording ? '⏹ Stop' : '🎙 Enregistrer'}
              </button>
              <label className="flex-1 py-1 rounded-lg text-[10px] border border-forma-border text-forma-muted text-center cursor-pointer">
                📁 Importer
                <input type="file" accept="audio/*" onChange={importAudio} className="hidden" />
              </label>
            </div>
            {customAlarm && <div className="text-[9px] text-forma-accent mt-1">✓ Son personnalisé enregistré</div>}
          </div>
        </div>
      )}
    </GlassPanel>
  )
}
