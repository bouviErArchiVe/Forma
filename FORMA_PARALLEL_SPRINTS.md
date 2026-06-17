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
