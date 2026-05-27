import { useCallback, useEffect, useRef, useState } from 'react'
import { getSpeechRecognitionCtor, isSpeechRecognitionSupported } from '@/lib/speechRecognition'

/** Hook dictée vocale — continuous + interim results */
export function useDictation({ lang = 'fr-FR' } = {}) {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interim, setInterim] = useState('')
  const [error, setError] = useState(null)
  const recRef = useRef(null)
  const wantListenRef = useRef(false)
  const langRef = useRef(lang)

  useEffect(() => {
    langRef.current = lang
  }, [lang])

  const stop = useCallback(() => {
    wantListenRef.current = false
    try {
      recRef.current?.stop()
    } catch {
      /* ignore */
    }
    recRef.current = null
    setListening(false)
    setInterim('')
  }, [])

  const start = useCallback(() => {
    if (!isSpeechRecognitionSupported()) {
      setError('Dictée non supportée ici. Utilisez Safari (iPad) ou Chrome.')
      return
    }

    setError(null)
    wantListenRef.current = true

    const SR = getSpeechRecognitionCtor()
    const rec = new SR()
    rec.lang = langRef.current
    rec.continuous = true
    rec.interimResults = true

    rec.onresult = (event) => {
      let finalChunk = ''
      let interimChunk = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const text = result[0]?.transcript || ''
        if (result.isFinal) finalChunk += text
        else interimChunk += text
      }
      if (finalChunk.trim()) {
        setTranscript((prev) => (prev ? `${prev} ${finalChunk.trim()}` : finalChunk.trim()))
      }
      setInterim(interimChunk)
    }

    rec.onerror = (event) => {
      if (event.error === 'not-allowed') {
        setError('Microphone refusé — autorisez l\'accès dans les paramètres du navigateur.')
      } else if (event.error === 'no-speech') {
        setError('Aucune voix détectée. Rapprochez-vous du micro.')
      } else if (event.error !== 'aborted') {
        setError(`Erreur dictée : ${event.error}`)
      }
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        wantListenRef.current = false
        setListening(false)
      }
    }

    rec.onend = () => {
      setInterim('')
      if (wantListenRef.current) {
        try {
          rec.start()
        } catch {
          wantListenRef.current = false
          setListening(false)
        }
      } else {
        setListening(false)
      }
    }

    recRef.current = rec
    try {
      rec.start()
      setListening(true)
    } catch {
      setError('Impossible de démarrer la dictée.')
      wantListenRef.current = false
      setListening(false)
    }
  }, [])

  const toggle = useCallback(() => {
    if (listening) stop()
    else start()
  }, [listening, start, stop])

  const clear = useCallback(() => {
    setTranscript('')
    setInterim('')
    setError(null)
  }, [])

  useEffect(() => () => {
    wantListenRef.current = false
    try {
      recRef.current?.stop()
    } catch {
      /* ignore */
    }
  }, [])

  return {
    supported: isSpeechRecognitionSupported(),
    listening,
    transcript,
    interim,
    error,
    setTranscript,
    clear,
    toggle,
    start,
    stop,
  }
}
