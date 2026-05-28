import { useRef, useState } from 'react'
import { FM_STICKERS, MSG_TYPES } from '@/lib/formamessage/constants'
import GlassButton from '@/components/ui/GlassButton'

export default function MessageComposer({
  T, disabled, replyTo, onCancelReply, onSend, onSendVoice, onShareForma,
}) {
  const [text, setText] = useState('')
  const [showStickers, setShowStickers] = useState(false)
  const [recording, setRecording] = useState(false)
  const fileRef = useRef(null)
  const photoRef = useRef(null)
  const mediaRef = useRef(null)
  const chunksRef = useRef([])

  const submitText = () => {
    const body = text.trim()
    if (!body) return
    onSend({ type: MSG_TYPES.text, body, replyTo: replyTo?.id || null })
    setText('')
    onCancelReply?.()
  }

  const handleFile = (e, asImage) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      onSend({
        type: asImage ? MSG_TYPES.image : MSG_TYPES.file,
        body: '',
        attachment: {
          name: file.name,
          mimeType: file.type,
          size: file.size,
          dataUrl: reader.result,
        },
        replyTo: replyTo?.id || null,
      })
      onCancelReply?.()
    }
    reader.readAsDataURL(file)
  }

  const startVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream)
      chunksRef.current = []
      rec.ondataavailable = (ev) => { if (ev.data.size) chunksRef.current.push(ev.data) }
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const reader = new FileReader()
        reader.onload = () => {
          onSendVoice?.({
            type: MSG_TYPES.voice,
            body: '',
            attachment: {
              name: 'vocal.webm',
              mimeType: 'audio/webm',
              size: blob.size,
              dataUrl: reader.result,
              durationSec: Math.max(1, Math.round(blob.size / 16000)),
            },
          })
        }
        reader.readAsDataURL(blob)
        setRecording(false)
      }
      rec.start()
      mediaRef.current = rec
      setRecording(true)
    } catch {
      onSendVoice?.({ error: 'Microphone non disponible' })
    }
  }

  const stopVoice = () => {
    mediaRef.current?.stop()
  }

  const field = {
    flex: 1, padding: '10px 12px', borderRadius: 10, border: `1px solid ${T.border}`,
    background: T.bg, color: T.ink, fontSize: 13, resize: 'none', minHeight: 42, maxHeight: 120,
  }

  return (
    <div style={{ borderTop: `1px solid ${T.border}`, padding: '10px 12px', background: T.surface }}>
      {replyTo && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.muted, marginBottom: 8, padding: '6px 10px', borderRadius: 8, background: `${T.accent}10` }}>
          <span>Réponse à : {(replyTo.body || '').slice(0, 60)}</span>
          <button type="button" onClick={onCancelReply} style={{ background: 'none', border: 'none', color: T.accent, cursor: 'pointer' }}>✕</button>
        </div>
      )}
      {showStickers && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {FM_STICKERS.map((s) => (
            <button key={s} type="button" onClick={() => { onSend({ type: MSG_TYPES.sticker, body: s }); setShowStickers(false) }} style={iconBtn(T)}>{s}</button>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <button type="button" title="Partager Forma" onClick={() => onShareForma?.()} disabled={disabled || !onShareForma} style={iconBtn(T)}>📓</button>
          <button type="button" title="Photo" onClick={() => photoRef.current?.click()} disabled={disabled} style={iconBtn(T)}>🖼</button>
          <button type="button" title="Fichier" onClick={() => fileRef.current?.click()} disabled={disabled} style={iconBtn(T)}>📎</button>
          <button type="button" title="Sticker" onClick={() => setShowStickers((v) => !v)} disabled={disabled} style={iconBtn(T)}>😊</button>
          <button
            type="button"
            title={recording ? 'Arrêter' : 'Vocal'}
            onClick={recording ? stopVoice : startVoice}
            disabled={disabled}
            style={{ ...iconBtn(T), background: recording ? '#e9456022' : T.panel }}
          >
            {recording ? '⏹' : '🎤'}
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitText() } }}
          placeholder="Écrire un message…"
          disabled={disabled}
          rows={1}
          style={field}
        />
        <GlassButton T={T} onClick={submitText} disabled={disabled || !text.trim()} style={{ padding: '10px 14px', fontSize: 12 }}>
          Envoyer
        </GlassButton>
      </div>
      <input ref={photoRef} type="file" accept="image/*" hidden onChange={(e) => handleFile(e, true)} />
      <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx,.txt" hidden onChange={(e) => handleFile(e, false)} />
    </div>
  )
}

const iconBtn = (T) => ({
  width: 36, height: 36, borderRadius: 8, border: `1px solid ${T.border}`,
  background: T.panel, cursor: 'pointer', fontSize: 16, flexShrink: 0,
})
