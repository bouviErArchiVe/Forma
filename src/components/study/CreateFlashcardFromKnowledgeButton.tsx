/**
 * CreateFlashcardFromKnowledgeButton — affordance « Créer une flashcard »
 * depuis une fiche Knowledge (Sprint #6, Lane C).
 *
 * Destiné à être monté dans un contexte de carte Knowledge (ex.
 * KnowledgeEntryCard, propriété Lane K). N'importe AUCUN composant Knowledge :
 * reçoit la fiche en prop (contrat read-only `KnowledgeEntry`) et réutilise le
 * service flashcards existant via createFlashcardFromKnowledge. Aucune logique
 * métier ici (mapping pur dans src/lib/study/knowledge-study.ts).
 */
import { useState } from 'react'
import { Icon } from '../ui/Icon'
import { createFlashcardFromKnowledge } from '../../services/knowledge-study'
import type { KnowledgeEntry } from '../../lib/knowledge'
import { useToastStore } from '../../stores/toastStore'

export function CreateFlashcardFromKnowledgeButton({
  entry,
  subjectId,
  className = '',
  onCreated,
}: {
  entry: KnowledgeEntry
  subjectId?: string
  className?: string
  onCreated?: () => void
}) {
  const [busy, setBusy] = useState(false)

  const create = async () => {
    setBusy(true)
    try {
      const card = await createFlashcardFromKnowledge(entry, subjectId ? { subjectId } : {})
      if (!card) {
        useToastStore.getState().show('Fiche incomplète : flashcard non créée')
        return
      }
      useToastStore.getState().show('Flashcard créée depuis la fiche')
      onCreated?.()
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void create()}
      title="Créer une flashcard depuis cette fiche"
      className={
        className ||
        'text-xs px-3 py-1.5 rounded-lg border border-forma-border hover:border-forma-accent/60 text-forma-muted hover:text-forma-accent transition-colors inline-flex items-center gap-1.5 disabled:opacity-50'
      }
    >
      <Icon name="plus" className="w-3.5 h-3.5" />
      Créer une flashcard
    </button>
  )
}
