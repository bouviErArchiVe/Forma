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

## Sprint #9 — Dictionary Expansion / Quality Pipeline (Lanes Q + I + E)

- **Quality & Validation Core** (Lane Q, lib pure) : `pack-schema` (validation STRICTE : schéma, source+confidence obligatoires, slug kebab, types de source légaux, collisions id/slug internes) ; `quality` (qualityScore 0..1 + qualityStatus ok/weak/review + flags traçables, **détection des définitions « gabarit »**) ; `dedup` (doublons exacts id/slug/term + quasi : synonyme croisé, Jaccard de tokens par domaine) ; `quality-report` (agrégat statut/domaine/type/confidence/provenance + échantillon faible).
- **Provenance** (additif/optionnel) : champ `provenance` ('forma'|'external'|'generated'|'à-vérifier') + `entryProvenance` qui **dérive de `sources[].type`** si absent. Ne casse pas les 920 entrées.
- **Import Pipeline** (Lane I) : `importPack(pack, base)` → validate → dedup **vs base** → provenance → quality → rapport `accepted (candidats) / rejected / duplicatesAgainstBase`. **Ne mute jamais la base** ; promotion manuelle uniquement.
- **CLIs dev** (hors bundle, `vite-node`) : `npm run knowledge:quality` (rapport base réelle) et `npm run knowledge:import [pack.json]` (simulation, défaut = pack test isolé). Pack test `src/data/knowledge/test-packs/sprint9-smoke.json` **non chargé** par le loader (glob `seeds/*.json` uniquement).
- **Constat qualité de la base actuelle** (via CLI) : 920/920 `templated` + `no-synonyms`, 811 weak / 109 review / 0 ok, provenance 920 `forma`, **28 doublons exacts + 1 quasi** (30 entrées impliquées). → feuille de route d'enrichissement avant gros pack.
- Garanties : `/dictionary` et Search knowledge **inchangés** (aucun fichier UI/Search modifié) ; Dexie inchangé ; pipeline + pack test **absents du bundle principal** (index 314 KB inchangé) ; source+confidence obligatoires, aucune suppression automatique.
- Limites : qualité = heuristique indicative (pas de NLP) ; near-dup bucketé par domaine ; provenance 'generated' jamais devinée (marquage explicite) ; candidats non persistés (fichiers/mémoire dev).

## Sprint #10 — Content Quality Upgrade (Lanes Q2 + C + U)

- **Pipeline d'upgrade** (Lane Q2) : `applyUpgradePack` (patche des entrées EXISTANTES par id, contenu seulement, valide le résultat en strict, mesure qualité avant/après) + `applyDedupPlan` (résolution EXPLICITE : `merge` = drop tracé au profit du gardé, `distinguish` = désambiguïsation de slug/term) ; **aucune suppression auto**. CLI `npm run knowledge:upgrade [--dry]` réécrit les seeds (hors bundle).
- **Résolution doublons** (Lane C, `upgrades/dedup-plan.json`) : 1 **merge** (`gen-composant-2`→`gen-composant`) + 13 **distinguish** (homographes architecture/études et bloc-béton système/matériau → slug + term « (terme général) »/« (système constructif) »). Collisions de slug **28 → 0**.
- **Upgrade pack** (Lane U, `upgrades/upgrade-pack-01.json`) : **81 entrées prioritaires** enrichies (matériaux, structure/construction, architecture) avec définition longue réelle, exemples, synonymes, termes liés, tags, source honnête, confidence ajustée. `garde-corps`/`rampe` passés en `à-vérifier` (valeurs normatives à confirmer).
- **Preuve mesurée** (CLI quality, base réécrite) : **ok 0 → 79**, weak 811 → 729, review 109 → 111, score moyen 0.48 → 0.52 ; base **920 → 919** (1 doublon fusionné). Doublons exacts 28 → 0 ; quasi 1 → 2 (= `enduit`~`crépi` synonymie réelle + `valeur R`/`valeur U` faux positif documenté).
- Garanties : tout via le pipeline #9/#10 (aucune mutation manuelle non tracée), source+confidence obligatoires, `/dictionary` et Search **inchangés** (aucun fichier UI/Search modifié), Dexie inchangé, seeds toujours lazy/code-split (index 314 KB inchangé). Tests de comptage mis à 919.
- Limites : 79/920 entrées « ok » (premier lot ; 840 restent à enrichir) ; near-dup détecte des synonymies réelles (revue humaine) ; pas d'UI de promotion (pipeline CLI).

## Sprint #11 — FormAI Local Knowledge Bridge (Lanes B + E)

- **Pont Knowledge** (`src/services/ai/knowledge-bridge.ts`) : pour une question de connaissance, le **provider local** consulte la base Knowledge LOCALE **avant** de renvoyer le message « je ne sais pas / configurez un fournisseur ». Réponse **ancrée** = `**terme** — définition` + `Source : … · Confiance : …` + lien `/dictionary?slug=…`, avec avertissement explicite si confidence = `à-vérifier`. Mention « réponse issue de la base Knowledge Forma, pas d'une IA générative » (jamais de prétention d'IA cloud).
- **Flux** (`providers/local.ts`) : 1) heuristiques locales (résumé/mots-clés/reformulation/extractif) → 2) si opération de texte sans contenu : message d'aide → 3) **bridge Knowledge** → 4) no-result honnête `NO_KNOWLEDGE_MESSAGE` (« pas trouvé dans vos notes ni dans la base Knowledge locale… ») si rien. Fallback fournisseur cloud conservé s'il est configuré.
- **Robustesse** : extraction de mots-clés (strip « c'est quoi », « définition de »…), lookup slug kebab (couvre `garde-corps`), recherche multi-formes, **garde de pertinence** (anti-faux-positif), préférence à la correspondance exacte. Import Knowledge **dynamique** → seeds hors bundle (index 314 KB ~inchangé, seedToken=0).
- Garanties : aucune invention (null si pas de fiche fiable) ; source+confidence toujours présentes ; `/dictionary` + Search **inchangés** ; Dexie inchangé ; pas de réseau.
- Limites : le pont sert des extraits de fiches (pas de génération) ; qualité des réponses bornée par la qualité des fiches (79 ok) ; pas de provider local LLM (LM Studio/Ollama) dans ce sprint.

## Sprint #14 — Content Upgrade Pack #2 (Lanes U2 + E)

- **upgrade-pack-02.json** : ~144 entrées EXISTANTES prioritaires enrichies (matériaux, systèmes constructifs, architecture générale, design intérieur, histoire/styles) — shortDefinition + longDefinition réelle (non gabarit) + examples + synonyms + relatedTerms + tags + source honnête + confidence ajustée. `main courante` et `maison passive` passés `à-vérifier` (normatif).
- **Pipeline** : `knowledge:upgrade` applique désormais **tous** les `upgrade-pack-*.json` (ordre alphabétique). Seeds réécrits par pipeline uniquement (aucune mutation manuelle).
- **Preuve mesurée** : **ok 79 → 221** (cible 200+ atteinte), weak 729 → 585, review 111 → 113, score moyen 0.52 → 0.59. Doublons **exacts = 0** (inchangé) ; quasi 2 → 6 (synonymies réelles signalées, ex. auvent~marquise, cloison~mur non porteur, modernisme~mouvement moderne — à arbitrer humainement, pas des collisions). Base inchangée à **919**.
- Bénéfice transverse : améliore simultanément le bridge #11, le grounding #12 et les réponses localmodel #13 (matière plus riche).
- Garanties : `/dictionary` + Search + bridge inchangés ; Dexie inchangé ; seeds toujours lazy/code-split (index ~314 KB, seedToken=0) ; source+confidence obligatoires ; pas de suppression auto.
- Limites : 221/919 « ok » (≈ 700 restent weak/review) ; quasi-dup = synonymies à revoir ; pas d'UI de promotion (pipeline CLI).

## Sprint #15 — Content Upgrade Pack #3 (Lanes U3 + E)

- **upgrade-pack-03.json** : ~140 entrées EXISTANTES enrichies — surtout le vocabulaire général (méthodes d'étude/travail, UX, numérique) + concepts restants (matériaux, systèmes, architecture, intérieur, histoire/durabilité). Toutes : short/longDefinition réelle, examples, synonyms, relatedTerms, tags, source honnête, confidence (concept/indicatif).
- **Preuve mesurée** : **ok 221 → 372** (cible 350+ dépassée), weak 585 → 434, review 113 inchangé, score moyen 0.59 → 0.66. Doublons **exacts = 0** ; quasi 6 → 11 (synonymies réelles : synonyme~antonyme, résumé~synthèse, modèle~maquette, habitude~routine… — à arbitrer humainement). Base inchangée à **919**.
- Pipeline multi-packs : applique `upgrade-pack-01/02/03`. Seeds réécrits par pipeline uniquement.
- Garanties : `/dictionary` + Search + bridge inchangés ; Dexie inchangé ; seeds lazy/code-split (index 314 KB, seedToken=0).
- Limites : 372/919 « ok » (≈ 547 restent weak/review — surtout normatif/biographique honnêtement à-vérifier → review, et entrées non encore traitées) ; quasi-dup = synonymies à revoir.

## Sprint #16 — Content Upgrade Pack #4 (Lanes U4 + E)

- **upgrade-pack-04.json** : ~134 entrées EXISTANTES enrichies — vocabulaire général/UX/numérique restant, équipements d'intérieur (sanitaire, électricité, mobilier), concepts histoire/urbanisme/durabilité, et reliquats architecture/systèmes/matériaux. Toutes sourcées, non gabarit.
- **Preuve mesurée** : **ok 372 → 505** (cible 500+ atteinte), weak 434 → 298, review 113 → 116, score moyen 0.66 → 0.72. Doublons **exacts = 0** ; quasi 11 → 15 (synonymies réelles). Base inchangée à **919**.
- Honnêteté : entrées d'évacuation/normatives (`chemin d'évacuation`, `issue`, `net zéro`) gardées `à-vérifier` → review, PAS forcées en ok.
- Garanties : `/dictionary` + Search + bridge + grounding inchangés ; Dexie inchangé ; seeds lazy/code-split (index 314 KB, seedToken=0).
- Note stratégique : fin probable du cycle « content pack » à fort rendement — le weak restant (~298) est désormais surtout normatif/biographique (people/buildings/norms) honnêtement à-vérifier. Prochain pivot conseillé : Streaming localmodel ou Real Local Model QA.

## Sprint #17 — Streaming Local Model (Agents S + U + Q)

- **Streaming core** (`streamLocalModelChat`, providers/localmodel.ts) : SSE OpenAI-compatible (`stream: true`), `fetch` natif (aucun SDK), parse des deltas + `[DONE]`, `extractSSEDelta` tolérant au JSON malformé. Streaming **uniquement** pour `localmodel`.
- **Fallbacks** : abort utilisateur (Stop) → réponse partielle finalisée, `interrupted: true`, PAS de repli ; erreur réseau/CORS/HTTP/timeout/flux vide → repli **non-stream** → pont Knowledge **#11**. `fromLocalModel: true` seulement si le modèle a produit du texte ; `fromCloud: false`.
- **UI** (`sendFormAIMessageStream`, ChatView, FormAIPage) : affichage progressif (bulle live + curseur), bouton **Stop** (rouge) pendant la génération, message d'erreur conservé, citations/source/confidence/lien préservés. `prepareTurn`/`persistAssistant` partagés → chemin non-stream et grounding #12 intacts. Stop n'efface pas la conversation.
- **Grounding** : inchangé (#12) — fiche injectée en contexte pour provider génératif ; jamais de source inventée si aucune fiche.
- Garanties : aucun appel réseau auto au chargement (streaming opt-in via provider localmodel) ; aucun crash si serveur absent ; `/dictionary` + Search + bridge intacts ; Dexie inchangé ; **bundle principal inchangé** (314 KB, seeds code-split, 0 SDK).
- Tests : +13 (10 stream core : succès/partiel/abort/réseau/HTTP/SSE malformé/vide ; 3 orchestration). QA navigateur runtime : stream mocké 3 chunks + texte assemblé (fromLocalModel) ; abort → partiel interrompu ; réseau → fallback #11 ; localmodel sans serveur → fallback grounded silencieux.
- Limites : connexion réelle LM Studio/Ollama toujours non testable ici (mocks + fallback couvrent) ; pas de streaming pour les providers cloud ce sprint.

## Sprint #12 — Local AI Provider (LM Studio / Ollama) (Lanes P + G + E)

- **Provider `localmodel`** (`src/services/ai/providers/localmodel.ts`) : OpenAI-compatible `POST {baseUrl}/chat/completions` via **fetch** (aucun SDK), **clé optionnelle**, **timeout** configurable. `fromCloud:false` / `fromLocalModel:true`. Cible **LM Studio** (`http://localhost:1234/v1`) et **Ollama** (`http://localhost:11434/v1`). `testLocalModelConnection` (GET `/models`).
- **Jamais bloquant** : toute erreur réseau/CORS/HTTP/timeout → **fallback automatique** vers le mode local extractif #11 (l'erreur du serveur est conservée dans `result.error`). **Strictement opt-in** : aucun appel réseau si `localmodel` n'est pas sélectionné ; activable **sans** la case « cloud » (la sélection = l'opt-in).
- **Grounding Knowledge** (`knowledge-grounding.ts` + `chat.ts`) : pour un provider **génératif** (modèle local ou cloud), la fiche Knowledge pertinente est injectée en contexte système avec consigne anti-hallucination (cite source + confidence, n'invente aucune norme, lien `/dictionary?slug=`, avertissement si « à-vérifier »). Réutilise `findRelevantEntry` (#11) + `renderEntryBlock` (#6). Si aucune fiche : rien d'injecté (pas d'invention au nom de Forma). Le provider `local` extractif garde son propre pont #11.
- **UI Réglages** (`AISettingsSection`) : option « Modèle local », URL de base, modèle, **timeout**, **bouton test** + état connecté/non connecté — visible sans activer le cloud. Badge FormAI traite `localmodel` comme local (pas cloud).
- Garanties : `import` Knowledge dynamique (seeds hors bundle, index ~314 KB), pas de SDK lourd, clé jamais requise pour le local, `/dictionary` + Search inchangés, Dexie inchangé (sauf champ localStorage `localTimeoutMs` dans aiStore).
- Limites : pas de streaming ce sprint ; qualité de génération dépend du modèle local installé ; CORS à autoriser côté serveur local si besoin.

## Sprint #13 — Local Model Real-World Setup (Lanes D + S + E)

- **Diagnostic classé** (`diagnoseLocalModelConnection`) : `ok` / `no-models` / `model-missing` / `endpoint-invalid` (404) / `unreachable-or-cors` / `timeout` / `invalid-response` / `http-error`. Le navigateur masquant la cause d'un échec réseau (CORS vs serveur down sont indistinguables), le statut `unreachable-or-cors` reste **prudent** (n'affirme aucune cause unique) ; chaque statut porte un **message actionnable**. Liste les modèles via GET `/models`. `testLocalModelConnection` conservé (connectivité seule).
- **Setup UX** (`AISettingsSection`) : presets **LM Studio** (`:1234/v1`) / **Ollama** (`:11434/v1`) ; **sélection du modèle** depuis la liste détectée + saisie libre ; état connecté / non connecté / CORS probable / modèle introuvable ; **guide intégré** (lancer le serveur, URL de base, CORS `OLLAMA_ORIGINS`/LM Studio, modèle léger) + modèles conseillés (Phi-3 mini, Qwen2 0.5–1.5B, Gemma 2B, Mistral 7B Q4).
- Garanties : **aucun appel réseau hors action explicite** (test/usage) ; fallback #11 et grounding Knowledge **intacts** ; `localmodel` ne s'active jamais automatiquement (opt-in par sélection) ; pas de dépendance lourde (fetch) ; bundle inchangé (index ~314 KB).
- Limites : la cause exacte d'un échec réseau reste indéterminable depuis le navigateur (par conception) ; pas de test avec un vrai serveur LM Studio/Ollama en CI (couvert par mocks + fallback) ; pas de streaming.

## Sprint spécial — Resource Pack PDF Integration (Part 10, Agents I/D/R/Q)

- **Pack** : `FORMA_RESOURCE_PACK_FROM_PDFS_PART_10` — données app sous `public/knowledge-pack/part10/` (≈64 MB, **fetch runtime, jamais dans le bundle JS**). Gates `clean` / `review` / `quarantine`.
- **Dexie v17** (additif) : `formaKnowledgeEntries`, `formaRagChunks`, `formaSearchKeywords`, `formaImportBatches` (clés string → bulkPut idempotent). FORMA_DB_VERSION = 17.
- **Import** (Agent I) : lazy + idempotent (skip si pack/version déjà `completed`), détection de réimport, journal de batch, transaction clear+bulkPut, échec → batch `failed` + données préservées ; **quarantine jamais importé**. Validé en navigateur : **9738 entrées, 18751 chunks, 2500 mots-clés** (19 chunks <80c rejetés), réimport `skipped`.
- **Dictionary + Search** (Agent D) : onglet `/dictionary?source=pack` (KnowledgePackBrowser) — badges gate (Sourcé / À vérifier / **Historique** Académie), source **document + page**, filtres gate/document, recherche, quarantine caché ; **Base Forma** (seeds) inchangée. Search global : kind `docpack` **seulement si le pack est importé** (pas d'import auto depuis la recherche), quota réservé → résultats sourcés présents (poutre/fondation/accessibilité).
- **FormAI RAG** (Agent R) : `ragAnswer` sur `formaRagChunks` — **clean d'abord, review seulement si pas de clean** (avec avertissement), **quarantine jamais**, citations document+page, extraits sourcés (jamais inventés). Avertissement officiel imposé pour review/normatif. Branché dans le provider local après le pont #11, avant le no-result honnête. Vérifié : FormAI cite source+page, question normative → avertissement.
- Garanties : aucun gros JSON dans le bundle (`packInBundle=0`, index ~314 KB) ; pas de SDK lourd (fetch) ; `/dictionary` Base Forma, Search seeds, FormAI #11 et Dexie existant **intacts** ; aucune suppression de données existantes.
- Tests : +44 (schéma pack, import idempotent/force/quarantine/échec, query gates/historique, RAG clean-first/quarantine/citation/warning/no-result) ; schema.test v17.
- Limites : import initial ~70 s en navigateur (64 MB, une fois) ; Search/RAG pack n'opèrent qu'après le 1er import (déclenché par /dictionary Documents ou une question FormAI hors-seeds) ; `review_priority` (8 MB) non embarqué (redondant) ; quasi-doublons inter-sources non dédupliqués entre pack et seeds.

## Sprint #18 — Pack RAG Grounding pour providers génératifs

- **`buildPackGrounding`** (`src/services/ai/pack-grounding.ts`) : récupère les meilleurs chunks pack via `retrievePackChunks` (clean d'abord ; review seulement si aucun clean, avec avertissement ; **quarantine jamais**) et construit un bloc système BORNÉ (≤ 3 extraits, ~500 car. chacun) avec citations **document + page**.
- **`prepareTurn`** (chat.ts) injecte désormais, pour un provider GÉNÉRATIF (localmodel/cloud) : (1) grounding seeds Knowledge (#12) PUIS (2) grounding pack RAG clean (#18). Le modèle vif en streaming peut donc **citer les documents PDF**, plus seulement les seeds. Provider `local` extractif conserve sa chaîne pont→RAG.
- Sécurité : sujet normatif/technique force la phrase officielle « …à vérifier dans la version officielle/applicable… » ; aucune invention ; import pack paresseux ; fetch natif ; **aucun changement de schéma Dexie** ; prompt borné.
- Ordre FormAI génératif : heuristiques → seeds #11 → **pack RAG clean (grounding)** → streaming localmodel (contexte combiné) → si indisponible, repli extractif seeds+pack → no-result honnête.
- Vérifié (runtime) : prompt localmodel streaming contient `CONTEXTE DOCUMENTAIRE FORMA` + citation `*.pdf · p. N` + contexte seeds, quarantine absente ; streaming/Stop/fallback/Search/dictionary intacts.
- Tests : +6 (pack-grounding) ; vitest 1500 ; tsc -b + build verts ; pack hors bundle (packDataInBundle=0).

## Sprint #19 — FormAI Source Chips / Citations UI

- **Contrat** (Lane E) : type `AssistantSource` { kind: 'seed'|'pack', label, document?, page?, gate?, toVerify?, slug? } sur `StoredChatMessage` + `ProviderChatResult`. Issu UNIQUEMENT des données structurées (fiche seeds, chunk pack) — JAMAIS d'un parsing du texte du modèle.
- **Pipe** : provider extractif `local` renvoie les sources (seed via `knowledgeAnswer` slug+toVerify ; pack via `ragAnswer` chunks → document/page/gate, dédoublonnés, jamais quarantine). `prepareTurn` (génératif localmodel/cloud) construit les sources depuis le grounding seeds + pack (citations), dédoublonnées et bornées (5). `persistAssistant` attache `result.sources` (extractif) sinon `prep.sources` (génératif).
- **UI** (Lane U, ChatView) : chips sous la bulle assistant — 📖 seed (lien `/dictionary?slug=`) / 📄 pack (« document · p. N », non-lien = zéro dead link) ; badges « Sourcé » (clean) vs « À vérifier » (review/toVerify) + note d'avertissement officielle si une source est à vérifier. Streaming/Stop, citations RAG existantes et anciens messages sans sources inchangés.
- Vérifié (runtime) : chip seed lié → `/dictionary?slug=poutre` résout (pas de dead link) ; chip pack `CCQ.pdf · p. 120` + badge « À vérifier » + note ; message sans source ne casse pas ; console propre.
- Sécurité : quarantine jamais affichée ; review → badge + avertissement ; aucune citation inventée (si aucune source structurée → pas de chip).
- Tests : +5 (citations contract/pipe) ; vitest 1505 ; tsc -b + build verts ; pas de Dexie, pas de SDK, pack hors bundle.
