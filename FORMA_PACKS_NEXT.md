# FORMA_PACKS_NEXT.md

# Forma — Prochains packs recommandés

Ce fichier liste les prochains packs les plus rentables.

## Priorité immédiate

Avant de commencer :

1. vérifier si `feat/academic-import-formai` est mergé ;
2. vérifier si `feat/architecture-calculators-pro` est mergé ;
3. mettre à jour `FORMA_STATE.md`.

---

# Pack recommandé 1 — A6 Compliance Checker

## Objectif

Créer un assistant de conformité indicatif.

## Cas couverts V1

- escalier ;
- garde-corps ;
- rampe/accessibilité ;
- issue ;
- porte ;
- stationnement ;
- occupation.

## Entrées

Formulaires simples avec unités :

- largeur ;
- hauteur ;
- pente ;
- nombre de marches ;
- giron ;
- garde-corps ;
- distance ;
- surface ;
- usage.

## Sortie

- conforme ;
- non conforme ;
- à vérifier ;
- explication ;
- checklist ;
- lien vers fiche normative ;
- avertissement officiel.

## Important

Ne jamais inventer d’article officiel.

Toujours afficher :

> À vérifier dans le texte officiel. Résultat indicatif.

---

# Pack recommandé 2 — A5 Hatch Library

## Objectif

Ajouter une bibliothèque de hachures utilisables dans dessins/détails.

## Types

- béton ;
- bois ;
- acier ;
- isolation ;
- terre ;
- gravier ;
- brique ;
- pierre ;
- membrane ;
- verre.

## Architecture conseillée

SVG pattern → raster/asset ou SVG direct selon existant.

Réutiliser le pattern blocs si possible.

---

# Pack recommandé 3 — A4 Technical Symbols Library

## Objectif

Compléter la bibliothèque de blocs avec des symboles techniques.

## Catégories

- architecture ;
- structure ;
- mécanique ;
- électrique ;
- plomberie ;
- repères ;
- niveaux ;
- coupes ;
- élévations.

---

# Pack recommandé 4 — A8 Architecture Templates

## Objectif

Créer des templates de documents/projets.

## Templates

- rapport visite chantier ;
- fiche matériaux ;
- conformité ;
- inspection ;
- détail constructif ;
- projet résidentiel ;
- projet commercial.

---

# Pack recommandé 5 — B1 Drawing Dimensions

## Objectif

Ajouter les cotes au dessin.

## Types

- cote linéaire ;
- cote alignée ;
- cote radiale ;
- cote angulaire.

Très fort impact, mais plus risqué car touche canvas.

---

# Pack recommandé 6 — C1 Flashcards

## Objectif

Ajouter flashcards et révision espacée.

Moins risqué que canvas, très utile pour études.

---

# Pack recommandé 7 — D2 FormAI Canvas

## Objectif

Actions IA dans le carnet :

- résumer page ;
- expliquer sélection ;
- créer tâche ;
- traduire ;
- reformuler.

---

# Recommandation actuelle

Faire dans cet ordre :

1. A6 Compliance Checker
2. A5 Hatch Library
3. A4 Technical Symbols Library
4. A8 Architecture Templates
5. C1 Flashcards
6. B1 Drawing Dimensions
