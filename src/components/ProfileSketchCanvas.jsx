import { useRef, useEffect, useCallback, useState } from 'react'

const SIZE = 200

/** Mini canvas pour dessiner un profil structurel à la main. */
export default function ProfileSketchCanvas({ T, value, onChange, strokeColor = '#546e7a' }) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const last = useRef(null)
  const [tool, setTool] = useState('pen')

  const redrawBg = useCallback((ctx) => {
    ctx.fillStyle = '#f8f9fb'
    ctx.fillRect(0, 0, SIZE, SIZE)
    ctx.strokeStyle = `${T.border}88`
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.strokeRect(0.5, 0.5, SIZE - 1, SIZE - 1)
    ctx.setLineDash([])
    ctx.strokeStyle = `${T.muted}33`
    ctx.beginPath()
    ctx.moveTo(SIZE / 2, 0)
    ctx.lineTo(SIZE / 2, SIZE)
    ctx.moveTo(0, SIZE / 2)
    ctx.lineTo(SIZE, SIZE / 2)
    ctx.stroke()
  }, [T.border, T.muted])

  const loadImage = useCallback((url) => {
    const canvas = canvasRef.current
    if (!canvas || !url) return
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      redrawBg(ctx)
      const scale = Math.min((SIZE - 16) / img.width, (SIZE - 16) / img.height, 1)
      const w = img.width * scale
      const h = img.height * scale
      ctx.drawImage(img, (SIZE - w) / 2, (SIZE - h) / 2, w, h)
    }
    img.src = url
  }, [redrawBg])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (value) loadImage(value)
    else {
      redrawBg(ctx)
    }
  }, [value, loadImage, redrawBg])

  const emitChange = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    onChange?.(canvas.toDataURL('image/png'))
  }, [onChange])

  const pos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = SIZE / rect.width
    const scaleY = SIZE / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const onDown = (e) => {
    e.preventDefault()
    drawing.current = true
    last.current = pos(e)
  }

  const onMove = (e) => {
    if (!drawing.current) return
    e.preventDefault()
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const p = pos(e)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.lineWidth = 14
      ctx.strokeStyle = 'rgba(0,0,0,1)'
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.lineWidth = 3
      ctx.strokeStyle = strokeColor
    }
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    ctx.globalCompositeOperation = 'source-over'
    last.current = p
  }

  const onUp = () => {
    if (!drawing.current) return
    drawing.current = false
    last.current = null
    emitChange()
  }

  const clear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    redrawBg(ctx)
    onChange?.(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {[['pen', '✏'], ['eraser', '◻']].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTool(id)}
            style={{
              flex: 1,
              padding: '4px 0',
              borderRadius: 6,
              border: `1px solid ${tool === id ? T.accent : T.border}`,
              background: tool === id ? `${T.accent}15` : T.bg,
              color: tool === id ? T.accent : T.muted,
              fontSize: 10,
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={clear}
          style={{
            padding: '4px 8px',
            borderRadius: 6,
            border: `1px solid ${T.border}`,
            background: T.bg,
            color: T.muted,
            fontSize: 9,
            cursor: 'pointer',
          }}
        >
          Effacer
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={SIZE}
        height={SIZE}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        style={{
          width: '100%',
          maxWidth: SIZE,
          aspectRatio: '1',
          borderRadius: 8,
          border: `1px solid ${T.border}`,
          touchAction: 'none',
          cursor: tool === 'eraser' ? 'cell' : 'crosshair',
          display: 'block',
        }}
      />
      <div style={{ fontSize: 8, color: T.muted, textAlign: 'center' }}>
        Dessine la coupe de ton profil (200×200)
      </div>
    </div>
  )
}
