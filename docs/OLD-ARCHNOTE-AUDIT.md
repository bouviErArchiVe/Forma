# Audit legacy ArchNote / ArchPlot → Forma `formacursor`

**Date** : 2026-05-29  
**Branche cible** : `merge-legacy-archnote`  
**Nouveau Forma** : v0.26.2 (`formacursor`)  
**Ancien projet** : `_legacy/ArchNote_project/` (extrait de `ArchNote_project.zip`, npm `forma` v1.0.0)  
**Règle** : le nouveau Forma reste la base technique ; l’ancien sert de catalogue fonctionnel et de référence visuelle.

---

## 1. Modules trouvés (inventaire complet)

### 1.1 Racine technique legacy

| Élément | Chemin legacy | Notes |
|---------|---------------|-------|
| Entrée app | `src/App.jsx` | Router minimal (`/`, `/auth` ; modules redirigés vers `/`) |
| Layout | `src/components/AppLayout.jsx` | Vues `library` / `editor` / `moodboard` via Zustand |
| Shell global | `src/components/FormaAppShell.jsx` | Sidebar 260px, modules, outils |
| Store maître | `src/stores/useAppStore.js` | Zustand persist — thème, bibliothèque, notebooks, Spotify, easter eggs |
| Stack | React 18.3, Vite 5, Zustand, Supabase, Tesseract, jsPDF, docx, PWA | ~324 fichiers `src/` |

### 1.2 Modules métier (branding officiel — `src/config/branding.js`)

| Module | Route | Page legacy | Statut routing |
|--------|-------|-------------|----------------|
| **Carnets / éditeur** | `/editor/*` → redirect | `EditorPage.jsx` (~4547 lignes) | Actif via `activeView=editor` |
| **FormaLibrary** | `/formalibrary` | `FormaLibraryPage.jsx` | Orphelin (route non enregistrée) |
| **FormaFolder** | `/formafolder` | `FormaFolderPage.jsx` | Partiellement via `LibraryPage` onglet dossiers |
| **FMoodboard** | `/fmoodboard` | `MoodboardPage.jsx` | Actif via `activeView=moodboard` |
| **FormaDoc** | `/formadoc` | `DocsPage.jsx` | Orphelin |
| **FormaTab** | `/formatab` | `SheetsPage.jsx` | Orphelin |
| **FormatCal** | `/formatcal` | `FormatcalPage.jsx` | Orphelin |
| **FormaCombine** | `/formacombine` | `FormaCombinePage.jsx` | Orphelin |
| **FormaReview** | `/formareview` | `FormaReviewPage.jsx` | Orphelin |
| **FormaPresent** | `/formapresent` | `FormaPresentPage.jsx` | Orphelin |
| **FormaAI** | `/formaai` | `FormaAIPage.jsx` + `FormaAILayer` global | Layer monté ; page orpheline |
| **FormaDico** | `/formadico` | `FormaDicoPage.jsx` | Orphelin |
| **FormaMessage** | `/formamessage` | `FormaMessagePage.jsx` | Orphelin |
| **FormaHub** | `/formahub` | `FormaHubPage.jsx` | Orphelin |
| **Formules** | `/formules` | `FormulasPage.jsx` | Orphelin |
| **FPause (jeux)** | `/fpause` | `GamesPage.jsx` | Orphelin |
| **FTheme** | — | intégré `LibraryPage` + `ThemeProvider` | Pas de route dédiée |
| **Traduction / OCR** | `/translate` (réf.) | `TranslateScanPage.jsx` | Orphelin |
| **Compte / auth** | `/auth`, `/account/*` | `AuthPage.jsx`, `AccountPage.jsx` | Auth seule route extra |
| **Collaboration** | — | `lib/collaboration.js`, `ShareModal.jsx` | Supabase |
| **Sync / FormaCloud** | — | `lib/sync/*`, `lib/formacloud/*` | Local-first + queue cloud |

### 1.3 Sous-systèmes transverses

| Catégorie | Fichiers clés legacy |
|-----------|---------------------|
| **Thèmes / apparence** | `theme/tokens.js`, `theme/glass.js`, `theme/globalStyles.js`, `theme/ThemeProvider.jsx`, `lib/themes.js` (20 thèmes), `lib/appearance.js`, `lib/visualProfiles.js`, `lib/backgrounds.js` |
| **UI glass** | `components/ui/GlassButton.jsx`, `GlassPanel.jsx`, `ModalOverlay.jsx`, `BottomSheet.jsx` |
| **Identité** | `components/BrandLogo.jsx`, `components/AppBackground.jsx`, `config/branding.js` |
| **Outils intégrés** | `CalculatorDrawer.jsx`, `UnitConverter.jsx`, `translation/*`, `formadico/*`, `FocusPanel.jsx`, `SpotifyLibraryPanel.jsx` |
| **Easter eggs** | `hooks/useEasterEggTrigger.js`, `components/easter-eggs/EmojiBurst.jsx` |
| **Jeux** | `games/*`, `data/games.js`, `components/games/GameShell.jsx` |
| **Éditeur avancé** | `lib/layers.js`, `components/HistoryPanel.jsx`, `components/RulerSvg.jsx`, `components/CanvasMinimap.jsx` (non branché), `FloatingToolsToolbar.jsx`, `FloatingSelectionToolbar.jsx`, `EditorTopBar/BottomToolbar` (non importés) |
| **Bibliothèque** | `pages/LibraryPage.jsx` (~2090 lignes), `lib/libraryViews.js`, `lib/folders/*`, matières `DEFAULT_SUBJECTS` |

---

## 2. Fonctionnalités par module (détail)

### Bibliothèque / dashboard (`LibraryPage.jsx`, `formaShell.js`)

- Sidebar : Carnets, Favoris, FormaFolder, Tableau (dashboard), Matières
- Vues : grille, liste, timeline (groupement mensuel)
- Tri : dernière modif., création, nom, matière, taille
- Dossiers : hiérarchie `parentId`, emojis, couleurs, profondeur max, sync dossiers
- Matières : 20 prédéfinies + custom (emoji + couleur)
- Cartes carnets : couvertures, motifs, favoris, récents, recherche, sélection batch
- Templates page : 14 modèles (Cornell, grilles, plan, élévation, mindmap…)
- Theme picker : 20 thèmes + photo custom + modes apparence + animations ambiance
- Outils rapides : calculatrice, convertisseur, traduction, focus, Spotify, jeux
- Menu contextuel dossiers (iOS-like), long-press

### Éditeur (`EditorPage.jsx`)

- Dessin : stylo, surligneur, formes, lasso, gomme, texte, images, éléments structurels, ruban
- Règle draggable + rapporteur + équerre inline
- Calques : créer, ordre, visibilité, opacité, verrou, renommer
- Historique actions + snapshots page (`HistoryPanel`, `actionHistory.js`)
- Focus / pomodoro (`FocusToolbar`, inline timer)
- Convertisseur unités embarqué
- Collab : `useNotebookCollab`, partage Supabase
- Dictée, export PDF hook
- **Non branché** : mini-map (`CanvasMinimap.jsx`), top/bottom toolbar extraits, `EditorSidebar.jsx`

### FMoodboard (`MoodboardPage.jsx`, `useMoodboardStore.js`)

- Import image fichier + URL
- Grille + canvas libre, masonry
- Tags, favoris, renommage, suppression, plein écran
- Export PNG/PDF, lien partage (réf.)

### FormaDoc (`DocsPage.jsx`, `lib/docs/*`)

- CRUD documents, templates
- Éditeur riche, preview, sketch pad
- Export TXT, MD, DOCX, PNG, PDF
- Insertion dans carnet, publication FormaHub

### FormaTab (`SheetsPage.jsx`, `lib/spreadsheet/*`)

- Grille, cellules, formules, aide formules
- Export CSV, JSON, PNG, PDF
- Insertion dans page carnet

### FormatCal (`FormatcalPage.jsx`, `lib/formatcal/*`)

- Vues mois/semaine/jour/agenda/timeline/liste
- Événements, rappels, export ICS/PDF

### FormaCombine / FormaReview / FormaPresent / FormaLibrary

- Combine : assemblage multi-sources (doc, tab, carnet, moodboard)
- Review : canvas commentaires, threads, pins, import
- Present : slides, mode présentation, laser, notes, templates
- Library : explorateur assets unifié, recherche, classification

### FormaAI (`FormaAILayer`, `lib/formaai/*`)

- FAB flottant, panneau chat, recherche globale cross-modules
- Indexer + normalize + highlight
- Provider abstrait (pas d’API forcée dans audit)

### FormaDico / Traduction / OCR

- Dico : Wiktionary/API, cache, menu contextuel, widget, lookup sélection
- Traduction : widget EN↔FR, scan document, OCR Tesseract, PDF jusqu’à 12 pages

### Formules / calculatrice / convertisseur

- `data/formulas.js` (~1000 lignes) + 13 modules calcul (escaliers, pentes, surfaces, toiture, accessibilité…)
- `CalculatorDrawer`, `archCalculator.js`
- `UnitConverter`, échelles dessin (mm/cm/m/ft + presets)

### Collaboration / sync / cloud

- Supabase : profils, amis, partages, permissions read/comment/edit/owner, notifications
- Sync engine : IDB vault, journal, versions, offline queue, cloud queue
- FormaCloud : Google Drive (+ stubs iCloud/OneDrive/Dropbox)
- UI : badge sync, recovery modal, historique versions

### Thèmes / profils visuels

- **20 thèmes** nommés (Horizon → Harmonie) avec polices Google, couleurs chaudes, animations (`fireflies`, `drops`, `geometry`, `leaves`, `waves`, `pulses`, `sparkles`)
- Modes apparence : light, soft-gray, dark, black (`lib/appearance.js`)
- Profils visuels sauvegardables, duplication, fond custom photo, `AppBackground` watermark SVG

### Easter eggs / Focus / Jeux

- Mots déclencheurs (`caca`, `chat`) → `EmojiBurst`
- FocusPanel pomodoro + alarmes custom + Spotify iframe
- 5 jeux : Dino, Snake, Pong, BallBounce, Breakout + scores

---

## 3. Ce qui existe déjà dans le nouveau Forma (v0.26.2)

| Domaine | Existe | Fichiers principaux |
|---------|--------|---------------------|
| Bibliothèque | ✅ Fort | `LibraryPage.tsx`, `DocumentCard.tsx`, `libraryStore.ts`, `services/library.ts` |
| Dossiers | ✅ | CRUD nested, breadcrumb, `MoveFolderModal.tsx` |
| Favoris | ✅ | Filtre onglet + `toggleFavorite` |
| Recherche | ✅ | Noms + full-text (`search-index.ts`, `CommandPalette.tsx`) |
| Vues | ✅ Grille/liste | Pas timeline |
| Tri | ✅ | name / modified / created × asc/desc |
| Type filter | ✅ | notebook / pdf / whiteboard |
| Bulk export | ✅ | PDF, MD, `.forma` |
| Corbeille | ✅ | `TrashPage.tsx`, soft delete |
| Éditeur canvas | ✅ Fort | `PageCanvas.tsx`, hooks pointer/history/scheduler, dirty rects phase 2 |
| Outils dessin | ✅ | pen, pencil, highlighter, eraser, lasso, shapes, text, image, stickers, tape, laser |
| Pan/zoom | ✅ | CSS zoom, pan, pinch, wheel, continuous view + pool |
| Panneaux | ✅ | Search, OCR, AI local, Study/SM-2, Audio, Share, History, Outline |
| Présentation | ✅ | Mode présentation + laser |
| Focus mode | ✅ | `EditorPage.tsx` (basique) |
| Autosave | ✅ | 2s debounce, flush, recovery |
| Verrou multi-onglets | ✅ | `document-lock.ts`, E2E |
| Export/import | ✅ | `.forma` v1/v2, PDF raster/vector, SVG, PNG, MD, JSON, print |
| PWA | ✅ | `sw.js` v9, offline, update flow |
| Storage | ✅ | Dexie v7, assets blobs, migrations testées |
| Sync | 🟡 | Queue locale + slot 5 MB ; pas Supabase |
| Thèmes UI | 🟡 | Tailwind tokens, light/dark/system, paper tone — **pas** 20 thèmes FTheme |
| Moodboard | ❌ | — |
| FormaDoc/Tab/Cal | ❌ | — |
| Formules/calc | ❌ | — |
| Dico/traduction page | ❌ | OCR panel seulement |
| Hub/message/compte | ❌ | Share links read-only seulement |
| Easter eggs | ❌ | — |
| Spotify/focus panel | ❌ | — |
| Jeux FPause | ❌ | — |
| Mini-map / calques UI | ❌ | 3 calques canvas ; pas panneau calques |
| Règle | 🟡 | `ruler-overlay.ts` optionnel setting |
| Matières prédéfinies | ❌ | — |
| Dashboard stats | ❌ | — |
| Profils visuels | ❌ | — |

---

## 4. Ce qui manque dans le nouveau Forma

### Priorité visuelle (Pack 1)

- 20 thèmes FTheme + animations ambiance
- Glass UI (panels, boutons, modals translucides)
- `FormaAppShell` sidebar modules
- Cartes bibliothèque « vivantes » (couvertures, motifs)
- Profils visuels + fonds custom
- Transitions page (`PageTransition` legacy)
- BrandLogo / identité ArchNote chaleureuse

### Bibliothèque (Pack 2)

- Onglets sidebar : Tableau, Matières
- Vue timeline
- Tri par matière / taille
- Dossiers emoji/colorés avancés (FormaFolder module)
- Menus contextuels iOS-like
- Dashboard activité
- Matières prédéfinies architecture

### Outils (Pack 3)

- Calculatrice architecturale drawer
- Convertisseur unités + échelles
- Widget traduction EN↔FR
- FormaDico contextuel
- Catalogue formules (100+)
- FocusPanel + Spotify (secondaire)

### Moodboard (Pack 4)

- Module complet FMoodboard

### Modules documentaires (Pack 5)

- FormaDoc, FormaTab, FormatCal, FormaPresent, FormaReview, FormaCombine

### Futur (Pack 6 — docs d’abord)

- FormaAI cloud, sync Supabase, collaboration, Hub, Message, compte

### Éditeur — gaps ciblés

- Mini-map canvas
- Panneau calques (visibilité/opacité/verrou)
- Historique actions UI enrichi (vs snapshots actuels)
- Bottom toolbar type GoodNotes
- Toolbar/panneaux flottants déplaçables
- Formats page étendus (14 templates legacy)
- Bibliothèque éléments structurels

---

## 5. Ce qui est meilleur dans l’ancien

| Aspect | Pourquoi |
|--------|----------|
| **Identité visuelle** | 20 thèmes, glass, animations, profils — ambiance « architecte » |
| **Bibliothèque UX** | Sidebar riche, timeline, matières, dashboard, cartes expressives |
| **Écosystème modules** | Doc, tab, calendrier, moodboard, formules — workflow complet |
| **Outils contextuels** | Calc, convertisseur, dico, traduction sans quitter l’éditeur |
| **Thèmes / personnalisation** | Profils visuels, fonds photo, polices par thème |
| **Formules métier** | Catalogue architecture intégré (Blondel, pentes, surfaces…) |
| **Social / collab (vision)** | Hub, messages, review — même si immature techniquement |

---

## 6. Ce qui est meilleur dans le nouveau

| Aspect | Pourquoi |
|--------|----------|
| **Moteur canvas** | Hooks extraits, dirty rects, bench, pointer propre — maintenable |
| **Données** | Dexie v7 typé, assets blobs, migrations testées — pas localStorage monolithique |
| **`.forma` v1/v2** | Export/import robuste, thumbnails, roundtrip E2E |
| **Autosave / fiabilité** | Debounce, journal, recovery, verrou multi-onglets |
| **Tests / CI** | 125 Vitest + 20 E2E + bench advisory |
| **PDF** | Import lazy, cache viewport, export vectoriel |
| **Performance** | Vue continue virtualisée, thumb queue, stroke finalize 5k/10k |
| **TypeScript** | Typage, refactor sûr |
| **PWA production** | SW v9, offline réel, pas de dépendance Supabase obligatoire |
| **Scope maîtrisé** | Pas de routing cassé, pas de monolithe 4500 lignes non testé |

---

## 7. Ce qu’il faut intégrer (recommandé)

| Pack | Contenu | Priorité |
|------|---------|----------|
| **1 Visuel** | tokens glass, 20 thèmes adaptés Tailwind, GlassButton/Panel, shell sidebar, cartes, modals, toasts, transitions, profils visuels | **P0** |
| **2 Bibliothèque** | onglets, timeline, matières, dashboard, menus contextuels, tri avancé | **P1** |
| **3 Outils** | calc, convertisseur, formules, dico widget, traduction widget | **P1–P2** |
| **4 Moodboard** | module Dexie + routes | **P2** |
| **5 Documentaires** | FormaDoc puis FormaTab, Present, Review — un module à la fois | **P3** |
| **6 Futur** | enrichir docs sync/IA/collab depuis code legacy | **P3 docs** |
| **Éditeur ciblé** | mini-map, panneau calques, templates page, toolbar flottante | **P2** (sans toucher moteur) |
| **Easter eggs** | EmojiBurst opt-in | **P3 fun** |

---

## 8. Ce qu’il faut réécrire (pas copier-coller)

| Élément legacy | Raison | Approche nouveau Forma |
|----------------|--------|------------------------|
| `useAppStore.js` monolithique | 100+ champs persistés localStorage | Étendre `settingsStore` + stores par module |
| `EditorPage.jsx` 4547 lignes | Inline canvas + panels | Étendre `PageCanvas` + composants editor existants |
| `lib/storage.js` notebooks | localStorage pages par carnet | Dexie `pages` table (déjà en place) |
| Sync engine Supabase | Couplé, non testé E2E | Implémenter selon `SYNC-DESIGN.md` |
| Routes modules orphelines | `App.jsx` ne les enregistre pas | Router React propre par module dans `App.tsx` |
| Thèmes inline CSS inject | `globalStyles.js` 672 lignes | Tokens Tailwind v4 + CSS vars `--forma-*` |
| Collaboration realtime | Supabase direct | Phase post-sync, feature flags |
| FormaAI provider | Ancienne abstraction | Panneau opt-in selon `AI-PRIVACY.md` |
| Spreadsheet engine | JS maison | Réimplémenter minimal ou lib légère + Dexie |
| Moodboard store | Zustand seul | Table Dexie `moodboards` + assets |

---

## 9. Ce qu’il faut abandonner ou différer

| Élément | Décision |
|---------|----------|
| Routing legacy cassé (redirect `*`) | Ne pas reproduire — routes explicites |
| Stockage pages en localStorage | Abandonné — Dexie only |
| dataURL blobs partout | Abandonné — table `assets` |
| Supabase obligatoire au démarrage | Différé — offline-first |
| FormaHub / FormaMessage production | Différé — social long terme |
| Jeux FPause en core | Optionnel / caché — pas prioritaire |
| Spotify iframe (CGU/embed) | Secondaire — feature flag |
| Proforma éléments canvas | Déjà retiré legacy — images seulement |
| Copie git worktree dans zip | Ne pas versionner `_legacy/` (gitignore) |
| 10 layers canvas spec | Garder 3 calques + dirty rects ; WebGL futur (`RENDERER.md`) |

---

## 10. Risques techniques

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Régression canvas | Critique | Ne pas remplacer `PageCanvas` ; E2E stroke + bench CI |
| Régression `.forma` | Critique | Tests roundtrip v1/v2 avant chaque pack |
| Bundle size (20 thèmes + fonts) | Moyen | Lazy load thèmes, subset fonts, pas de PNG `/themes/` en prod sans assets |
| Conflit design Tailwind ↔ glass inline | Moyen | Pack 1 : couche tokens unifiée dans `index.css` |
| Double source vérité (Zustand + Dexie) | Élevé | Module = table Dexie ; UI state éphémère seulement |
| Migration matières / dossiers emoji | Faible | Migration Dexie v8+ additive |
| Supabase/sync prématuré | Élevé | Docs only jusqu’à gate explicite |
| Monolithe LibraryPage legacy | Moyen | Incrémenter `LibraryPage.tsx` par onglets, pas rewrite 2000 lignes |
| Composants legacy non branchés | Faible | Vérifier usage réel avant port (minimap, topbar…) |
| Tests E2E flaky parallèles | Connu | workers=1 Playwright (déjà corrigé 0.26.2) |

---

## 11. Fichiers concernés (cartographie)

### Legacy — référence visuelle (Pack 1)

```
_legacy/ArchNote_project/src/theme/tokens.js
_legacy/ArchNote_project/src/theme/glass.js
_legacy/ArchNote_project/src/theme/globalStyles.js
_legacy/ArchNote_project/src/theme/ThemeProvider.jsx
_legacy/ArchNote_project/src/lib/themes.js
_legacy/ArchNote_project/src/lib/appearance.js
_legacy/ArchNote_project/src/lib/visualProfiles.js
_legacy/ArchNote_project/src/lib/backgrounds.js
_legacy/ArchNote_project/src/components/ui/GlassButton.jsx
_legacy/ArchNote_project/src/components/ui/GlassPanel.jsx
_legacy/ArchNote_project/src/components/ui/ModalOverlay.jsx
_legacy/ArchNote_project/src/components/FormaAppShell.jsx
_legacy/ArchNote_project/src/components/BrandLogo.jsx
_legacy/ArchNote_project/src/components/AppBackground.jsx
_legacy/ArchNote_project/src/lib/formaShell.js
```

### Nouveau Forma — cibles Pack 1

```
src/index.css                    (@theme tokens — extension)
src/stores/settingsStore.ts      (themeId, appearance, visualProfile)
src/pages/LibraryPage.tsx        (shell, cartes)
src/pages/EditorPage.tsx         (shell éditeur — prudence)
src/components/ConfirmDialog.tsx (modal glass)
src/components/Toast.tsx         (variants — déjà partiel 0.26.2)
src/App.tsx                      (layout shell)
docs/ARCHITECTURE.md             (design system)
```

### Nouveau Forma — cibles Pack 2 bibliothèque

```
src/pages/LibraryPage.tsx
src/stores/libraryStore.ts
src/services/library.ts
src/components/library/DocumentCard.tsx
src/types/index.ts               (Subject, Notebook.coverPattern?)
src/db/index.ts                  (migration matières si needed)
```

### Nouveau Forma — cibles Pack 3 outils

```
src/components/tools/            (nouveau dossier)
src/pages/SettingsPage.tsx
src/pages/EditorPage.tsx         (drawers — coordination Agent 0)
src/lib/formulas/                (port progressif data/formulas.js)
```

### Nouveau Forma — cibles Pack 4 moodboard

```
src/pages/MoodboardPage.tsx      (nouveau)
src/stores/moodboardStore.ts
src/db/index.ts                  (table moodboards)
src/App.tsx                      (route /moodboard)
```

### Docs Pack 6

```
docs/SYNC-DESIGN.md              (+ legacy sync engine, FormaCloud, collab.js)
docs/AI-PRIVACY.md               (+ FormaAI layer, indexer)
docs/OLD-ARCHNOTE-AUDIT.md       (ce document)
docs/COLLAB-DESIGN.md            (à créer — FormaReview, ShareModal, permissions)
```

### Fichiers **interdits** de remplacement lourd (sans E2E complet)

```
src/canvas/PageCanvas.tsx
src/canvas/hooks/usePageCanvasPointer.ts
src/lib/forma-package.ts
src/db/index.ts                  (pas migration destructive)
src/services/autosave.ts
public/sw.js
```

---

## 12. Ordre d’intégration recommandé

### Phase 0 — Audit (cette livraison)

- [x] Extraire legacy → `_legacy/ArchNote_project/` (local, gitignored)
- [x] Produire `docs/OLD-ARCHNOTE-AUDIT.md`
- [x] Baseline tests nouveau Forma verts

### Phase 1 — Pack Visuel (0.27.0 cible)

1. Porter tokens + glass → `index.css` / composants UI
2. Thèmes 20 → settings + lazy fonts
3. `AppShell` sidebar (sans casser routes)
4. Cartes bibliothèque glass + couvertures
5. Modals/toasts/transitions
6. Profils visuels (Dexie `settings` ou table dédiée)
7. E2E smoke + screenshot manual

### Phase 2 — Bibliothèque (0.27.x)

1. Onglets sidebar + dashboard
2. Matières (Dexie field + UI)
3. Timeline view
4. Menus contextuels
5. Tri matière/taille

### Phase 3 — Outils (0.28.0)

1. Convertisseur + calculatrice drawer
2. Formules catalogue (subset prioritaire)
3. Dico widget + traduction widget
4. Tests unitaires formules

### Phase 4 — Moodboard (0.28.x)

1. Schéma Dexie + CRUD
2. UI masonry + import URL
3. Export PNG/PDF

### Phase 5 — Modules documentaires (0.29+)

1. FormaDoc MVP
2. FormaTab MVP
3. FormaPresent (lien pages carnet)
4. FormaReview (commentaires locaux)

### Phase 6 — Architecture future

1. `COLLAB-DESIGN.md` depuis `collaboration.js`
2. Enrichir `SYNC-DESIGN.md` (engine, FormaCloud, versions)
3. Enrichir `AI-PRIVACY.md` (FormaAI indexer)
4. Hub/Message — backlog

---

## Annexe A — Comparaison routing

| Legacy | Nouveau Forma |
|--------|---------------|
| `/` + `activeView` | Routes explicites `/`, `/document/:id`, `/settings`, … |
| Modules orphelins | À ajouter : `/moodboard`, `/formadoc`, … progressivement |
| `/auth` Supabase | Absent — local-first |

## Annexe B — Comparaison stockage

| Legacy | Nouveau |
|--------|---------|
| Zustand persist `forma-app-store` | `settingsStore`, `libraryStore`, `editorStore` (partiel persist) |
| `forma_pages_{id}` localStorage | Dexie `pages` |
| IDB vault sync | Dexie + `sync-queue` |
| Blobs `blobStore.js` | Dexie `assets` |

## Annexe C — Dette legacy identifiée

1. **`App.jsx`** : seules 2 routes ; navigation sidebar vers modules morte
2. **`CanvasMinimap.jsx`** : jamais importé
3. **`EditorTopBar/BottomToolbar/Sidebar`** : doublons non utilisés par `EditorPage`
4. **Assets `/themes/*.png`** : référencés mais absents du zip extrait (à regénérer ou SVG)
5. **Zip dupliqué** : `_legacy/ArchNote_project/ArchNote_project/` (nested git) — utiliser racine `_legacy/ArchNote_project/src`

## Annexe D — Baseline QA nouveau Forma (2026-05-29)

```
npm run test     → 125 passed (26 files)
npm run build    → OK
npm run test:e2e → 20 passed (chromium)
npm run bench:ci → advisory warning (110k segments > 12k)
```

---

*Document produit par audit Agent 1 — aucune modification fonctionnelle du code applicatif. Prochaine étape : Pack 1 Visuel sur branche dédiée, commits par pack.*
