/**
 * FlashcardsPanel — création, liste et révision espacée (SRS) de flashcards.
 *
 * Réutilise les conventions UI Study (boutons forma-border, empty states,
 * dark mode). Logique de planification dans src/lib/study/srs.ts (pure) ;
 * persistance dans services/flashcards.ts. Si `subjectId` est fourni, les
 * cartes sont liées à la matière et filtrées en conséquence.
 */
import { useCallback, useEffect, useState } from 'react'
import { Icon } from '../ui/Icon'
import {
  createFlashcard,
  deleteFlashcard,
  flashcardStats,
  listDueFlashcards,
  listFlashcards,
  reviewFlashcard,
  type FlashcardStats,
} from '../../services/flashcards'
import {
  REVIEW_BUTTONS,
  REVIEW_BUTTON_GRADE,
  REVIEW_BUTTON_LABELS,
  type ReviewButton,
} from '../../lib/study/srs'
import { useToastStore } from '../../stores/toastStore'
import type { Flashcard } from '../../types'

const EMPTY_STATS: FlashcardStats = { total: 0, due: 0, fresh: 0 }

const BUTTON_CLASS: Record<ReviewButton, string> = {
  again: 'border-red-400/60 text-red-500 hover:bg-red-500/10',
  hard: 'border-orange-400/60 text-orange-500 hover:bg-orange-500/10',
  good: 'border-forma-accent/60 text-forma-accent hover:bg-forma-accent/10',
  easy: 'border-green-400/60 text-green-500 hover:bg-green-500/10',
}

export function FlashcardsPanel({ subjectId }: { subjectId?: string }) {
  const [cards, setCards] = useState<Flashcard[]>([])
  const [stats, setStats] = useState<FlashcardStats>(EMPTY_STATS)
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [busy, setBusy] = useState(false)

  // État de la session de révision (cartes dues figées au lancement).
  const [review, setReview] = useState<Flashcard[] | null>(null)
  const [reviewIndex, setReviewIndex] = useState(0)
  const [showBack, setShowBack] = useState(false)

  const filter = subjectId ? { subjectId } : {}

  const reload = useCallback(async () => {
    setCards(await listFlashcards(filter))
    setStats(await flashcardStats(filter))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId])

  useEffect(() => {
    void Promise.resolve().then(reload)
  }, [reload])

  const addCard = async () => {
    if (front.trim() === '' || back.trim() === '') {
      useToastStore.getState().show('Renseignez le recto et le verso')
      return
    }
    setBusy(true)
    try {
      await createFlashcard({ front, back, ...(subjectId ? { subjectId } : {}) })
      setFront('')
      setBack('')
      await reload()
      useToastStore.getState().show('Flashcard créée')
    } finally {
      setBusy(false)
    }
  }

  const removeCard = async (id: string) => {
    await deleteFlashcard(id)
    await reload()
  }

  const startReview = async () => {
    const due = await listDueFlashcards(filter)
    if (due.length === 0) {
      useToastStore.getState().show('Aucune carte à réviser pour le moment')
      return
    }
    setReview(due)
    setReviewIndex(0)
    setShowBack(false)
  }

  const grade = async (button: ReviewButton) => {
    if (!review) return
    const card = review[reviewIndex]
    if (!card) return
    await reviewFlashcard(card.id, REVIEW_BUTTON_GRADE[button])
    const next = reviewIndex + 1
    if (next >= review.length) {
      setReview(null)
      setReviewIndex(0)
      setShowBack(false)
      await reload()
      useToastStore.getState().show('Révision terminée')
    } else {
      setReviewIndex(next)
      setShowBack(false)
    }
  }

  const stopReview = () => {
    setReview(null)
    setReviewIndex(0)
    setShowBack(false)
    void reload()
  }

  // ── Mode révision ───────────────────────────────────────────────────────────
  if (review) {
    const card = review[reviewIndex]
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-forma-accent">
            Révision {reviewIndex + 1} / {review.length}
          </p>
          <button
            type="button"
            onClick={stopReview}
            className="text-xs text-forma-muted hover:text-forma-text inline-flex items-center gap-1"
          >
            <Icon name="close" className="w-3.5 h-3.5" />
            Arrêter
          </button>
        </div>

        <div className="p-5 rounded-2xl border border-forma-border bg-forma-surface min-h-[140px] flex flex-col">
          <p className="text-[10px] uppercase tracking-wide text-forma-muted mb-1">Recto</p>
          <p className="text-base text-forma-text whitespace-pre-wrap">{card?.front}</p>
          {showBack && (
            <>
              <div className="my-3 border-t border-forma-border" />
              <p className="text-[10px] uppercase tracking-wide text-forma-muted mb-1">Verso</p>
              <p className="text-base text-forma-text whitespace-pre-wrap">{card?.back}</p>
            </>
          )}
        </div>

        {!showBack ? (
          <button
            type="button"
            onClick={() => setShowBack(true)}
            className="w-full text-sm px-4 py-2.5 rounded-xl bg-forma-accent text-white hover:opacity-90 transition-opacity"
          >
            Afficher la réponse
          </button>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {REVIEW_BUTTONS.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => void grade(b)}
                className={`text-xs px-3 py-2 rounded-xl border transition-colors ${BUTTON_CLASS[b]}`}
              >
                {REVIEW_BUTTON_LABELS[b]}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Mode gestion ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={stats.due === 0}
          onClick={() => void startReview()}
          className="text-xs px-3 py-1.5 rounded-lg border border-forma-border hover:border-forma-accent/60 text-forma-muted hover:text-forma-accent transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          <Icon name="zap" className="w-3.5 h-3.5" />
          Réviser les cartes dues ({stats.due})
        </button>
        <span className="text-[10px] text-forma-muted">
          {stats.total} carte{stats.total > 1 ? 's' : ''}
          {stats.fresh > 0 ? ` · ${stats.fresh} jamais révisée${stats.fresh > 1 ? 's' : ''}` : ''}
        </span>
      </div>

      {/* Création */}
      <div className="p-3 rounded-xl border border-forma-border bg-forma-surface space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-forma-muted">
          Nouvelle flashcard
        </p>
        <input
          value={front}
          onChange={(e) => setFront(e.target.value)}
          placeholder="Recto (question / terme)"
          className="w-full text-sm px-3 py-2 rounded-lg border border-forma-border bg-forma-bg text-forma-text placeholder:text-forma-muted focus:outline-none focus:border-forma-accent/60"
        />
        <textarea
          value={back}
          onChange={(e) => setBack(e.target.value)}
          placeholder="Verso (réponse / définition)"
          rows={2}
          className="w-full text-sm px-3 py-2 rounded-lg border border-forma-border bg-forma-bg text-forma-text placeholder:text-forma-muted focus:outline-none focus:border-forma-accent/60 resize-y"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => void addCard()}
          className="text-xs px-3 py-1.5 rounded-lg border border-forma-border hover:border-forma-accent/60 text-forma-muted hover:text-forma-accent transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          <Icon name="plus" className="w-3.5 h-3.5" />
          Ajouter
        </button>
      </div>

      {/* Liste */}
      {cards.length === 0 ? (
        <p className="text-xs text-forma-muted text-center py-6">
          Aucune flashcard. Créez-en une ci-dessus pour commencer à réviser.
        </p>
      ) : (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-forma-muted">
            Cartes ({cards.length})
          </p>
          {cards.map((c) => (
            <div
              key={c.id}
              className="group flex items-start gap-2 px-3 py-2 rounded-xl border border-forma-border bg-forma-surface"
            >
              <Icon name="book" className="w-4 h-4 text-forma-accent shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-forma-text truncate">{c.front}</p>
                <p className="text-xs text-forma-muted truncate">{c.back}</p>
              </div>
              <span className="text-[10px] text-forma-muted shrink-0 mt-0.5">
                {c.repetitions === 0 ? 'nouvelle' : `${c.interval} j`}
              </span>
              <button
                type="button"
                title="Supprimer"
                onClick={() => void removeCard(c.id)}
                className="p-1 text-forma-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              >
                <Icon name="trash" className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
