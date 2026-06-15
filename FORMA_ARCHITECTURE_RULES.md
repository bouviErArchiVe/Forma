# FORMA_ARCHITECTURE_RULES.md

# Forma — Règles d’architecture

## Principe central

Toujours étendre l’architecture actuelle plutôt que créer des systèmes parallèles.

## Dexie / IndexedDB

Règles :

- migrations additives ;
- pas de suppression de table sans validation ;
- pas de changement destructif de schéma ;
- champs optionnels préférés ;
- tests de schéma obligatoires ;
- données existantes intactes.

Avant migration :

- vérifier version actuelle ;
- vérifier tests existants ;
- écrire test migration/schéma ;
- vérifier reload.

## Zustand / stores

Règles :

- stores spécialisés ;
- éviter stores géants ;
- éviter duplication d’état ;
- préférer services purs pour logique testable ;
- garder UI state séparé des données persistées.

## Canvas

Règles :

- ne pas modifier Canvas sauf besoin réel ;
- ne pas casser strokes/images/selection/lasso ;
- ne pas casser export PDF ;
- éviter refactor massif ;
- réutiliser ImageElement pour objets graphiques si possible ;
- préférer insertion via asset Dexie quand le rendu existe déjà.

## Blocs / détails / graphiques

Architecture validée :

`SVG → raster HD → asset Dexie → ImageElement`

Ce pattern est sûr car il hérite de :

- rendu ;
- sélection ;
- déplacement ;
- resize ;
- rotation ;
- sauvegarde ;
- reload ;
- export PDF.

Utiliser ce pattern par défaut pour les blocs/détails/symboles, sauf nécessité forte.

## FormAI

Règles :

- local-first ;
- cloud optionnel ;
- aucune clé API obligatoire ;
- provider local honnête ;
- ne jamais faire semblant ;
- confirmation obligatoire avant création automatique ;
- ne jamais inventer d’articles normatifs ;
- indiquer les limites.

## Search

Tout nouveau système important doit être indexé si utile :

- titre ;
- tags ;
- contenu ;
- type ;
- matière ;
- projet.

Ne pas rendre Search fragile avec des objets énormes. Extraire du texte utile.

## Library

Library est le centre du produit.

Chaque nouveau type/document doit :

- apparaître si pertinent ;
- avoir icône ;
- type ;
- favori ;
- corbeille ;
- recherche ;
- sauvegarde.

## Routes

Règles :

- lazy-load pages lourdes ;
- routes claires ;
- back buttons ;
- pas de page blanche ;
- fallback utile.

## UI

Règles :

- style Forma existant ;
- dark mode ;
- boutons accessibles ;
- titres clairs ;
- empty states ;
- pas de faux boutons ;
- pas de modal morte.

## Normes et conformité

Toujours afficher :

> À vérifier dans le texte officiel. Résultat indicatif.

Ne jamais :

- inventer article ;
- prétendre conformité finale ;
- donner avis légal/professionnel final.

## Calculs

Pour les calculs dépendants du code :

- valeurs paramétriques ;
- notes de vérification ;
- pas de hardcode réglementaire dangereux.

Pour les calculs géométriques :

- déterministes ;
- tests unitaires ;
- gestion division par zéro ;
- unités explicites.

## Import/export

Règles :

- erreurs propres ;
- taille max raisonnable ;
- feedback utilisateur ;
- ne pas bloquer UI ;
- fallback si format non supporté.

## Performance

Éviter :

- gros recalculs au render ;
- parsing lourd dans UI ;
- assets non bornés ;
- workers inutiles ;
- imports synchrones lourds.

## Tests

Logique pure = tests unitaires.

Flow utilisateur = Playwright/QA navigateur.

Toute migration Dexie = test de schéma.

Tout calcul = tests numériques.
