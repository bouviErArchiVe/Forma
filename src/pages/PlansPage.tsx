import { Link } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'

const PLANS = [
  {
    name: 'Essential',
    price: 'Gratuit',
    features: ['Carnets illimités', 'Outils de base', 'Export PDF', 'Sauvegarde locale'],
  },
  {
    name: 'Pro',
    price: '9,99 €/mois',
    features: ['Tout Essential', 'OCR illimité', 'Modèles Pro', 'Sauvegarde auto', 'Whiteboards'],
    highlight: true,
  },
  {
    name: 'AI Meetings',
    price: '14,99 €/mois',
    features: ['Tout Pro', 'Transcription', 'Résumés réunion', 'IA cloud (à venir)'],
  },
]

export function PlansPage() {
  return (
    <div className="min-h-full p-6 max-w-4xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-forma-accent hover:underline">
        <Icon name="chevron-left" className="w-4 h-4" />
        Bibliothèque
      </Link>
      <h1 className="text-2xl font-bold mt-4 mb-2">Forma — Offres</h1>
      <p className="text-sm text-forma-muted mb-4">
        Version locale : toutes les fonctions listées sont disponibles sans abonnement dans cette
        application web (données sur votre appareil).
      </p>
      <p className="text-sm mb-8">
        <Link to="/settings" className="text-forma-accent hover:underline">
          Paramètres → sauvegarde & export
        </Link>
      </p>
      <div className="grid md:grid-cols-3 gap-4">
        {PLANS.map((p) => (
          <div
            key={p.name}
            className={`rounded-xl border p-5 ${p.highlight ? 'border-forma-accent ring-2 ring-forma-accent/30' : 'border-forma-border bg-forma-surface'}`}
          >
            <h2 className="font-bold text-lg">{p.name}</h2>
            <p className="text-2xl font-semibold my-3 text-forma-accent">{p.price}</p>
            <ul className="text-sm space-y-2 text-forma-muted">
              {p.features.map((f) => (
                <li key={f}>✓ {f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
