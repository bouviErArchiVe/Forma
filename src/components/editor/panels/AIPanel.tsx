import { useState } from 'react'
import { useToastStore } from '../../../stores/toastStore'
import { bulletOutline, generateStudyPairs } from '../../../lib/ai-quiz'
import {
  answerQuestion,
  extractKeywords,
  reformulate,
  summarizeText,
} from '../../../lib/ai-local'

export function AIPanel({
  contextText,
  onAddStudyPairs,
}: {
  contextText: string
  onAddStudyPairs?: (pairs: { front: string; back: string }[]) => void
}) {
  const [question, setQuestion] = useState('')
  const [output, setOutput] = useState('')

  return (
    <div className="space-y-3 text-sm">
      <h3 className="font-medium">Forma IA (local)</h3>
      <p className="text-xs text-forma-muted">
        Traitement local sans cloud. Connectez une API plus tard pour l'OCR manuscrit et les réunions.
      </p>
      <button
        type="button"
        className="w-full py-1.5 border rounded hover:bg-gray-50"
        onClick={() => setOutput(summarizeText(contextText))}
      >
        Résumer la page
      </button>
      <button
        type="button"
        className="w-full py-1.5 border rounded hover:bg-gray-50"
        onClick={() => setOutput(reformulate(contextText, 'shorter'))}
      >
        Raccourcir
      </button>
      <button
        type="button"
        className="w-full py-1.5 border rounded hover:bg-gray-50"
        onClick={() => setOutput(reformulate(contextText, 'formal'))}
      >
        Ton formel
      </button>
      <button
        type="button"
        className="w-full py-1.5 border rounded hover:bg-gray-50"
        onClick={() => setOutput(`Mots-clés : ${extractKeywords(contextText).join(', ')}`)}
      >
        Mots-clés
      </button>
      <button
        type="button"
        className="w-full py-1.5 border rounded hover:bg-gray-50"
        onClick={() => setOutput(bulletOutline(contextText))}
      >
        Plan à puces
      </button>
      {onAddStudyPairs && (
        <button
          type="button"
          className="w-full py-1.5 border rounded hover:bg-gray-50"
          onClick={() => {
            const pairs = generateStudyPairs(contextText)
            if (pairs.length) {
              onAddStudyPairs(pairs)
              setOutput(`${pairs.length} carte(s) ajoutée(s) au Study Set.`)
            } else setOutput('Pas assez de texte pour générer des cartes.')
          }}
        >
          Générer cartes Study
        </button>
      )}
      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Question sur vos notes…"
        className="w-full border rounded px-2 py-1"
      />
      <button
        type="button"
        className="w-full py-1.5 bg-forma-accent text-white rounded"
        onClick={() => setOutput(answerQuestion(contextText, question))}
      >
        Poser la question
      </button>
      {output && (
        <div className="space-y-1">
          <div className="p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded text-xs whitespace-pre-wrap max-h-48 overflow-y-auto">
            {output}
          </div>
          <button
            type="button"
            className="text-xs text-forma-accent"
            onClick={async () => {
              await navigator.clipboard.writeText(output)
              useToastStore.getState().show('Copié')
            }}
          >
            Copier le résultat
          </button>
        </div>
      )}
    </div>
  )
}
