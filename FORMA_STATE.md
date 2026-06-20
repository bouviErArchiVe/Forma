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

Mergé sur `main` le 2026-06-15 (fast-forward `363e71f2`).

### Resource Factory Phase 3 (auto-légendes + resource usage)

Pack livré sur branche `feat/auto-legends-resource-usage` (à partir de `main` `363e71f2`).

- `src/lib/resources/resourceUsage.ts` : détection lecture seule des ressources Factory insérées dans une page à partir des `ImageElement.blockId` (`<type>-<resourceId>`). `parseResourceBlockId`, `resolveUsedResource`, `collectResourceUsage` → ressources uniques, occurrences, types, catégories. Les blocs hors catalogues Factory sont ignorés proprement ; aucune modification du canvas ni de Dexie.
- `generateUsageLegend(resources)` dans `legends.ts` : génère une légende `GraphicResource` (titre + lignes « échantillon réel + nom ») à partir des ressources utilisées ; état vide propre ; insérable via le pipeline existant (`resourceToBlock` → raster → asset Dexie → ImageElement).
- UI : bouton « Générer une légende depuis cette page » dans l'onglet Légendes de la bibliothèque de blocs (la page courante est passée via `pageImages`). Insertion réelle vérifiée (bloc `legend-auto-…`, asset Dexie, survit au reload).
- Légendes statiques V1 non régressées. Tests verts, build vert, Playwright vert.

Mergé sur `main` le 2026-06-15 (fast-forward `0e1686db`).

### Pack B1 — Drawing Dimensions Foundation (cotes)

Pack livré sur branche `feat/drawing-dimensions-foundation` (à partir de `main` `0e1686db`).

- **Fondation des cotes** sans toucher au canvas : `src/lib/dimensions/dimensions.ts` (fonctions PURES — `distance`, `pxToReal`, `angleOf`, `midpoint`, `formatLength` mm/cm/m + impérial po/pi, `createDimension`, `buildDimensionSvg`, `dimensionToBlock`). Une cote est calculée puis rendue en SVG et insérée comme un bloc (`dimensionToBlock` → raster → asset Dexie → ImageElement) : elle hérite du rendu, de la sélection, du déplacement, de la sauvegarde/reload et de l'export, **sans modification du canvas**.
- Types V1 : cote **horizontale**, **verticale**, **alignée** (angle). Style : ligne + flèches ou ticks + valeur centrée ; unité + échelle (1 px = N unités) configurables ; couleur `currentColor` (dark mode).
- UI : déclencheur « Cote » dans la rangée paramétrique de la bibliothèque de blocs → `DimensionDialog` (type, longueur, unité, échelle, angle, embouts) avec aperçu en direct → insertion via `onPick`.
- Modèle `Dimension` (id/type/start/end/text/unit/scale/measuredLength/displayLength/style/createdAt/updatedAt). Insertion réelle des 3 types vérifiée (`dimension-…`, asset Dexie, survit au reload) ; hachures/symboles/détails/blocs non régressés.

Mergé sur `main` le 2026-06-15 (fast-forward `3724014a`).

### Sprint parallèle #1 (lanes A/B/C/D + intégration E)

Premier sprint en mode parallèle contrôlé (voir `FORMA_PARALLEL_SPRINTS.md`). 4 lanes en worktrees isolés, branches dédiées, propriété unique des fichiers critiques, vérif e2e centralisée par Lane E. Ordre de merge respecté : E base → A → C → D → **B (canvas) en dernier**. Fichiers disjoints (zéro conflit).

- **Lane A — Architecture Resources** (`feat/arch-resources-polish`) : légendes auto-générées **groupées par type** (`generateUsageLegend` + `groupResourcesByType`/`RESOURCE_TYPE_*` dans `resourceTypes.ts`), vue groupée optionnelle du `ResourceCatalog`/`ResourceGrid`, nouvel onglet « Ressources graphiques » agrégé, polish `ResourcePreview`. Aucune régression des catalogues existants.
- **Lane C — Study** (`feat/study-flashcards-srs`) : C1 flashcards (`src/services/flashcards.ts`, table Dexie additive **v13 → v14**, `FORMA_DB_VERSION = 14`) + C2 révision espacée SM-2-lite pure (`src/lib/study/srs.ts`, `review()` testable) ; `FlashcardsPanel` dans l'onglet « Réviser » de la matière.
- **Lane D — FormAI** (`feat/formai-canvas-actions`) : actions canvas V1 local-first (`src/lib/ai/canvas-context.ts` + `canvas-actions.ts`) — expliquer page, résumer, créer tâche depuis note (confirmation obligatoire) ; composants réutilisables `src/components/ai/PageAIActions*.tsx` ; anti-hallucination + disclaimer ; aucune écriture canvas. **Surface UI montée** (Lane E) : bouton « FormAI » dans l'en-tête de l'éditeur (`src/pages/EditorPage.tsx`), scope document.
- **Lane B — Drawing** (`feat/drawing-annotations-cartouches`) : B2 annotations (`src/lib/drawing/annotations.ts` : label/callout/leader) + B3 cartouches A4→A0 (`src/lib/drawing/titleblocks.ts`) ; dialogues `AnnotationDialog`/`TitleBlockDialog` dans la bibliothèque de blocs, même pipeline SVG→bloc→ImageElement, **aucune modification du canvas**, cotes B1 intactes.
- **Lane E — Intégration** : câblage Search V3 des flashcards (kind `flashcard`, recto/verso/tags → matière) ; maintenance `FORMA_STATE.md` ; exécution de la passe e2e après chaque étape.

Dexie : **v14** (table `flashcards` additive). Tests verts (**970**), build vert, Playwright vert à chaque étape d'intégration.

Surface FormAI (Lane D) montée dans l'en-tête de l'éditeur (bouton « FormAI », scope document).

### Sprint parallèle #2 (lanes A/C/D/B + intégration E)
- **Lane A** (`feat/resources-search-polish`) : façade unifiée `src/lib/resources/resourceFactory.ts` (`allGraphicResources`/`searchGraphicResources`/facettes `type:category` sans collision) + polish catalogue/preview.
- **Lane C** (`feat/study-exams-stats`) : C3 examens blancs (`src/lib/study/exam.ts`, `src/services/exams.ts`, `ExamPanel`) générés depuis flashcards/quiz + C4 stats (score/historique/par matière). Dexie additive **v14 → v15** (`exams`, `examAttempts`), `FORMA_DB_VERSION = 15`.
- **Lane D** (`feat/formai-selection-actions`) : FormAI Canvas V2 — explain V2, résumé scope-aware, **explain-selection préparé** (param `selectionText` + fallback page, contrat read-only documenté pour B).
- **Lane B** (`feat/drawing-scale-selection-foundation`) : B4 échelles (`src/lib/drawing/scale.ts`, page↔réel) + **accesseur de sélection read-only** testé (`src/lib/drawing/selection-accessor.ts`). Aucune modif canvas.
- **Lane E** : Search V3 + kinds `flashcard` (sprint #1) et **`exam`** ; ordre de merge E→A→C→D→B respecté.

Dexie : **v15**. Tests verts (**1052**), build vert, Playwright vert. Contrat B↔D : l'accesseur de sélection de B est sur `main` ; câblage réel dans FormAI à faire dans un sprint ultérieur.

### Sprint parallèle #3 (lanes A/C/D/B + intégration E)
- **Lane A** (`feat/arch-resources-v3`) : source Search unifiée `graphicResourceHits()` (resourceFactory) + sous-groupage par catégorie dans la vue groupée + polish previews.
- **Lane C** (`feat/study-goals-stats`) : C5 objectifs académiques (`src/lib/study/goals.ts`, `src/services/goals.ts`, `GoalsPanel`) + page stats globales `StudyStatsPage` (exams + flashcards + objectifs). Dexie additive **v15 → v16** (`academicGoals`), `FORMA_DB_VERSION = 16`.
- **Lane D** (`feat/formai-agents-v2`) : registre d'agents page (`src/lib/ai/agents.ts`) — Architecture/Normes/Structure/Études + grounding renforcé/disclaimer normatif ; sélecteur dans PageAIActions (générique par défaut).
- **Lane B** (`feat/drawing-scale-ui-legend`) : B4 UI d'échelle (1:N / réel-par-px) dans DimensionDialog + B6 légende de dessin (`src/lib/drawing/legend.ts` + dialog) ; pipeline SVG→bloc→ImageElement, aucune modif canvas.
- **Lane E** : route `/study/stats` (App.tsx + nav Library) ; pas de nouveau câblage Search requis (familles déjà indexées) ; `FORMA_STATE.md`.

Dexie : **v16**. Tests verts (**1130**), build vert, Playwright vert. Reste : adopter `graphicResourceHits()` dans ecosystem-search (refactor optionnel) ; câbler getSelectionText→FormAI (contrat B prêt).

### Sprint parallèle #4 (lanes A/C/D/B + intégration E)
- **Lane A** (`feat/arch-resources-v4`) : `graphicResourceHits()` durci (`globalId` `type-id`, route, `resourceCategoryCounts`) + chips détails comptés/labels légendes.
- **Lane C** (`feat/study-goals-stats-v2`) : auto-progression des objectifs depuis l'activité (exams/flashcards, `progressFromActivity`/`refreshAutoGoals`) + drilldown par matière sur StudyStatsPage. **Aucun changement Dexie (reste v16)** — champ `auto` optionnel non indexé.
- **Lane D** (`feat/formai-selection-wire`) : explain-selection réel branchable (`src/lib/ai/selection-context.ts` : `buildSelectionText`/`makeGetSelectionText`), import **types-only** de l'accesseur de sélection ; fallback page conservé.
- **Lane B** (`feat/drawing-titleblock-v2`) : cartouches V2 (champs custom/zone logo/lignes révision) + `formatRealPerPx` pour le libellé d'échelle. Pipeline SVG→bloc→ImageElement, aucune modif canvas.
- **Lane E** : Search **adopte `graphicResourceHits()`** (4 boucles → 1 source unifiée, sous-titres « Type · Catégorie », matériaux restent séparés) ; `FORMA_STATE.md`.

Dexie : **v16** (inchangé). Tests verts (**1191**), build vert, Playwright vert.

Limite notée (non forcée) : le **hand-off sélection→FormAI dans l'éditeur** n'est pas câblé — la sélection vit dans `src/canvas/*` (state non exposé à `EditorPage`), donc le brancher toucherait le canvas (risqué). Le contrat est prêt (`makeGetSelectionText` + accesseur read-only) ; à câbler dans un mini-slice Lane B/éditeur dédié.

### Sprint parallèle #5 (lanes A/C/D/B + intégration E)
- **Lane A** (`feat/arch-resources-v5`) : favoris ressources graphiques (filtre ★ + toggle, `resourceFavorites.ts`) + aperçu de template avant création (`templatePreview.ts`, plan + copie structure) + polish copie.
- **Lane C** (`feat/study-hub`) : page **Study Hub** globale (`StudyHubPage`, `src/lib/study/hub.ts`, `loadStudyHub`) — flashcards + examens + objectifs par matière, à réviser/aujourd'hui, tendances. Aucun changement Dexie (reste v16).
- **Lane D** (`feat/formai-doc-actions`) : actions document FormAI — reformuler / traduire / plan (`canvas-actions.ts`, grounded, lecture seule), boutons + sélecteur de langue dans PageAIActions.
- **Lane B** (`feat/drawing-annotation-polish`) : légende/cartouche anti-débordement + captions « W×H px » sous les aperçus de dialogues. Hand-off sélection→FormAI **différé** (hors scope lane, fichiers ai/*).
- **Lane E** : routes `/study` (Study Hub) + `/study/stats` ; nav Library (Étude hub + Stats) ; `FORMA_STATE.md`. Pas de nouveau câblage Search.

Dexie : **v16** (inchangé). Tests verts (**1237**), build vert, Playwright vert.

### Sprint parallèle #6 (Knowledge Foundation V1 — lanes K/C/D + E ; pas de Drawing)
- **Lane K** (`feat/knowledge-core`) : base Forma Knowledge V1 — `KnowledgeEntry` (terme/domaine/définition + **source + confidence obligatoires**), providers locaux extractifs (no hallucination, chemin « unknown » honnête), search-intent ; glossaire architecture adapté **sans modifier** `DictionaryModule`/`architecture-glossary`. `src/lib/knowledge/*` + `KnowledgeEntryCard`. Aucun changement Dexie.
- **Lane C** (`feat/knowledge-study`) : `flashcardFromKnowledge`/`examQuestionFromKnowledge` + service + bouton « Créer une flashcard » depuis une fiche. Réutilise flashcards/exams, aucun Dexie.
- **Lane D** (`feat/knowledge-formai-laneD`) : FormAI sur fiche — expliquer/comparer/résumer/quiz, local-first, grounding strict, source+confidence affichés (`src/lib/ai/knowledge-actions.ts`, `KnowledgeAIActions`).
- **Lane E** : `FORMA_STATE.md`. Pas de Wikipedia/Wikidata, pas de dump offline.

Dexie : **v16** (inchangé). Tests verts (**1310**), build vert, Playwright vert.

Limites notées : Knowledge V1 = glossaire architecture (1 provider, confidence `indicatif`) ; pas de page/route Knowledge dédiée → Search `knowledge` **différé** (éviter un lien mort) ; C définit un contrat `KnowledgeEntry` local (compatible, à réimporter depuis `src/lib/knowledge` plus tard) ; comparer-2-fiches : sélecteur de 2ᵉ fiche à câbler.

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
- 854 tests après Resource Factory Phase 2 (détails migrés + 103 détails + légendes V1) ;
- 865 tests après Resource Factory Phase 3 (auto-légendes + resource usage) ;
- 879 tests après Pack B1 (fondation des cotes) ;
- 970 tests après le Sprint parallèle #1 (A légendes groupées + C flashcards/SRS + D FormAI canvas + B annotations/cartouches).

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
- `feat/resource-factory-details-legends` — commit `363e71f2` (mergé)
- `feat/auto-legends-resource-usage` — commit `0e1686db` (mergé)
- `feat/drawing-dimensions-foundation` — commit `3724014a` (mergé)
- `docs: parallel sprint coordination` — commit `81b5e597` (mergé)
- Sprint parallèle #1 (mergé) : `feat/arch-resources-polish`, `feat/study-flashcards-srs`, `feat/formai-canvas-actions`, `feat/drawing-annotations-cartouches` + intégration Lane E

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

## Sprint #7 — Knowledge route / search / state (Lane E)

- Données : base de connaissance **920 entrées sourcées** intégrée (seeds Lane K, chargées paresseusement, hors bundle principal).
- Route : `/dictionary` (lazy) — navigateur Knowledge réel : recherche (`searchKnowledgeBase`), parcours par domaine, fiche via `?slug=`, deep link `?q=`. Source + confiance **toujours visibles** (badge « À vérifier »). No-result **honnête** (aucune définition inventée), slug introuvable → message, pas de crash.
- Reachability : 1 entrée « Dictionnaire » dans le menu overflow de LibraryPage (aucune page orpheline).
- Search : nouveau kind `knowledge` dans `searchEcosystem` (top ~5, lien `'/dictionary?slug=…'`), import **dynamique** de `@/lib/knowledge` dans le corps async (seeds jamais en eager). Icône 📖 dans SearchPage.
- Dexie : **inchangé** (aucune migration, aucune table).
- Limites : pas de filtres avancés (type/confiance), pas de pagination du parcours (échantillon par domaine), recherche knowledge non débouncée côté écosystème (bornée à 5).

## Sprint #8 — Dictionary UI Pro (Lanes U + E)

- **UI Pro `/dictionary`** (Lane U) : filtres combinables **type / domaine / confiance** + vues rapides **Favoris / Récents** ; **tri** (A→Z, Z→A, type, confiance, pertinence) ; **pagination en mémoire** (« charger plus », page de 24) ; **fiche détaillée enrichie** (`KnowledgeDetail` : longDefinition, exemples, synonymes, termes liés, tags, **toutes** les sources + confiance). Synonymes / termes liés **cliquables** (résolus vers une entrée via `resolveTerm`, sinon bascule en recherche → **zéro clic mort**) ; exemples cliquables (pré-remplissent la recherche).
- **Favoris / Récents** : persistés en **localStorage léger** (`useDictionaryStore`, zustand/persist, clé `forma-dictionary`) — **pas de Dexie**. Assainissement à la restauration (robuste au localStorage corrompu).
- Logique de parcours = module **pur testé** `src/lib/dictionary-filters.ts` (filtre/tri/pagination/`resolveTerm`), `src/lib/knowledge` reste **lecture seule**.
- Fix qualité : carte de liste rendue en `role=button` (plus de `<button>` imbriqué → console propre).
- **Search mieux priorisé** (Lane E) : `mergeWithKnowledgeQuota` réserve **≥3 places** aux fiches Knowledge dans `searchEcosystem` **sans supprimer** les autres résultats ni changer leur ordre — corrige le « visible mais bas » du Sprint #7 sur les termes courants. Icône 📖 inchangée. Import knowledge toujours **dynamique** (seeds hors bundle principal).
- Dexie : **inchangé**. Seeds : toujours **lazy/code-split** (920 entrées hors `index`).
- Limites : pas de surlignage des correspondances, pas d'URL des filtres (état non partageable par lien), quota Search fixe (3).
