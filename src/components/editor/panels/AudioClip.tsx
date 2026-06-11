import { useEffect, useState } from 'react'
import { resolveRecordingUrl } from '../../../services/audio'
import type { AudioRecording } from '../../../types'

export function AudioClip({
  rec,
  audioRef,
}: {
  rec: AudioRecording
  audioRef?: (el: HTMLAudioElement | null) => void
}) {
  const [src, setSrc] = useState('')

  useEffect(() => {
    let alive = true
    void resolveRecordingUrl(rec).then((url) => {
      if (alive) setSrc(url)
    })
    return () => {
      alive = false
    }
  }, [rec.id, rec.assetId, rec.dataUrl])

  if (!src) return <p className="text-xs text-forma-muted">Chargement audio…</p>
  return (
    <audio
      ref={audioRef}
      src={src}
      controls
      className="w-full mb-1"
    />
  )
}
