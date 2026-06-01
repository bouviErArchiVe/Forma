const SHORTCUTS = [
  ['P', 'Stylo'],
  ['C / ✎', 'Crayon'],
  ['H', 'Surligneur'],
  ['E', 'Gomme'],
  ['L', 'Lasso'],
  ['S', 'Formes'],
  ['Shift + trait (ligne/flèche)', 'Snap horizontal/vertical'],
  ['T', 'Texte'],
  ['M', 'Éléments'],
  ['Shift+R', 'Mode lecture'],
  ['Ctrl+Z', 'Annuler'],
  ['Ctrl+Shift+Z', 'Rétablir'],
  ['Ctrl+Shift+D', 'Dupliquer la page'],
  ['Ctrl+Shift+S', 'Sauver une version de la page'],
  ['Ctrl+F', 'Recherche dans le document'],
  ['Ctrl+C / V / D', 'Copier / coller / dupliquer sélection'],
  ['Ctrl+A (lasso)', 'Tout sélectionner sur la page'],
  ['Échap (lasso)', 'Désélectionner'],
  ['Shift+clic (lasso)', 'Ajouter / retirer de la sélection'],
  ['Clic élément (lasso)', 'Sélectionner · glisser pour déplacer'],
  ['Flèches (lasso + sélection)', 'Déplacer la sélection (8 px, Shift = 32 px)'],
  ['Alt+← →', 'Page préc./suiv.'],
  ['Ctrl+Molette', 'Zoom'],
  ['Espace + glisser', 'Déplacer la vue'],
  ['Cercle au stylo', 'Sélection (Circle to Lasso)'],
  ['Ctrl+P', 'Imprimer'],
  ['▶ Présentation', 'Plein écran + zoom 100 %'],
  ['← → (présentation)', 'Page préc./suiv.'],
  ['Échap', 'Quitter présentation'],
  ['Réglages', 'Accrochage grille (snap 32 px)'],
  ['Bibliothèque', 'Flèches + Entrée pour naviguer'],
  ['Ctrl+N (bibliothèque)', 'Nouveau carnet'],
  ['Ctrl+A (bibliothèque)', 'Tout sélectionner'],
  ['Ctrl+K → Study CSV', 'Exporter / importer cartes Study'],
  ['Shift+R', 'Mode lecture'],
  ['Ctrl+K → Favori page', 'Marquer la page ★'],
  ['Suppr (bibliothèque)', 'Corbeille — carte focusée'],
  ['Ctrl+D (bibliothèque)', 'Dupliquer — carte focusée'],
  ['Drop .md', 'Import Markdown → carnet'],
  ['Clic molette onglet', 'Fermer l’onglet'],
  ['Pincement (trackpad)', 'Zoom dans l’éditeur'],
  ['Trousse (3 pastilles)', 'Clic = appliquer · clic droit = enregistrer'],
  ['Présentation ▶ + 🔴', 'Laser pointeur en diaporama'],
  ['Petit cercle au stylo', 'Gomme rapide (si activé dans Paramètres)'],
  ['Grand cercle au stylo', 'Sélection Circle to Lasso'],
  ['Recherche panneau', 'Saisie live · Préc./Suiv. · surlignage texte'],
  ['Ctrl+K', 'Palette — carnets, pages récentes, recherche globale (2+ car.)'],
  ['Panneau Plan', 'Liste des blocs texte de la page'],
  ['Sidebar ‹ ›', 'Masquer / afficher la liste des pages'],
  ['Bibliothèque · 2 sélectionnés', 'Fusionner les carnets'],
  ['Page ⋮ → Déplacer', 'Envoyer la page vers un autre carnet'],
  ['Exporter ▾', 'PNG, PDF, ZIP, .forma, impression…'],
  ['Double-clic carte', 'Renommer un carnet (bibliothèque)'],
  ['`', 'Mode focus (masque barres d’outils)'],
  ['Home / End', 'Première / dernière page'],
  ['Swipe gauche/droite', 'Page préc./suiv. (tactile)'],
  ['Exporter ▾ → SVG vecteur', 'Traits et textes vectoriels'],
  ['Exporter ▾ → Markdown', 'Page ou carnet (texte + PDF + OCR)'],
]

export function ShortcutsHelp({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-forma-surface rounded-xl shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-4">Raccourcis clavier</h2>
        <dl className="space-y-2 text-sm">
          {SHORTCUTS.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4">
              <dt className="font-mono text-forma-accent shrink-0">{k}</dt>
              <dd className="text-forma-muted text-right">{v}</dd>
            </div>
          ))}
        </dl>
        <button type="button" onClick={onClose} className="mt-6 w-full py-2 bg-forma-accent text-white rounded-lg">
          Fermer
        </button>
      </div>
    </div>
  )
}
