import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createLiveTranscriber,
  speechTranscriptionSupported,
} from '../../../lib/speech-transcribe'
import { addCard } from '../../../services/study'
import { useToastStore } from '../../../stores/toastStore'
import { deleteRecording, getRecordings, saveRecording } from '../../../services/audio'
import { AudioClip } from './AudioClip'
import type { AudioRecording } from '../../../types'

interface AudioPanelProps {
  notebookId: string
  pageId: string
  onSelectPage?: (pageId: string) => void
}

export function AudioPanel({ notebookId, pageId, onSelectPage }: AudioPanelProps) {
  const [recs, setRecs] = useState<AudioRecording[]>([])
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [liveTranscript, setLiveTranscript] = useState('')
  const [markers, setMarkers] = useState<{ time: number; pageId: string }[]>([])
  const mediaRef = useRef<MediaRecorder | null>(null)
  const transcriberRef = useRef<ReturnType<typeof createLiveTranscriber> | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startRef = useRef(0)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({})

  const load = useCallback(async () => {
    setRecs(await getRecordings(notebookId))
  }, [notebookId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
      transcriberRef.current?.abort()
    }
  }, [])

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      setLiveTranscript('')
      transcriberRef.current = createLiveTranscriber(setLiveTranscript)
      transcriberRef.current.start()
      mr.ondataavailable = (e) => chunksRef.current.push(e.data)
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const duration = (Date.now() - startRef.current) / 1000
        const transcript = transcriberRef.current?.stop() ?? liveTranscript
        transcriberRef.current?.abort()
        await saveRecording(notebookId, pageId, blob, duration, markers, transcript)
        stream.getTracks().forEach((t) => t.stop())
        if (tickRef.current) clearInterval(tickRef.current)
        setMarkers([])
        setElapsed(0)
        setLiveTranscript('')
        load()
      }
      mediaRef.current = mr
      startRef.current = Date.now()
      setMarkers([{ time: 0, pageId }])
      setElapsed(0)
      tickRef.current = setInterval(() => {
        setElapsed((Date.now() - startRef.current) / 1000)
      }, 200)
      mr.start()
      setRecording(true)
    } catch {
      useToastStore.getState().show('Microphone non autorisé ou indisponible', 5000)
    }
  }

  const stop = () => {
    mediaRef.current?.stop()
    setRecording(false)
    if (tickRef.current) clearInterval(tickRef.current)
  }

  const addMarker = () => {
    if (!recording) return
    setMarkers((m) => [...m, { time: elapsed, pageId }])
  }

  const jumpToMarker = (recId: string, time: number, targetPageId: string) => {
    const el = audioRefs.current[recId]
    if (el) {
      el.currentTime = time
      void el.play()
    }
    onSelectPage?.(targetPageId)
  }

  return (
    <div>
      <h3 className="font-medium text-sm mb-2">Enregistrement audio</h3>
      {speechTranscriptionSupported() && (
        <p className="text-xs text-forma-muted mb-2">
          Transcription live (navigateur) pendant l&apos;enregistrement.
        </p>
      )}
      {!recording ? (
        <button type="button" onClick={start} className="w-full py-2 bg-red-500 text-white rounded-lg text-sm mb-3">
          ● Enregistrer
        </button>
      ) : (
        <div className="space-y-2 mb-3">
          <p className="text-xs text-forma-muted text-center">{Math.round(elapsed)}s</p>
          {liveTranscript && (
            <p className="text-xs border rounded p-2 bg-gray-50 dark:bg-gray-800 max-h-20 overflow-y-auto">
              {liveTranscript}
            </p>
          )}
          <button
            type="button"
            onClick={addMarker}
            className="w-full py-1.5 border rounded-lg text-xs hover:bg-gray-50"
          >
            📍 Marquer cette page ({markers.length})
          </button>
          <button type="button" onClick={stop} className="w-full py-2 bg-gray-800 text-white rounded-lg text-sm animate-pulse">
            ■ Arrêter
          </button>
        </div>
      )}
      <ul className="space-y-2">
        {recs.map((r) => (
          <li key={r.id} className="text-xs border rounded p-2">
            <AudioClip
              rec={r}
              audioRef={(el) => {
                audioRefs.current[r.id] = el
              }}
            />
            <span className="text-forma-muted">{Math.round(r.duration)}s</span>
            {r.transcript?.trim() && (
              <>
                <p className="mt-1 text-forma-muted italic line-clamp-3">{r.transcript}</p>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <button
                    type="button"
                    className="text-forma-accent hover:underline"
                    onClick={async () => {
                      await navigator.clipboard.writeText(r.transcript!)
                      useToastStore.getState().show('Transcription copiée')
                    }}
                  >
                    Copier
                  </button>
                  <button
                    type="button"
                    className="text-forma-accent hover:underline"
                    onClick={async () => {
                      await addCard(notebookId, 'Audio', r.transcript!.slice(0, 500))
                      useToastStore.getState().show('Carte Study créée depuis la transcription')
                    }}
                  >
                    → Study Set
                  </button>
                </div>
              </>
            )}
            {r.markers.length > 0 && (
              <ul className="mt-2 space-y-1">
                {r.markers.map((m, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      className="text-forma-accent hover:underline"
                      onClick={() => jumpToMarker(r.id, m.time, m.pageId)}
                    >
                      {Math.round(m.time)}s → page
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              className="block text-red-600 mt-1"
              onClick={async () => {
                await deleteRecording(r.id)
                load()
              }}
            >
              Supprimer
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
