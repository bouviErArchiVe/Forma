import { useEffect, useMemo } from 'react'

const CAT_EMOJIS = ['🐱', '😺', '🐈', '😸']

/** Overlay non bloquant — emojis 2,5 s max */
export default function EmojiBurst({ burst, onDone }) {
  const particles = useMemo(() => {
    if (!burst) return []
    const emoji = burst.type === 'poop' ? '💩' : CAT_EMOJIS
    return Array.from({ length: 22 }, (_, i) => ({
      id: `${burst.id}-${i}`,
      char: burst.type === 'poop' ? emoji : emoji[i % emoji.length],
      left: 4 + Math.random() * 92,
      delay: Math.random() * 0.45,
      duration: 1.4 + Math.random() * 1.1,
      size: 16 + Math.random() * 28,
      drift: -30 + Math.random() * 60,
    }))
  }, [burst])

  useEffect(() => {
    if (!burst) return
    const t = setTimeout(() => onDone?.(), 2500)
    return () => clearTimeout(t)
  }, [burst, onDone])

  useEffect(() => {
    if (!burst) return
    const id = 'forma-emoji-burst-kf'
    if (document.getElementById(id)) return
    const style = document.createElement('style')
    style.id = id
    style.textContent = `
      @keyframes formaEmojiBurst {
        0% { transform: translateY(0) translateX(0) scale(0.6); opacity: 0; }
        12% { opacity: 1; transform: translateY(-8vh) translateX(0) scale(1); }
        100% { transform: translateY(-105vh) translateX(var(--drift)) scale(1.1); opacity: 0; }
      }
    `
    document.head.appendChild(style)
  }, [burst])

  if (!burst || !particles.length) return null

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 99999,
        overflow: 'hidden',
      }}
    >
      {particles.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            bottom: '-5%',
            fontSize: p.size,
            lineHeight: 1,
            animation: `formaEmojiBurst ${p.duration}s ease-out ${p.delay}s forwards`,
            '--drift': `${p.drift}px`,
          }}
        >
          {p.char}
        </span>
      ))}
    </div>
  )
}
