# FORMA_STATE.md

# Forma — État actuel connu du projet

Ce fichier décrit l’état réel connu de Forma à la dernière consolidation de contexte.

Il doit être mis à jour après chaque pack important.

## État général

Forma possède maintenant un socle très avancé :

- core de documents ;
- Library ;
- Search ;
- FormAI ;
- modules académiques ;
- modules architecture ;
- dashboard ;
- projets ;
- tâches ;
- matières ;
- bibliothèque de blocs ;
- ressources techniques ;
- import hub ;
- tests importants ;
- workflow de QA navigateur.

## Sur `main` — modules et systèmes connus comme intégrés

### Core

- Library
- Favoris
- Corbeille
- Search V3
- Dashboard
- Navigation principale
- Onboarding
- Storage/settings
- Import/export de base
- PDF pipeline

### Documents / contenus

- Carnets
- FormaDoc
- FormaTab
- Moodboard
- Calendrier
- Combine
- Formules
- Traduction
- Dictionnaire
- Présence
- Pause
- Matières

### Ecosystem Workspace

- Projets
- Tâches
- Relations document ↔ matière
- Relations document ↔ projet
- Dashboard étudiant
- Espaces matières
- Espaces projets
- Ressources architecture
- Recherche écosystème

### FormAI

- Chat persistant
- Conversations
- Mémoire locale
- Agents spécialisés
- Providers configurables
- Mode local honnête
- RAG
- Knowledge base
- Archives
- Intégrations avec plusieurs modules

### Architecture

- Bibliothèque normative initiale
- Matériaux
- Détails constructifs
- Bibliothèque de blocs V1/V2
- Blocs métriques
- Blocs impériaux
- Blocs personnalisés
- Blocs paramétriques
- Calculatrices architecture
- Convertisseurs
- Formules professionnelles

### Academic + Import + FormAI Actions

Pack connu livré sur branche `feat/academic-import-formai`, commit `e7276bd6`, validation demandée/accordée dans la discussion.

Fonctionnalités :

- Academic Calendar ;
- sessions Automne/Hiver/Été ;
- semaines 1–15 ;
- événements académiques ;
- Import Hub ;
- import PDF/image/Markdown/TXT/CSV ;
- tâches depuis notes via FormAI ;
- quiz ;
- révisions ;
- checklists projet ;
- événements ↔ projets ;
- détails constructifs dans bibliothèque de blocs ;
- compteurs live ;
- dashboard académique ;
- Search V3 étendue ;
- Dexie v13 additif.

Avant tout travail futur, confirmer si ce pack est bien mergé sur `main`.

### A7 Architecture Calculators Pro

Pack connu livré sur branche `feat/architecture-calculators-pro`, commit `22eb6dc5`.

Ajouts :

- 17 calculatrices architecture ;
- nouvelles catégories :
  - Toitures ;
  - Garde-corps ;
  - Accessibilité ;
  - Stationnement ;
  - Occupation ;
- ajouts Structure ;
- tests verts ;
- build vert ;
- Playwright vert.

Mergé sur `main` le 2026-06-15 (merge commit `fd14fce9`), en même temps que le système de guides (`docs/forma-guide-system-pro`).

### A6 Compliance Checker

Pack livré sur branche `feat/compliance-checker` (à partir de `main` `fd14fce9`).

Ajouts :

- vérificateur de conformité indicatif `/compliance` ;
- 7 vérifications V1 : escaliers, garde-corps, rampes/accessibilité, issues, portes, stationnement, occupation ;
- valeurs de référence paramétrables et persistées (store `forma-compliance-params`) ;
- évaluations déterministes (conforme / non conforme / à vérifier) avec gardes division par zéro ;
- avertissement permanent « À vérifier dans le texte officiel. Résultat indicatif. » ;
- aucun article officiel inventé ;
- FormAI « Expliquer ce résultat » (cloud, optionnel, honnête) ;
- intégration Search V3 (kind `compliance`) ;
- route lazy + entrées de navigation (Library + dashboard) ;
- tests verts, build vert, Playwright vert.

Mergé sur `main` le 2026-06-15 (fast-forward `53fd48ce`).

### A5 Hatch Library

Pack livré sur branche `feat/hatch-library` (à partir de `main` `53fd48ce`).

Ajouts :

- bibliothèque de 15 hachures techniques (béton, béton armé, bois, acier, isolation, terre, gravier, brique, pierre, membrane, verre, sable, eau, gypse, maçonnerie) ;
- swatches SVG 80×80 en géométrie explicite, réutilisant le pipeline bloc (`hatchToBlock` → raster → asset Dexie → ImageElement), sans toucher au canvas ;
- onglet « Hachures » dans Ressources (recherche, aperçu, catégories, copie SVG) ;
- onglet « Hachures » dans la bibliothèque de blocs (insertion canvas) ;
- intégration Search V3 (kind `hatch`) ;
- tests verts, build vert, Playwright vert.

Mergé sur `main` le 2026-06-15 (fast-forward `bf7193d2`).

### Architecture Resource Factory (A4 + A8 + A3 boost)

Pack accélérateur livré sur branche `feat/architecture-resource-factory` (à partir de `main` `bf7193d2`). Regroupe A4 (symboles), A8 (templates) et un boost A3, sur une base commune réutilisable.

Couche commune (Resource Factory) :

- `src/lib/resources/resourceTypes.ts` — forme commune `GraphicResource` + helpers (recherche, catégories) ;
- `src/lib/resources/resourceToBlock.ts` — conversion canonique ressource → DrawingBlock (`<type>-<id>`) ;
- adaptateurs `hatchToResource` / `symbolToResource` / `detailToResource` ; les convertisseurs existants délèguent désormais ici (sortie identique, non-régression testée) ;
- composants partagés `ResourceCatalog` / `ResourceGrid` / `ResourcePreview` / `ResourceFilters` (UI unique pour toute famille de ressources graphiques).

A4 — Technical Symbols Library :

- 41 symboles techniques en 5 catégories (architecture, structure, mécanique/plomberie, électricité, annotation/chantier), SVG 64×64 ;
- onglet « Symboles » dans Ressources (via `ResourceCatalog`) + onglet « Symboles » dans la bibliothèque de blocs (insertion, catégorie bloc `symbols`) ;
- Search V3 (kind `symbol`).

A8 — Architecture Templates V1 :

- 15 templates (`src/lib/resources/templates.ts`) en 5 catégories : carnet/visite/inspection chantier, rapport technique, fiches (matériaux, conformité, détail, escalier, accessibilité, stationnement, garde-corps), projets résidentiel/commercial, plan de révision, checklist de remise ;
- onglet « Templates » dans Ressources avec aperçu de structure et action « Créer depuis ce template » (FormaDoc via le pipeline existant) ;
- Search V3 (kind `template`) ;
- les fiches « code » rappellent la vérification officielle (aucun article inventé).

A3 — boost détails :

- +20 détails constructifs (catalogue passé de 56 à 76), insérables et recherchables via le système existant.

Migration progressive : les hachures (A5) et symboles (A4) passent par la base commune ; détails inchangés côté sortie. Aucune modification du canvas. Tests verts, build vert, Playwright vert.

Mergé sur `main` le 2026-06-15 (fast-forward `29575206`).

### Resource Factory Phase 2 (détails + légendes)

Pack livré sur branche `feat/resource-factory-details-legends` (à partir de `main` `29575206`).

- Couche commune enrichie : `GraphicResource.notes?` (ressources « riches »), `ResourcePreview` affiche les notes + copie Markdown générique ; aperçu redimensionné pour ressources non carrées (détails, légendes).
- Détails migrés vers la Resource Factory : onglet « Détails constructifs » via `ResourceCatalog` (grille + aperçu + notes conservées) ; `detailToBlock` inchangé (insertion identique).
- A3 vers 100+ : +27 détails (catalogue passé de 76 à **103**) couvrant fondations, murs, toitures, planchers, portes/fenêtres, isolation, drainage, acier, béton, bois, enveloppe, escaliers, coupe type.
- Légendes V1 (`src/lib/resources/legends.ts`) : 5 légendes (matériaux, hachures, symboles, détails, annotations), insérables via le pipeline (`legendToResource` → bloc `annotations`) ; onglet « Légendes » dans Ressources + dans la bibliothèque de blocs ; Search V3 (kind `legend`). Future-ready pour la génération automatique à partir des ressources d'un carnet.
- Hachures / symboles non régressés ; aucune modification du canvas. Tests verts, build vert, Playwright vert.

Avant tout travail futur, confirmer si ce pack est bien mergé sur `main`.

## Tests et chiffres connus

Chiffres récents vus dans les rapports :

- 516 tests après finalisation QA ;
- 584 tests après FormAI ;
- 656 tests après modules V2 ;
- 681 tests après polish ;
- 693 tests après Block Library V1 ;
- 706 tests après Block Library V2 ;
- 730 tests après Ecosystem Workspace ;
- 754 tests après Academic + Import + FormAI Actions ;
- 782 tests après Architecture Calculators Pro ;
- 807 tests après Compliance Checker ;
- 819 tests après Hatch Library ;
- 847 tests après Architecture Resource Factory (A4 + A8 + boost A3) ;
- 854 tests après Resource Factory Phase 2 (détails migrés + 103 détails + légendes V1).

Ces chiffres servent d’indication, mais Claude doit toujours exécuter les tests réels du repo.

## Branches / commits importants connus

- `feat/formai-v1` — commit `165457d8`
- `feat/forma-v2-modules` — commit `017db798`
- `feat/forma-v2-integration-polish` — commit `979c0bec`
- `feat/drawing-block-library` — commit `8bac7bed`
- `feat/drawing-block-library-v2` — commit `2475111`
- `feat/forma-ecosystem-workspace` — commit `212a94a`
- `feat/academic-import-formai` — commit `e7276bd6`
- `feat/architecture-calculators-pro` — commit `22eb6dc5`
- `feat/architecture-material-library` — commit `1b01ae9c` (mergé)
- `feat/construction-details-v2` — commit `a2ca6aba` (mergé)
- `feat/normative-library-v2` — commit `2efdf726` (mergé)
- `docs/forma-guide-system-pro` — commit `a3b57524` (mergé)
- `main` (après merges) — commit `fd14fce9`
- `feat/compliance-checker` — commit `53fd48ce` (mergé)
- `feat/hatch-library` — commit `bf7193d2` (mergé)
- `feat/architecture-resource-factory` — commit `29575206` (mergé)
- `feat/resource-factory-details-legends` — détails migrés + 103 détails + légendes V1

Toujours vérifier l’historique Git réel avant action.

## Points sensibles

### Dexie

Dexie a été migré plusieurs fois. Toute nouvelle migration doit être :

- additive ;
- non destructive ;
- testée ;
- compatible avec anciens documents.

### Canvas

Le canvas est central et fragile.

Ne pas le refactorer pour un pack qui ne concerne pas directement le dessin.

### FormAI

FormAI doit rester optionnel et local-first.

Aucune clé API ne doit être obligatoire pour ouvrir Forma.

### Library

Library est devenue centrale. Éviter les modifications massives.

### Search

Search indexe beaucoup de systèmes. Les nouveaux modules doivent être ajoutés proprement.

### Normes

Ne jamais inventer d’articles officiels. Toujours afficher :

> À vérifier dans le texte officiel. Résultat indicatif.
