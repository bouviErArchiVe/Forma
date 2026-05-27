import { useCallback, useEffect, useRef, useState } from 'react'

export default function DocSketchPad({ T, sketch, onSave, onClose }) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const strokes = useRef(sketch?.strokes ? JSON.parse(JSON.stringify(sketch.strokes)) : [])
  const [color, setColor] = useState('#1c1c24')
  const [size, setSize] = useState(2)

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    strokes.current.forEach((s) => {
      if (!s.pts?.length) return
      ctx.strokeStyle = s.color
      ctx.lineWidth = s.size
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      s.pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
      ctx.stroke()
    })
  }, [])

  useEffect(() => { redraw() }, [redraw])

  const pos = (e) => {
    const r = canvasRef.current.getBoundingClientRect()
    const scaleX = canvasRef.current.width / r.width
    const scaleY = canvasRef.current.height / r.height
    return { x: (e.clientX - r.left) * scaleX, y: (e.clientY - r.top) * scaleY }
  }

  const onDown = (e) => {
    drawing.current = true
    strokes.current.push({ color, size, pts: [pos(e)] })
  }

  const onMove = (e) => {
    if (!drawing.current) return
    strokes.current[strokes.current.length - 1].pts.push(pos(e))
    redraw()
  }

  const onUp = () => { drawing.current = false }

  return (
    <div style={{ background: T.surface, borderRadius: 14, padding: 16, width: 'min(560px,94vw)', border: `1px solid ${T.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <strong style={{ fontFamily: "'Syne',sans-serif" }}>Croquis</strong>
        <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: T.muted }}>×</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 32, height: 32, border: 'none' }} />
        <input type="range" min={1} max={8} value={size} onChange={(e) => setSize(parseInt(e.target.value, 10))} />
        <button type="button" onClick={() => { strokes.current.pop(); redraw() }} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, cursor: 'pointer', fontSize: 12 }}>Annuler trait</button>
        <button type="button" onClick={() => { strokes.current = []; redraw() }} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, cursor: 'pointer', fontSize: 12 }}>Effacer</button>
      </div>
      <canvas
        ref={canvasRef}
        width={sketch.width}
        height={sketch.height}
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        style={{ width: '100%', height: 'auto', border: `1px solid ${T.border}`, borderRadius: 8, cursor: 'crosshair', touchAction: 'none' }}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onClose} style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, cursor: 'pointer' }}>Annuler</button>
        <button type="button" onClick={() => onSave({ ...sketch, strokes: JSON.parse(JSON.stringify(strokes.current)) })} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: T.accent, color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Insérer</button>
      </div>
    </div>
  )
}
