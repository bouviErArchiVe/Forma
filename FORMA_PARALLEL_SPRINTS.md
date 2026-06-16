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
