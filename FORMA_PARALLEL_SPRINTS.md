# FORMA_PARALLEL_SPRINTS.md

# Forma — Système de sprints parallèles contrôlés

Coordination officielle du développement multi-lanes. Objectif : avancer plus
vite sans casser `main`, en isolant chaque lane (branche dédiée) et en
attribuant un **propriétaire unique** à chaque fichier critique.

À lire avec : `FORMA_CONTEXT.md`, `FORMA_STATE.md`, `FORMA_MASTER_ROADMAP.md`,
`FORMA_WORKFLOW.md`, `FORMA_ARCHITECTURE_RULES.md`, `FORMA_QA_RELEASE_CHECKLIST.md`,
`FORMA_RISK_REGISTER.md`.

## Principe

- Une lane = une zone + une branche + des fichiers autorisés + un objectif limité.
- Un fichier critique = **un seul propriétaire** par sprint.
- Si une lane a besoin d'un fichier d'une autre lane → **elle s'arrête et le signale** (pas d'édition « en passant »).
- Le canvas est la zone la plus risquée → mergé **en dernier**.
- Vérif lourde (Playwright + QA navigateur) centralisée par Lane E à l'intégration (un seul serveur 5173 possible).

## Lanes

| Lane | Branche (sprint courant) | Zone |
|---|---|---|
| A — Architecture Resources | `feat/arch-resources-polish` | ressources, hachures, symboles, détails, légendes, templates, matériaux, normes |
| B — Drawing / Canvas | `feat/drawing-annotations-cartouches` | cotes, annotations, cartouches, échelles, outils dessin |
| C — Study | `feat/study-flashcards-srs` | flashcards, révision espacée, examens, stats, matières/calendrier |
| D — FormAI | `feat/formai-canvas-actions` | agents, actions contextuelles, explication, génération (local-first) |
| E — QA / Integration | `chore/integration-parallel-sprint` | tests, Playwright, intégration Search, état, doc |

## Propriété des fichiers critiques (sprint courant)

| Fichier / zone | Propriétaire unique |
|---|---|
| `src/components/editor/BlockLibraryPanel.tsx` | **Lane B** |
| `src/canvas/*` | **Lane B** |
| `src/lib/dimensions/*`, `src/lib/drawing/*` | **Lane B** |
| `src/lib/resources/*`, `src/components/resources/*`, `src/pages/ResourcesPage.tsx` | **Lane A** |
| `src/lib/ai/*`, `src/components/ai/*`, `src/modules/formai/*`, `src/services/ai*` | **Lane D** |
| `src/lib/study/*` + modules/flashcards/SRS | **Lane C** |
| `src/lib/ecosystem-search.ts`, `src/pages/SearchPage.tsx` | **Lane E** |
| `FORMA_STATE.md`, `FORMA_PARALLEL_SPRINTS.md` | **Lane E** |
| `src/db/index.ts`, `src/types/index.ts` (Dexie/schema) | **Lane C ce sprint** (additif uniquement) ; coordination requise si une autre lane en a besoin |
| `src/App.tsx`, `src/pages/LibraryPage.tsx` (routes/nav) | coordination via Lane E |

## Zones par lane

### Lane A — Architecture Resources (`feat/arch-resources-polish`)
- **Autorisé** : `src/lib/resources/*`, `src/components/resources/*`, `src/pages/ResourcesPage.tsx`
- **Interdit** : `src/canvas/*`, `src/components/editor/BlockLibraryPanel.tsx`, `src/lib/ecosystem-search.ts`, `src/pages/SearchPage.tsx`, `FORMA_STATE.md`
- Objectif : polish Resource Factory, légendes améliorées (regroupement par type/catégorie), previews. Besoin Search → exposer les exports et le **signaler** (Lane E câble).

### Lane B — Drawing / Canvas (`feat/drawing-annotations-cartouches`)
- **Autorisé (propriétaire)** : `src/components/editor/BlockLibraryPanel.tsx`, `src/canvas/*`, `src/lib/dimensions/*`, `src/lib/drawing/*`, autres `src/components/editor/*` liés
- **Interdit** : `src/lib/resources/*` (sauf besoin clair signalé), Search, `FORMA_STATE.md`
- Objectif : B2 annotations simples, B3 cartouches V1, sans refactor canvas ; ne pas casser ImageElement/strokes/export/cotes B1. **Merge en dernier.**

### Lane C — Study (`feat/study-flashcards-srs`)
- **Autorisé** : `src/lib/study/*`, `src/services/*`, `src/stores/*`, `src/modules/*`, `src/pages/*` (study), `src/db/index.ts` + `src/types/index.ts` (additif)
- **Interdit** : `src/canvas/*`, `src/lib/resources/*`, `src/components/editor/BlockLibraryPanel.tsx`, Search, `FORMA_STATE.md`
- Objectif : C1 flashcards, C2 base SRS, liens matières, tests, stockage additif non destructif.

### Lane D — FormAI (`feat/formai-canvas-actions`)
- **Autorisé** : `src/lib/ai/*`, `src/components/ai/*`, `src/modules/formai/*`, `src/services/ai*`
- **Interdit** : cloud obligatoire, écriture profonde du canvas, Search, `FORMA_STATE.md`
- Objectif : FormAI Canvas Actions V1 (expliquer page/sélection, créer tâche depuis note, résumer), local-first, sans halluciner de normes.

### Lane E — QA / Integration (`chore/integration-parallel-sprint`)
- **Propriétaire** : `FORMA_STATE.md`, `FORMA_PARALLEL_SPRINTS.md`, `src/lib/ecosystem-search.ts`, `src/pages/SearchPage.tsx`
- Objectif : maintenir la coordination, câbler Search pour les lanes, surveiller les conflits, exécuter Playwright + QA navigateur à l'intégration, maintenir `FORMA_STATE.md`, piloter l'ordre de merge.

## Ordre de merge obligatoire

1. `chore/integration-parallel-sprint` (base coordination)
2. `feat/arch-resources-polish`
3. `feat/study-flashcards-srs`
4. `feat/formai-canvas-actions`
5. `feat/drawing-annotations-cartouches` (**canvas en dernier**)

Après **chaque** merge sur `main` :

```bash
git status
npm run test -- --run
npm run build
npx playwright test
```

Search (`ecosystem-search.ts` + `SearchPage.tsx`) est câblé par Lane E lors de l'intégration de chaque lane qui en a besoin.

## Règles de conflit

1. Un fichier critique = un seul propriétaire (table ci-dessus). Toute autre lane qui doit le toucher **s'arrête et signale**.
2. Pas d'édition de `FORMA_STATE.md` / Search hors Lane E.
3. Dexie : additif uniquement, tests de schéma, jamais destructif.
4. Canvas : pas de refactor ; réutiliser `SVG → blockToSvg → raster → asset Dexie → ImageElement`.
5. Chaque lane reste dans sa branche ; jamais de commit direct sur `main` (sauf cette doc de coordination).
6. Vérif e2e/navigateur centralisée (un seul port 5173) → Lane E à l'intégration.

## Checks obligatoires par lane (avant remise)

- `npx tsc -b` propre
- `npm run test -- --run` vert (tests ajoutés pour la logique nouvelle)
- `npm run build` vert
- lint ciblé sur les fichiers modifiés
- rapport : fichiers modifiés, ce qui est livré, tests, besoins inter-lanes (ex. câblage Search), limites

---

# Sprint #2 — Study + Resources + Drawing Foundations + FormAI Selection

Sprint #1 (fondations Resource Factory + Drawing B1 + Study flashcards/SRS + FormAI canvas V1) validé et mergé sur `main` (`fe037d21`). Le Sprint #2 reprend exactement la même méthode : worktrees isolés par lane, propriété unique des fichiers critiques, Search/State centralisés en Lane E, Drawing mergé en dernier, gate après chaque merge.

## Lanes & branches (Sprint #2)

| Lane | Branche | Objectif |
|---|---|---|
| C — Study | `feat/study-exams-stats` | C3 examens blancs V1 + C4 statistiques d'apprentissage V1 (score, historique, par matière, depuis flashcards si possible) |
| A — Resources | `feat/resources-search-polish` | polish Resource Factory : regroupement catégories/types, affichage ressources graphiques, previews, légendes ; préparer un kind unifié `resource` exposable à Search |
| B — Drawing | `feat/drawing-scale-selection-foundation` | B4 échelles dynamiques V1 (modèle scale/profile + helper conversion page↔réel) + **accesseur de sélection read-only** typé/testé. Aucune refonte canvas. Merge en dernier |
| D — FormAI | `feat/formai-selection-actions` | FormAI Canvas Actions V2 : expliquer page, résumé amélioré, **préparer expliquer-sélection** (utilise l'accesseur read-only de B si dispo+stable, sinon fallback propre + contrat documenté) |
| E — Integration | `chore/integration-sprint-2` | maintenir coordination + `FORMA_STATE.md`, câbler Search V3, harmoniser libellés, exécuter les gates, piloter l'ordre de merge |

## Propriété des fichiers critiques (Sprint #2 — un seul propriétaire)

| Fichier / zone | Propriétaire |
|---|---|
| `src/components/editor/BlockLibraryPanel.tsx` | **Lane B** |
| `src/canvas/*` | **Lane B** (dont l'accesseur de sélection read-only) |
| `src/lib/dimensions/*`, `src/lib/drawing/*` | **Lane B** |
| `src/lib/ecosystem-search.ts`, `src/pages/SearchPage.tsx` | **Lane E** |
| `FORMA_STATE.md`, `FORMA_PARALLEL_SPRINTS.md` | **Lane E** |
| `src/lib/resources/*`, `src/components/resources/*`, `src/pages/ResourcesPage.tsx` | **Lane A** |
| `src/lib/study/*`, services/stores exams+stats+flashcards | **Lane C** |
| `src/db/index.ts`, `src/types/index.ts` (Dexie/schema) | **Lane C** ce sprint (additif uniquement) |
| `src/lib/ai/*`, `src/components/ai/*` | **Lane D** |
| `src/pages/EditorPage.tsx`, `src/App.tsx` (montage/routes) | coordination via **Lane E** |

## Contrat inter-lanes B↔D (sélection)
Lane B expose un accesseur **read-only, typé, testé** de la sélection courante (sans casser strokes/images/blocs/cotes/annotations/cartouches). Lane D ne l'importe PAS ce sprint (il n'existe pas encore sur `main` au fork) : D livre expliquer-page/résumé + un **fallback** pour la sélection et **documente le contrat** attendu. La consommation réelle se fera dans un sprint ultérieur, une fois l'accesseur sur `main`.

## Ordre de merge Sprint #2 (strict)
1. `chore/integration-sprint-2` (base coordination)
2. `feat/resources-search-polish`
3. `feat/study-exams-stats`
4. `feat/formai-selection-actions`
5. `feat/drawing-scale-selection-foundation` (**canvas en dernier**)

Gate après chaque merge : `git status` · `npm run test -- --run` · `npm run build` · `npx playwright test`. Search câblé par Lane E à l'intégration. Vérif e2e/navigateur centralisée (Lane E, un seul port 5173).

---

# Sprint #3 — Resources Search / Study Goals / FormAI Agents / Drawing Scale-UI

Sprint #2 validé/mergé (`511d7bd0`, Dexie v15). Même méthode : worktrees isolés, propriété unique des fichiers critiques, Search/State/routes en Lane E, Drawing mergé en dernier, gate après chaque merge.

| Lane | Branche | Objectif | Propriété |
|---|---|---|---|
| A | `feat/arch-resources-v3` | export `resource` unifié pour Search + sous-groupage par catégorie + polish previews | `src/lib/resources/*`, `src/components/resources/*`, `src/pages/ResourcesPage.tsx` |
| C | `feat/study-goals-stats` | C5 objectifs académiques + page stats globales (réutilise exams/flashcards) | `src/lib/study/*`, `src/services/*` (study), `src/stores/*`, study pages, `src/db/index.ts`+`src/types/index.ts` (additif **v15→v16**) |
| D | `feat/formai-agents-v2` | agents spécialisés (Archi/CNB/Structure/Études) + grounding ; explain-selection garde le fallback | `src/lib/ai/*`, `src/components/ai/*` |
| B | `feat/drawing-scale-ui-legend` (dernier) | B4 UI d'échelle dans les dialogues + B6 légende de dessin ; consomme l'accesseur de sélection read-only | `src/canvas/*`, `src/components/editor/*`, `src/lib/drawing/*`, `src/lib/dimensions/*` |
| E | `chore/integration-sprint-3` | Search (`ecosystem-search.ts`, `SearchPage.tsx`), `FORMA_STATE.md`, **routes** (`App.tsx`, nav), gates, ordre de merge ; câble getSelectionText→FormAI si contrat B stable | Search + State + routes |

Interdits transverses : aucune lane hors E ne touche Search/State/routes ; D↔B selection wiring **différé** (E câble à l'intégration si stable, sinon fallback). C Dexie **additif** seulement.

Ordre de merge strict : `chore/integration-sprint-3` → `feat/arch-resources-v3` → `feat/study-goals-stats` → `feat/formai-agents-v2` → `feat/drawing-scale-ui-legend`. Gate complet après chaque merge ; push `main` seulement après le vert final.

---

# Sprint #4 — Selection wiring / Resources search / Study v2 / Cartouches v2

Sprint #3 validé/mergé (`27aab943`, Dexie v16). Même méthode.

| Lane | Branche | Objectif | Propriété |
|---|---|---|---|
| A | `feat/arch-resources-v4` | adopter `graphicResourceHits()` (préparer source Search unique) + polish détails/légendes | `src/lib/resources/*`, `src/components/resources/*`, `src/pages/ResourcesPage.tsx` |
| C | `feat/study-goals-stats-v2` | progression objectifs depuis activité exams/flashcards + drilldown par matière sur StudyStatsPage | `src/lib/study/*`, `src/services/*` (study), `src/stores/*`, study pages, db/types (additif **v16→v17 seulement si indispensable**) |
| D | `feat/formai-selection-wire` | brancher `getSelectionText` (accesseur read-only de B, déjà sur `main`) dans explain-selection, fallback conservé | `src/lib/ai/*`, `src/components/ai/*` |
| B | `feat/drawing-titleblock-v2` (dernier) | cartouches V2 (champs custom/zone logo/ligne révision) + polish cote/échelle | `src/canvas/*`, `src/components/editor/*`, `src/lib/drawing/*`, `src/lib/dimensions/*` |
| E | `chore/integration-sprint-4` | Search (adopter `graphicResourceHits`), `FORMA_STATE.md`, routes, **hand-off sélection→FormAI dans l'éditeur** si nécessaire, gates | Search + State + routes + EditorPage |

Interdits transverses : hors E, pas de Search/State/routes/EditorPage. D consomme `src/lib/drawing/selection-accessor.ts` en lecture seule (déjà sur `main`, stable) ; le branchement de la sélection vivante dans l'éditeur est fait par E à l'intégration. C Dexie additif uniquement.

Ordre strict : `chore/integration-sprint-4` → `feat/arch-resources-v4` → `feat/study-goals-stats-v2` → `feat/formai-selection-wire` → `feat/drawing-titleblock-v2`. Gate complet après chaque merge ; push après vert final.

---

# Sprint #5 — Study Hub / Resources exploitables / FormAI doc / Drawing polish

Sprint #4 validé/mergé (`94f3fbda`, Dexie v16). Même méthode.

| Lane | Branche | Objectif | Propriété |
|---|---|---|---|
| A | `feat/arch-resources-v5` | détails/légendes/templates plus exploitables : favoris ressources graphiques, copie/insert affordances, aperçu template avant création | `src/lib/resources/*`, `src/components/resources/*`, `src/pages/ResourcesPage.tsx` |
| C | `feat/study-hub` | page Study Hub globale routée (flashcards + examens + objectifs + à réviser/aujourd'hui), filtres par matière, réutilise services existants | `src/lib/study/*`, `src/services/*` (study), `src/stores/*`, study pages/composants, db/types (additif **seulement si indispensable**) |
| D | `feat/formai-doc-actions` | FormAI documents/notes : reformuler/traduire/plan du texte de page (local-first, grounded), réutilise canvas-actions | `src/lib/ai/*`, `src/components/ai/*` |
| B | `feat/drawing-annotation-polish` (dernier) | polish annotations/cotes/cartouches + B6 légende (aperçu avant insert, défauts) ; hand-off sélection→FormAI **seulement si low-risk, sinon defer** | `src/canvas/*`, `src/components/editor/*`, `src/lib/drawing/*`, `src/lib/dimensions/*` |
| E | `chore/integration-sprint-5` | routes (Study Hub), Search si nouveaux indexables, `FORMA_STATE.md`, gates | Search + State + routes + EditorPage |

Interdits transverses : hors E, pas de Search/State/routes/EditorPage/App.tsx. C Dexie additif uniquement (v16→v17 seulement si nouvelle table indispensable). C expose le composant page ; E ajoute la route.

Ordre strict : `chore/integration-sprint-5` → `feat/arch-resources-v5` → `feat/study-hub` → `feat/formai-doc-actions` → `feat/drawing-annotation-polish`. Gate complet après chaque merge ; push après vert final.

---

# Sprint #6 — Knowledge / Dictionnaire Foundation V1 (pas de Drawing)

Sprint #5 validé/mergé (`a45caaec`, Dexie v16). Transformer le dictionnaire en base Forma Knowledge V1, sans encyclopédie complète ni dump offline.

| Lane | Branche | Objectif | Propriété |
|---|---|---|---|
| K | `feat/knowledge-core` | `KnowledgeEntry` (terme, domaine, définition, **source + confidence obligatoires**), providers locaux extractifs, search-intent ; transforme le dictionnaire **sans le casser** | `src/lib/knowledge/*`, `src/modules/dictionary/*`, `src/components/knowledge/*` (seule lane à toucher le dictionnaire) |
| C | `feat/knowledge-study` | créer flashcard / question d'examen depuis une fiche Knowledge (réutilise flashcards/exams) | `src/lib/study/*`, `src/services/*` (study), `src/components/study/*`, db/types (additif si indispensable) ; importe types Knowledge read-only |
| D | `feat/knowledge-formai` | FormAI sur fiche Knowledge : expliquer/comparer/résumer/quiz, local-first + grounding + source/confidence affichés | `src/lib/ai/*`, `src/components/ai/*` ; importe types Knowledge read-only |
| E | `chore/integration-sprint-6` | routes (knowledge/dictionnaire), Search (kind `knowledge`), `FORMA_STATE.md`, gates | `src/lib/ecosystem-search.ts`, `src/pages/SearchPage.tsx`, `src/App.tsx`, `FORMA_STATE.md` |

Interdits transverses : seule K touche `src/modules/dictionary/*` et `src/lib/knowledge/*` ; C/D importent les types Knowledge en read-only (K mergé en premier) ; pas de Wikipedia/Wikidata complet, pas de gros dump offline ; source + confidence obligatoires ; local-first ; no hallucination. Dexie additif uniquement si indispensable.

Séquencement : **K mergé d'abord** (C/D dépendent de ses types) → puis C, D. Ordre : `chore/integration-sprint-6`(base) → `feat/knowledge-core` → `feat/knowledge-study` → `feat/knowledge-formai`. Gate complet après chaque merge ; push après vert final.

---

# Sprint #7 — Knowledge route / Search / State (Lane E)

main contient déjà Lane K (DB core + loader + 920 seeds `src/data/knowledge/seeds/`). Lane E expose la base : route, navigateur, recherche, reachability — `src/lib/knowledge/**` en **lecture seule**.

| Lane | Branche | Objectif | Propriété |
|---|---|---|---|
| E | `feat/knowledge-route-search` | `/dictionary` (page Knowledge lazy : recherche + parcours + `?slug=`/`?q=`, source+confiance toujours visibles, no-result honnête) ; kind `knowledge` dans Search (lien `/dictionary?slug=…`) ; lien nav LibraryPage ; gate | `src/pages/DictionaryPage.tsx` (NEW), `src/App.tsx` (1 route lazy), `src/pages/SearchPage.tsx`, `src/lib/ecosystem-search.ts`, `src/pages/LibraryPage.tsx` (1 lien), docs, 1 test |

Interdits : `src/lib/knowledge/**` et `src/components/knowledge/KnowledgeEntryCard.tsx` read-only ; dictionnaire notebook existant intact ; Dexie inchangé ; `src/data/knowledge/**` final. Contraintes : import paresseux préservé (seeds jamais eager dans App/modules toujours chargés), source+confiance visibles, no-result honnête, zéro lien mort.

État final : SearchKind **wiré** (import dynamique dans le corps async de `searchEcosystem`, top 5, slug encodé résolvable par DictionaryPage). Gate `tsc` / `vitest` / `build` verts. Branche non mergée, non poussée (intégrateur).

---

# Sprint #8 — Dictionary UI Pro (Lanes U + E)

Objectif : rendre la base Knowledge (920 entrées) réellement **utilisable et pro** avant d'ajouter du volume. Sans Drawing, sans Resources, sans Dexie, sans nouvelles entrées.

| Lane | Objectif | Propriété |
|---|---|---|
| U | `/dictionary` Pro : filtres type/domaine/confiance + Favoris/Récents, tri, pagination mémoire, fiche détaillée enrichie, synonymes/termes liés cliquables (zéro clic mort) | `src/pages/DictionaryPage.tsx`, `src/components/knowledge/**`, `src/lib/dictionary-filters.ts`, `src/stores/dictionaryStore.ts` (localStorage), tests |
| E | Search knowledge **mieux priorisé** (quota garanti sans casser les autres résultats) + docs état | `src/lib/ecosystem-search.ts` (`mergeWithKnowledgeQuota`), `FORMA_STATE.md`, `FORMA_PARALLEL_SPRINTS.md`, test |

Interdits : `src/lib/knowledge/**` lecture seule, Dexie inchangé, `src/data/knowledge/**` final, dictionnaire notebook intact, import seeds toujours lazy. Ordre : **U → E**, gate complet (`tsc`/`vitest`/`build`), Playwright final unique, push après vert final.

Note d'exécution : Lane U relancée après limite de session (travail partiel récupéré) puis finalisée ; Lane E intégrée en ligne (changement contenu, faible risque). Fix notable : carte de liste en `role=button` (plus de `<button>` imbriqué).

---

# Sprint #9 — Dictionary Expansion / Quality Pipeline (Lanes Q + I + E)

Objectif : préparer l'enrichissement massif du dictionnaire **sans salir la base**. Sans Drawing, sans Resources, sans Dexie, sans dump externe, sans refonte UI, scripts dev hors bundle.

| Lane | Objectif | Propriété |
|---|---|---|
| Q | Validation stricte de pack + qualityScore/Status + détection doublons + rapport agrégé | `src/lib/knowledge/{pack-schema,quality,dedup,quality-report}.ts` (+ provenance dans `model.ts`), tests |
| I | Pipeline d'import (validate→dedup→provenance→quality, candidats non promus), CLIs dev, pack test isolé | `src/lib/knowledge/import-pack.ts`, `scripts/knowledge-{quality,import}.ts`, `src/data/knowledge/test-packs/`, `package.json`, tests |
| E | Docs d'état (surface = CLI uniquement, pas d'UI) | `FORMA_STATE.md`, `FORMA_PARALLEL_SPRINTS.md` |

Décisions : surface rapport = **script CLI uniquement** (pas de panneau dev) ; `/dictionary` inchangé ; `provenance` optionnel/additif (dérivé de `sources[].type` si absent) ; jamais de suppression auto d'une entrée weak (marquer/rapporter/classer seulement) ; pack test autorisé car **isolé** (dossier `test-packs/`, non globé par le loader).

Ordre : **Q → I → E**, full gate (`tsc -b`/`vitest`/`build`) à chaque palier, Playwright final unique, push après vert final. Lanes intégrées en ligne (lib + scripts, très testables, faible risque) après les blocages répétés de limite de session sur sous-agents.

---

# Sprint #10 — Content Quality Upgrade (Lanes Q2 + C + U)

Objectif : faire passer un lot réel d'entrées de weak/review → ok, et résoudre les doublons, **sans ajouter de volume sale** et **tout via le pipeline** #9/#10.

| Lane | Objectif | Propriété |
|---|---|---|
| Q2 | Pipeline apply/merge : `applyUpgradePack` (patch par id + qualité avant/après) + `applyDedupPlan` (merge/distinguish explicites), CLI `knowledge:upgrade` (réécrit les seeds) | `src/lib/knowledge/{upgrade,dedup-resolve}.ts`, `scripts/knowledge-upgrade.ts`, tests |
| C | Plan de résolution des 28 exacts + 1 quasi (1 merge + 13 distinguish ; quasi `valeur R/U` = FP documenté) | `src/data/knowledge/upgrades/dedup-plan.json` |
| U | Upgrade pack de 81 entrées prioritaires enrichies (matériaux/structure/architecture) | `src/data/knowledge/upgrades/upgrade-pack-01.json` (+ seeds réécrits) |

Règles respectées : Q2 fige le contrat avant C/U ; C ne supprime rien automatiquement (merge = décision explicite tracée) ; chaque entrée U a shortDefinition/longDefinition/examples/synonyms/relatedTerms/tags/sources/confidence ; source obligatoire ; confidence ajustée honnêtement (à-vérifier pour le normatif) ; qualityScore avant/après obligatoire.

Résultat : **ok 0 → 79**, doublons slug 28 → 0, base 920 → 919. `/dictionary` + Search intacts, Dexie inchangé, seeds lazy/code-split, full gate vert à chaque palier. Lanes intégrées en ligne (data + lib + scripts).

---

# Sprint #11 — FormAI Local Knowledge Bridge (Lanes B + E)

Objectif : faire consulter la base Knowledge locale par FormAI en mode local **avant** le message « je ne sais pas ». Sans Local AI Provider, sans Drawing/Resources, sans Dexie, sans réseau, sans refonte UI.

| Lane | Objectif | Propriété |
|---|---|---|
| B | Pont Knowledge dans le provider local : réponse ancrée (déf + source + confidence + lien `/dictionary?slug=`), avertissement « à-vérifier », no-result honnête, import dynamique | `src/services/ai/knowledge-bridge.ts`, `src/services/ai/providers/local.ts`, tests |
| E | Docs d'état + non-régression FormAI/`/dictionary`/Search | `FORMA_STATE.md`, `FORMA_PARALLEL_SPRINTS.md` |

Règles respectées : Knowledge branché avant le fallback ; réutilise `searchKnowledgeBase`/`lookupBySlug`/`extractKeywords` ; jamais d'invention (null → no-result honnête) ; jamais de prétention IA cloud ; fallback fournisseur cloud conservé si configuré ; message « mode local » mis à jour (mentionne la base Knowledge). Import dynamique → bundle principal inchangé.

Résultat : 7 tests bridge verts contre la base réelle, `localProvider` répond « poutre » avec source/confiance/lien, no-result honnête sur requête inconnue. Lanes intégrées en ligne.

---

# Sprint #14 — Content Upgrade Pack #2 (Lanes U2 + E)

Objectif : faire passer ok 79 → 200+ via le pipeline #10, sans volume sale, sans refonte UI.

| Lane | Objectif | Propriété |
|---|---|---|
| U2 | `upgrade-pack-02.json` : ~144 entrées existantes enrichies (matériaux/systèmes/architecture/intérieur/histoire), ciblées par le rapport qualité | `src/data/knowledge/upgrades/upgrade-pack-02.json` (+ seeds réécrits) |
| E | Pipeline multi-packs, apply, état/docs, QA | `scripts/knowledge-upgrade.ts` (applique tous les `upgrade-pack-*.json`), `FORMA_STATE.md`, `FORMA_PARALLEL_SPRINTS.md` |

Résultat : **ok 79 → 221** (cible dépassée), weak 729 → 585, doublons exacts = 0, base 919. Chaque entrée : short/longDefinition réelle, examples, synonyms, relatedTerms, tags, source, confidence honnête (à-vérifier pour le normatif). `/dictionary`/Search/bridge intacts, Dexie inchangé, seeds lazy/code-split. Full gate vert ; lanes en ligne.

---

# Sprint #15 — Content Upgrade Pack #3 (Lanes U3 + E)

Objectif : ok 221 → 350+ via le pipeline, sans volume sale, sans refonte UI.

| Lane | Objectif | Propriété |
|---|---|---|
| U3 | `upgrade-pack-03.json` : ~140 entrées existantes enrichies (vocabulaire général d'étude/méthode/UX + concepts archi/constr/intérieur/histoire restants) | `src/data/knowledge/upgrades/upgrade-pack-03.json` (+ seeds réécrits) |
| E | Apply (pipeline multi-packs), état/docs, QA | `FORMA_STATE.md`, `FORMA_PARALLEL_SPRINTS.md` |

Résultat : **ok 221 → 372** (cible dépassée), weak 585 → 434, doublons exacts = 0, base 919. `/dictionary`/Search/bridge intacts, Dexie inchangé, seeds lazy/code-split. Full gate vert ; lanes en ligne.

---

# Sprint #16 — Content Upgrade Pack #4 (Lanes U4 + E)

Objectif : ok 372 → 500+ en ciblant le vivier encore définissable, via le pipeline.

| Lane | Objectif | Propriété |
|---|---|---|
| U4 | `upgrade-pack-04.json` : ~134 entrées existantes enrichies (vocabulaire général/UX, intérieur, histoire/urbanisme, reliquats archi/constr/matériaux) | `src/data/knowledge/upgrades/upgrade-pack-04.json` (+ seeds réécrits) |
| E | Apply (pipeline multi-packs), état/docs, QA | `FORMA_STATE.md`, `FORMA_PARALLEL_SPRINTS.md` |

Résultat : **ok 372 → 505** (cible atteinte), weak 434 → 298, doublons exacts = 0, base 919. Évacuation/normatif gardés à-vérifier honnêtement. `/dictionary`/Search/bridge/grounding intacts. Full gate vert ; lanes en ligne. Note : fin du cycle content à fort rendement ; pivot conseillé ensuite (streaming / QA modèle réel).

---

# Sprint #12 — Local AI Provider LM Studio / Ollama (Lanes P + G + E)

Objectif : un vrai provider IA **local** OpenAI-compatible, sans cloud ni clé obligatoire, avec **grounding Knowledge**. Sans SDK lourd (fetch only), strictement opt-in, sans appel réseau si non configuré.

| Lane | Objectif | Propriété |
|---|---|---|
| P | Provider `localmodel` (fetch OpenAI-compatible, baseUrl/model/timeout, clé optionnelle, test connexion, fallback auto vers #11) | `providers/localmodel.ts`, `providers/index.ts`, `types.ts`, `stores/aiStore.ts`, tests |
| G | Grounding Knowledge dans le prompt système des providers génératifs (fiche + anti-hallucination + source/confidence + lien) | `knowledge-grounding.ts`, `knowledge-bridge.ts` (findRelevantEntry), `chat.ts`, tests |
| E | UI Réglages minimale (localmodel : baseUrl, model, timeout, test, état) + badge local FormAI + docs | `AISettingsSection.tsx`, `FormAIPage.tsx`, `FORMA_STATE.md`, `FORMA_PARALLEL_SPRINTS.md` |

Règles respectées : compatible LM Studio (1234/v1) + Ollama (11434/v1) ; clé optionnelle ; gestion réseau/CORS/timeout ; **jamais bloquant** (fallback #11) ; pas de streaming ; grounding obligatoire pour le génératif, no-result honnête conservé ; import Knowledge dynamique (bundle inchangé).

Ordre : **P → G → E**, full gate vert (tsc -b / vitest 1442 / build), Playwright final unique. Tests : provider non configuré/serveur indisponible → fallback #11 ; réponse mockée → fromLocalModel ; grounding injecte source/confidence/lien ; settings sauvegardés. Lanes intégrées en ligne.

---

# Sprint #13 — Local Model Real-World Setup (Lanes D + S + E)

Objectif : rendre `localmodel` réellement branchable par un utilisateur (LM Studio/Ollama). Sans streaming, sans dépendance lourde, aucun appel réseau hors action explicite.

| Lane | Objectif | Propriété |
|---|---|---|
| D | Diagnostic classé (ok/no-models/model-missing/endpoint-invalid/unreachable-or-cors/timeout/invalid-response/http-error), messages actionnables, prudent sur CORS | `providers/localmodel.ts`, tests |
| S | Presets LM Studio/Ollama, sélection modèle depuis `/models`, états, guide intégré + modèles conseillés | `components/settings/AISettingsSection.tsx` |
| E | Docs setup + état + QA + Playwright | `FORMA_STATE.md`, `FORMA_PARALLEL_SPRINTS.md` |

Règles respectées : ne jamais affirmer une cause masquée par le navigateur ; fallback #11 + grounding intacts ; opt-in (pas d'activation auto) ; pas d'appel réseau automatique ; pas de dépendance lourde. Ordre **D → S → E**, full gate (tsc -b / vitest 1450 / build), Playwright final unique. Lanes en ligne.

---

# Sprint #17 — Streaming Local Model (Agents S + U + Q)

Objectif : streaming SSE pour `localmodel`, avec fallback non-stream + fallback Knowledge #11. `fetch` natif, parser SSE léger, pas de SDK.

| Agent | Objectif | Propriété |
|---|---|---|
| S | `streamLocalModelChat` : SSE OpenAI-compatible, deltas/[DONE], AbortController+timeout, abort→partiel interrompu, erreurs→fallback non-stream→#11 | `providers/localmodel.ts`, `types.ts`, `localmodel-stream.test.ts` |
| U | `sendFormAIMessageStream` (stream localmodel, one-shot autres) + UI affichage progressif + bouton Stop | `chat.ts`, `chat-stream.test.ts`, `FormAIPage.tsx`, `ChatView.tsx` |
| Q | QA runtime (stream/abort/fallback) + non-régression /dictionary/Search/FormAI + docs + Playwright | `FORMA_STATE.md`, `FORMA_PARALLEL_SPRINTS.md` |

Résultat : streaming progressif + Stop opérationnels ; `fromLocalModel` seulement si le modèle répond ; `fromCloud:false` pour le local ; abort finalise le partiel sans effacer la conversation ; serveur absent → fallback grounded silencieux. +13 tests, vitest 1463, build OK, bundle inchangé (0 SDK). Ordre **S → U → Q**, gate à chaque palier, Playwright final unique. Agents intégrés en ligne (limite session sous-agents).

---

# Sprint spécial — Resource Pack PDF Integration (Part 10, Agents I + D + R + Q)

Intégrer `FORMA_RESOURCE_PACK_FROM_PDFS_PART_10` (données PDF gouvernées par gates clean/review/quarantine) sans casser l'existant ni embarquer 64 MB de JSON dans le bundle.

| Agent | Objectif | Propriété |
|---|---|---|
| I | Dexie v17 (4 tables) + import lazy/idempotent/journalisé + validateurs + gates ; données sous `public/` | `db/index.ts`, `services/knowledge-pack/{types,validate,import}.ts`, fixtures, tests |
| D | onglet `/dictionary?source=pack` (badges/source-page/filtres/quarantine caché) + Search `docpack` | `services/knowledge-pack/query.ts`, `components/knowledge/KnowledgePackBrowser.tsx`, `pages/DictionaryPage.tsx`, `lib/ecosystem-search.ts`, `pages/SearchPage.tsx` |
| R | RAG FormAI (clean-first, review→warning, quarantine jamais, citations doc+page) branché au provider local | `services/knowledge-pack/rag.ts`, `services/ai/providers/local.ts` |
| Q | QA navigateur (import réel 64 MB→Dexie, gates, RAG, non-régression) + docs + Playwright | `FORMA_STATE.md`, `FORMA_PARALLEL_SPRINTS.md` |

Ordre **I → D → R → Q**, gate (tsc/vitest/build) à chaque palier, Playwright final unique. Résultat : import réel vérifié (9738 entrées / 18751 chunks / 2500 mots-clés, réimport skip), quarantine jamais exposé, FormAI cite source+page avec avertissement normatif, `/dictionary` Base Forma + Search seeds + Dexie **intacts**, **0 octet de pack dans le bundle**. +44 tests, vitest 1494, build OK. Agents intégrés en ligne.

---

# Sprint #21 — Pack Source Navigation (Lanes N + E)

Objectif : rendre les chips sources Pack PDF cliquables (→ `/dictionary` Documents pré-filtré) sans créer de dead link.

| Lane | Objectif | Propriété |
|---|---|---|
| N | Chip pack → lien `/dictionary?source=pack&document=&page=` si document connu, sinon non-cliquable ; `/dictionary` lit document/page et pré-filtre + highlight page | `source-link.ts`, `ChatView.tsx`, `KnowledgePackBrowser.tsx`, `DictionaryPage.tsx` |
| E (Q) | Tests (`source-link.test.ts`) + e2e (clic chip pack → Documents filtré) + docs/playbook QA réelle | `source-link.test.ts`, `tests/e2e/formai-citations.spec.ts`, `FORMA_STATE.md`, `FORMA_PARALLEL_SPRINTS.md` |

Règle anti-dead-link centralisée (`sourceChipHref`) : seed+slug → fiche ; pack+document → Documents pré-filtré ; sinon `null` (non-cliquable). Quarantine jamais ciblable (jamais dans les sources). Aucune réécriture moteur, pas de Dexie/route, pack hors bundle. Ordre **N → E**, gate + Playwright final. vitest 1522, build OK.
