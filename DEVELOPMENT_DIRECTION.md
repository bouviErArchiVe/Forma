# Forma — Direction finale de développement

_Décision validée · 2026-05-26_

## Objectif

Compléter tous les modules Forma pour qu'ils soient **complets, fonctionnels, stables et cohérents**, sans abandonner les fonctionnalités déjà validées.

## Exception — Proforma

- **Proforma est supprimé définitivement.**
- Ne plus développer, réintroduire ou référencer Proforma.
- Les anciens éléments canvas `type: "proforma"` restent affichables comme images (rétrocompatibilité carnets).

## Règles de développement

1. **Un module à la fois** — finir, tester, corriger, valider sauvegarde/navigation, puis passer au suivant.
2. **Pas de fonctionnalités partielles** — pas de boutons morts, pas d'UI sans logique.
3. **Critère « terminé »** — fonctionne réellement, survit au refresh, stable sur iPad, pas d'erreur console majeure, utilisable plusieurs minutes sans bug critique.
4. **Priorités** — stabilité, performance, sauvegarde, UX iPad, responsive, absence de crash.
5. **Code** — réutiliser les composants communs, rester simple et modulaire, modifier uniquement les fichiers nécessaires.

Voir aussi : [IMPLEMENTATION_WORKFLOW.md](./IMPLEMENTATION_WORKFLOW.md)

## Modules à compléter (ordre indicatif)

| Module | Route | Statut cible |
|--------|-------|--------------|
| Carnets (Editor) | `/editor/:id` | Complet — dessin, pages, calques, sauvegarde |
| FormaFolder | `/formafolder` | Complet — navigation, intégrations |
| FMoodboard | `/fmoodboard` | Complet |
| Formules | `/formules` | Complet |
| FormaTab | `/formatab` | Complet |
| FormaDoc | `/formadoc` | Complet |
| FormatCal | `/formatcal` | Complet |
| FormaCombine | `/formacombine` | Complet |
| FormaReview | `/formareview` | Complet |
| FormaLibrary | `/formalibrary` | Complet |
| FormaAI | `/formaai` | Complet |
| Recherche globale | intégrée | Complet |
| Traduction | `/translate` | Complet |
| FPause | `/fpause` | Complet |
| FTheme | Library / Apparence | Complet |
| FormaMessage | `/formamessage` | Complet (local + cloud quand stable) |
| FormaHub | `/formahub` | Complet (local + cloud quand stable) |
| FormaDico | `/formadico` | Complet |
| Sauvegarde locale | — | Stable, fiable |
| Profils utilisateur | `/account/*` | Complet |
| Cloud / sync | — | **Plus tard**, uniquement si base locale stable |

## Méthode par module

1. Finir le module
2. Tester complètement (build + navigation + refresh + console)
3. Corriger les bugs
4. Vérifier sauvegarde et navigation inter-modules
5. Passer au module suivant

## Rapport obligatoire (par pack)

1. Tâches terminées
2. Tâches restantes + raison
3. Bugs rencontrés
4. Limites techniques
5. Modules testés
