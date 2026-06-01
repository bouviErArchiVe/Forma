import { useState } from 'react'
import { useSettingsStore } from '../stores/settingsStore'

const STEPS = [
  {
    title: 'Bienvenue dans Forma',
    body: 'Votre carnet numérique : écrire, annoter des PDF, réviser — tout en local sur votre appareil.',
  },
  {
    title: 'Outils rapides',
    body: 'Raccourcis : P stylo, H surligneur, E gomme, L lasso, T texte, M éléments. Alt+← → change de page.',
  },
  {
    title: 'Sauvegarde',
    body: 'Paramètres → Exporter une sauvegarde .forma.zip. Vos données ne quittent jamais l’appareil sans votre accord.',
  },
  {
    title: 'Aller plus vite',
    body: 'Ctrl+K (ou /) : palette, pages récentes, recherche globale (2+ car.). Ctrl+F dans le document. Fusionnez deux carnets en bibliothèque (sélection ×2).',
  },
  {
    title: 'Focus & export',
    body: 'Touche ` pour le mode focus. Export SVG vecteur dans Exporter ▾. Glissez un .forma.zip sur la bibliothèque pour importer.',
  },
]

export function Onboarding() {
  const { onboardingDone, setOnboardingDone } = useSettingsStore()
  const [step, setStep] = useState(0)

  if (onboardingDone) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-forma-surface rounded-2xl shadow-2xl max-w-md w-full p-6 dark:text-gray-100">
        <h2 className="text-xl font-bold text-forma-accent mb-2">{STEPS[step].title}</h2>
        <p className="text-forma-muted mb-6 dark:text-gray-400">{STEPS[step].body}</p>
        <div className="flex gap-1 mb-4 justify-center">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full ${i === step ? 'bg-forma-accent' : 'bg-gray-300'}`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="flex-1 py-2 border rounded-lg dark:border-gray-600"
            onClick={() => setOnboardingDone(true)}
          >
            Passer
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              className="flex-1 py-2 bg-forma-accent text-white rounded-lg"
              onClick={() => setStep(step + 1)}
            >
              Suivant
            </button>
          ) : (
            <button
              type="button"
              className="flex-1 py-2 bg-forma-accent text-white rounded-lg"
              onClick={() => setOnboardingDone(true)}
            >
              Commencer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
