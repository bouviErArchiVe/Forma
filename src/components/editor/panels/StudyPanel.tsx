import { useCallback, useEffect, useRef, useState } from 'react'
import { importStudyCardsFromCsv } from '../../../lib/study-import'
import { downloadStudyCardsCsv } from '../../../lib/study-export'
import { addCard, deleteCard, getCards, getDueCards, rateCard, updateCard } from '../../../services/study'
import { getNotebook } from '../../../services/library'
import { useToastStore } from '../../../stores/toastStore'
import type { StudyCard } from '../../../types'

interface StudyPanelProps {
  notebookId: string
  pageText?: string
  selectionText?: string
}

export function StudyPanel({ notebookId, pageText = '', selectionText = '' }: StudyPanelProps) {
  const [cards, setCards] = useState<StudyCard[]>([])
  const [dueCount, setDueCount] = useState(0)
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [review, setReview] = useState<StudyCard | null>(null)
  const [flipped, setFlipped] = useState(false)
  const [msg, setMsg] = useState('')
  const importRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setCards(await getCards(notebookId))
    setDueCount((await getDueCards(notebookId)).length)
  }, [notebookId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (selectionText.trim()) {
      setFront(selectionText.slice(0, 200))
      setBack('')
    }
  }, [selectionText])

  const startReview = async (shuffle = false) => {
    let due = await getDueCards(notebookId)
    if (shuffle && due.length > 1) {
      due = [...due].sort(() => Math.random() - 0.5)
    }
    if (due.length) {
      setReview(due[0])
      setFlipped(false)
      setMsg('')
    } else {
      setMsg('Aucune carte à réviser pour le moment.')
      setReview(null)
    }
  }

  const rate = async (q: 0 | 1 | 2 | 3) => {
    if (!review) return
    const updated = rateCard(review, q)
    await updateCard(review.id, updated)
    const due = await getDueCards(notebookId)
    if (due.length) {
      setReview(due[0])
      setFlipped(false)
    } else {
      setReview(null)
      setMsg('Session terminée.')
    }
    load()
  }

  const addFromPage = async () => {
    const snippet = pageText.trim().slice(0, 300)
    if (!snippet) return
    await addCard(notebookId, snippet.slice(0, 120), snippet)
    useToastStore.getState().show('Carte créée depuis le texte de la page')
    load()
  }

  return (
    <div className="space-y-3 text-sm">
      <h3 className="font-medium">Study Set</h3>
      <input
        value={front}
        onChange={(e) => setFront(e.target.value)}
        placeholder="Recto"
        className="w-full border rounded px-2 py-1"
      />
      <input
        value={back}
        onChange={(e) => setBack(e.target.value)}
        placeholder="Verso"
        className="w-full border rounded px-2 py-1"
      />
      <button
        type="button"
        className="w-full py-1.5 bg-forma-accent text-white rounded"
        onClick={async () => {
          if (front.trim() && back.trim()) {
            await addCard(notebookId, front, back)
            setFront('')
            setBack('')
            useToastStore.getState().show('Carte ajoutée')
            load()
          }
        }}
      >
        Ajouter carte
      </button>
      {pageText.trim() && (
        <button type="button" onClick={addFromPage} className="w-full py-1.5 border rounded text-xs">
          + Carte depuis texte page
        </button>
      )}
      <div className="flex gap-1">
        <button
          type="button"
          className="flex-1 py-1.5 border rounded text-xs"
          onClick={() => importRef.current?.click()}
        >
          Importer CSV
        </button>
        {cards.length > 0 && (
          <button
            type="button"
            className="flex-1 py-1.5 border rounded text-xs"
            onClick={async () => {
              const nb = await getNotebook(notebookId)
              try {
                const n = await downloadStudyCardsCsv(notebookId, nb?.name ?? 'study')
                useToastStore.getState().show(`${n} carte(s) exportée(s)`)
              } catch (err) {
                useToastStore.getState().show(
                  err instanceof Error ? err.message : 'Export échoué',
                  5000,
                )
              }
            }}
          >
            Exporter ({cards.length})
          </button>
        )}
      </div>
      <input
        ref={importRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0]
          if (!f) return
          try {
            const n = await importStudyCardsFromCsv(notebookId, f)
            useToastStore.getState().show(`${n} carte(s) importée(s)`)
            load()
          } catch (err) {
            useToastStore.getState().show(
              err instanceof Error ? err.message : 'Import échoué',
              5000,
            )
          }
          e.target.value = ''
        }}
      />
      <div className="flex gap-1">
        <button type="button" onClick={() => startReview(false)} className="flex-1 py-1.5 border rounded">
          Réviser ({dueCount} / {cards.length})
        </button>
        <button
          type="button"
          title="Ordre aléatoire"
          onClick={() => startReview(true)}
          className="px-2 py-1.5 border rounded text-xs"
        >
          🔀
        </button>
      </div>
      {msg && <p className="text-xs text-forma-muted">{msg}</p>}
      {review && (
        <div className="p-3 border-2 border-forma-accent rounded-lg text-center">
          <p className="mb-2 min-h-[40px] whitespace-pre-wrap">{flipped ? review.back : review.front}</p>
          <button type="button" onClick={() => setFlipped(!flipped)} className="text-xs text-forma-accent mb-2">
            Retourner
          </button>
          <div className="flex gap-1 justify-center flex-wrap">
            <button type="button" onClick={() => rate(0)} className="px-2 py-1 bg-red-100 rounded text-xs">
              Difficile
            </button>
            <button type="button" onClick={() => rate(1)} className="px-2 py-1 bg-orange-100 rounded text-xs">
              Revoir
            </button>
            <button type="button" onClick={() => rate(2)} className="px-2 py-1 bg-yellow-100 rounded text-xs">
              Moyen
            </button>
            <button type="button" onClick={() => rate(3)} className="px-2 py-1 bg-green-100 rounded text-xs">
              Facile
            </button>
          </div>
        </div>
      )}
      <ul className="text-xs space-y-1 max-h-32 overflow-y-auto">
        {cards.map((c) => (
          <li key={c.id} className="flex justify-between gap-1">
            <span className="truncate">{c.front}</span>
            <button type="button" className="text-red-500" onClick={() => deleteCard(c.id).then(load)}>
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
