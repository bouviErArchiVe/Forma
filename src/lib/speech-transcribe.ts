interface SpeechRecognitionResultList {
  length: number
  [i: number]: { [j: number]: { transcript: string } }
}

interface SpeechRecognitionEvent {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function createLiveTranscriber(
  onPartial: (text: string) => void,
  lang = 'fr-FR',
): { start: () => void; stop: () => string; abort: () => void } {
  const Ctor = getSpeechRecognition()
  let full = ''
  let rec: SpeechRecognitionInstance | null = null

  if (!Ctor) {
    return {
      start: () => {},
      stop: () => '',
      abort: () => {},
    }
  }

  const start = () => {
    full = ''
    rec = new Ctor()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = lang
    rec.onresult = (e) => {
      let chunk = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        chunk += e.results[i][0].transcript
      }
      if (chunk) {
        full += (full && !full.endsWith(' ') ? ' ' : '') + chunk
        onPartial(full.trim())
      }
    }
    rec.onerror = () => {}
    try {
      rec.start()
    } catch {
      /* already started */
    }
  }

  const stop = () => {
    try {
      rec?.stop()
    } catch {
      /* ignore */
    }
    return full.trim()
  }

  const abort = () => {
    try {
      rec?.abort()
    } catch {
      /* ignore */
    }
    full = ''
  }

  return { start, stop, abort }
}

export function speechTranscriptionSupported(): boolean {
  return getSpeechRecognition() != null
}
