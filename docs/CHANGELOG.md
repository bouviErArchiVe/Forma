# Changelog Forma

## 0.60.0 — Pack 29 Formules : palette Ctrl+K

### Accès rapide depuis n'importe où
- **Ctrl+K** (ou `/`) : entrées **Formules / normes**, FormaDoc et FormaAI dans la navigation
- Recherche **formules du catalogue** et **calculs conservés** (≥ 2 caractères), avant les pages carnets
- Ouverture directe avec restauration des valeurs pour l'historique (`palette-search.ts`)
- Tests unitaires
- Aucune dépendance ajoutée

## 0.59.0 — Pack 28 Calculatrice : lien Formules et copie

### Pont calculateur → Formules
- **Calculatrice** (tiroir éditeur et moodboard) : lien **📐 Formules** vers le catalogue `/formulas`
- Bouton **Copier** (⎘) sur le résultat scientifique et sur chaque calcul outils architecture
- Toast « Résultat copié » (même comportement que Formules)
- Aucune dépendance ajoutée

## 0.58.0 — Pack 27 FormaAI : lien profond vers Formules

### Navigation depuis la recherche
- Clic sur un résultat **formule du catalogue** : ouvre directement la formule dans `/formulas`
- Clic sur un **calcul conservé** (`formula-history`) : restaure mode et valeurs saisies
- Module `nav.ts` : intent sessionStorage (`forma-formula-restore`) consommé au chargement de Formules
- Icône 🧮 pour les calculs conservés dans les résultats FormaAI
- Tests unitaires de la navigation
- Aucune dépendance ajoutée

## 0.57.0 — Pack 26 FormaAI : index des calculs Formules conservés

### Recherche unifiée
- L'index FormaAI inclut désormais les **calculs conservés** dans l'historique Formules (titre, valeurs, résumé)
- Les résultats apparaissent sous la source « Formules / normes » et renvoient vers `/formulas`
- `history-read.ts` : lecture de l'historique persisté sans initialiser le store Zustand
- Paramètres : texte de la section « Sauvegarde des modules » mentionne Formules (favoris + historique)
- Aucune dépendance ajoutée

## 0.56.0 — Pack 25 Formules : insertion dans FormaDoc

### Pont Formules → FormaDoc
- Bouton **Insérer dans FormaDoc** sur le calculateur : choix du document cible, bloc HTML ajouté à la fin de la dernière page
- Module `to-doc.ts` : `formatCalculationHtml` (échappement HTML, valeurs, tableau de résultats) et `appendCalculationToDocument`
- Modal de sélection des documents FormaDoc ; après insertion, navigation vers FormaDoc avec ouverture automatique du document
- Tests unitaires du formatage et de l'ajout en page
- Aucune dépendance ajoutée

## 0.55.0 — Pack 24 Formules : sauvegarde modules (favoris + historique)

### Portabilité des données Formules
- Les préférences Formules (`forma-formula-prefs` : favoris, récents, unité) et l'historique de calculs (`forma-formula-history`) sont désormais inclus dans l'export/import **.formamods.zip** et les instantanés cloud locaux
- Restauration en mode **replace** : favoris, récents et historique reviennent avec le reste des modules
- Test modules-backup étendu pour verrouiller le round-trip
- Aucune dépendance ajoutée

## 0.54.0 — Pack 23 Formules : export et copie de l'historique

### Partage local des calculs conservés
- Bouton **Copier** (⎘) sur chaque entrée de l'historique : titre, valeurs saisies et résumé du résultat
- Bouton **Exporter (.txt)** : télécharge l'historique complet en fichier texte (`forma-formules-YYYY-MM-DD.txt`)
- Module `history-export.ts` : `formatHistoryEntry`, `formatHistoryReport`, `downloadHistoryReport`
- Tests unitaires du formatage
- Aucune dépendance ajoutée

## 0.53.0 — Pack 22 Formules : recherche globale

### Correctif d'usage
- La recherche était limitée à la catégorie sélectionnée : taper « béton » depuis « Escaliers » ne renvoyait rien
- La recherche balaie désormais **tout le catalogue** dès qu'une requête est saisie, quelle que soit la catégorie active
- Indicateur « X résultats dans toutes les catégories » et puce de catégorie sur chaque carte pour situer le résultat
- Choisir une catégorie dans le menu efface la recherche (navigation et recherche mutuellement exclusives)
- Aucune dépendance ajoutée

## 0.52.0 — Pack 21 Formules : historique de calculs

### Nouveau — conserver et rejouer ses calculs (100 % local)
- Bouton « Conserver le calcul » dans le calculateur : enregistre la formule, le mode, les valeurs saisies et le résultat
- Nouvelle section « Historique » (jusqu'à 40 calculs, persistés localement via `forma-formula-history`)
- Clic sur un calcul conservé → rouvre la formule avec les valeurs pré-remplies (restauration du mode + des champs)
- Suppression d'un calcul à l'unité ou purge complète
- Nettoyage : casts de type devenus inutiles retirés de `FormulasPage` (catalogue désormais typé)
- Aucune dépendance ajoutée

## 0.51.0 — Pack 20 Formules : affichage des « Maths de base »

### Correctif d'affichage
- Les formules de la catégorie « Maths de base » (sin/cos/tan, Pythagore, aires, volumes, conversions deg/rad) renvoyaient un résultat au format `{ ok, label, value }` que le calculateur n'affichait pas : le panneau Résultat restait vide et la copie était impossible
- `compute/basic.ts` produit désormais le format standard `rows` + `summary` (valeur formatée avec unité, ligne « Détail » quand pertinent) comme tous les autres modules — affichage et bouton « Copier le résultat » fonctionnels
- Test unitaire `basic.test.ts` verrouillant le format de sortie
- Aucune dépendance ajoutée

## 0.50.0 — Pack 19 Formules : typage strict (fin des @ts-nocheck)

### Qualité du code — module Formules d'architecture
- Les 15 derniers fichiers en `@ts-nocheck` du codebase (catalogue + 12 modules de calcul + `FormulaCard`) sont désormais entièrement typés, sans `any`
- Types partagés `FormulaResult` / `FormulaResultRow` / `FormulaVerdict` / `FormulaValues` ajoutés à `types.ts`, `compute` du `FormulaDef` renvoie un `FormulaResult`
- `units.ts`, `blondel.ts`, `areas/volumes/slopes/scales/stairs/roof/materials/accessibility/light/structures/basic.ts` et `catalog.ts` typés (signatures `FormulaValues → FormulaResult`)
- Aucun `@ts-nocheck` restant dans `src/` ; aucun changement de comportement, aucune dépendance ajoutée

## 0.49.0 — Pack 18 FormaDico : typage strict + gestion du cache

### Qualité du code + cache dans les Paramètres
- `provider.ts` et `parse.ts` étaient en `@ts-nocheck` (non vérifiés) : désormais entièrement typés (interfaces réponses Wiktionary/dictionaryapi.dev, retours `DicoEntry`), sans `any`
- Paramètres › Dictionnaire (FormaDico) : compteur de définitions en cache (dont épinglées) + bouton « Vider le cache (garder les favoris) »
- Test unitaire du parseur Wiktionary (extraction définitions/grammaire)
- Aucune dépendance ajoutée, aucun changement de comportement

## 0.48.0 — Pack 17 FormaDico : préparer les favoris hors-ligne

### Préparation hors-ligne + gestion du cache
- Les favoris ajoutés avant l'épinglage (Pack 16) ou dont l'entrée avait été évincée n'étaient toujours pas disponibles hors-ligne
- Nouveau bouton « Préparer hors-ligne » : récupère et épingle toutes les définitions favorites en une fois (avec progression), favoris déjà prêts ignorés
- `dicoCacheStats()` (total / épinglés) et `clearUnpinnedDicoCache()` (purge le cache en conservant les favoris)
- `isPinned()` exposé ; 100 % local, aucune dépendance ajoutée

## 0.47.0 — Pack 16 FormaDico : favoris hors-ligne

### Favoris épinglés (disponibles sans connexion)
- Le cache du dictionnaire est limité à 120 entrées (éviction LRU) : un favori consulté il y a longtemps pouvait disparaître et devenir introuvable hors-ligne
- Les favoris épinglent désormais leur définition dans le cache : exemptés de l'éviction, ils restent consultables hors connexion
- Un nouveau lookup ne désépingle plus un favori (épingle conservée)
- Indicateur « ● hors-ligne » dans le panneau et mention « hors-ligne » sur la liste des favoris
- 100 % local, aucune dépendance ajoutée

## 0.46.0 — Pack 15 Instantanés portables : export/import fichier

### Instantanés cloud → fichier unique (.formasnap.zip)
- Les instantanés vivaient uniquement dans IndexedDB (perdus si le stockage navigateur est effacé)
- Nouveau : télécharger un instantané en un seul fichier `.formasnap.zip` regroupant carnets (.forma) + modules (.formamods)
- Import d'un fichier `.formasnap.zip` comme nouvel instantané local (puis restaurable comme les autres)
- Sauvegarde complète portable en un seul fichier (plus besoin de deux téléchargements séparés)
- Paramètres › Sync : bouton « Télécharger » par instantané + « Importer un fichier »
- 100 % local, aucune dépendance ajoutée

## 0.45.0 — Pack 14 FormaCloud local : instantanés IndexedDB fiables

### Slot cloud local → instantanés IndexedDB
- L'ancien « slot cloud » localStorage plafonnait à 5 Mo et tronquait silencieusement les grosses sauvegardes (restauration corrompue)
- Nouveau stockage `cloudSnapshots` dans IndexedDB (schéma v16) : aucune limite de taille
- Chaque instantané regroupe **carnets (.forma) + modules (.formamods)** — la sauvegarde auto couvre enfin tous les modules
- Historique local des 8 derniers instantanés (purge automatique des plus anciens)
- Paramètres › Sync : « Créer un instantané maintenant », liste des instantanés avec restauration (fusion) et suppression par entrée
- Migration transparente de l'ancien slot localStorage en instantané, puis nettoyage
- 100 % local, aucune dépendance ajoutée

## 0.44.0 — Pack 13 Sauvegarde des modules : export/import complet

### Sauvegarde des modules (.formamods.zip)
- La sauvegarde `.forma` ne couvrait que carnets/pages/assets ; les modules étaient perdus à la restauration
- Nouveau bundle `.formamods.zip` : FormaDoc, FormaTab, FormaPresent, FormatCal, FormaReview, FormaCombine, Moodboard, FormaLibrary + réglages + préférences locales
- Blobs inclus : ressources FormaLibrary (stockées en ligne) et images Moodboard (table `assets`)
- Préférences localStorage sauvegardées (Mode Focus, FormaDico)
- Import fusion (par défaut, conserve les ids existants) ou remplacement ; 100 % local
- Boutons d'export/import dans Paramètres › Sauvegarde des modules ; aucune dépendance ajoutée

## 0.43.0 — Pack 12 FormaLibrary : bibliothèque de ressources locale

### FormaLibrary (legacy ArchNote → Forma)
- Page `/formalibrary` : dossiers, presets (CNB, CCQ, détails, matériaux, textures, références), lien sidebar
- Import image / PDF / SVG / texte (glisser-déposer ou bouton) avec classement automatique par nom/contenu
- Stockage 100 % local : métadonnées + blobs dans Dexie (tables `libraryFolders`, `libraryItems`, schéma v15)
- Recherche pondérée, filtres par type/favoris, tri (modifié/créé/nom/type), surlignage des résultats
- Aperçu (image, PDF, texte), favoris, suppression, téléchargement ; liens vers FormaDoc / FormaTab existants
- Extraction de texte PDF locale via PDF.js ; aucune dépendance ajoutée

## 0.42.0 — Pack 11 Mode Focus : minuteur Pomodoro flottant

### Mode Focus (legacy ArchNote → Forma)
- Widget Pomodoro flottant monté globalement (survit à la navigation), bouton sidebar ⚡ Mode Focus
- Cycles Focus / Pause configurables (1–120 min), anneau de progression suivant le thème
- Alarme audio : bip Web Audio par défaut, son personnalisé enregistré (micro) ou importé
- Préférences (durées, type d'alarme) persistées ; alarme perso conservée en localStorage
- 100 % hors-ligne, aucune dépendance ajoutée

## 0.41.0 — Pack 10 FormaDico : page dictionnaire dédiée

### FormaDico (legacy ArchNote → Forma)
- Page `/formadico` dédiée (parité legacy) réutilisant le panneau Outils existant, lien sidebar
- Favoris désormais **navigables** : pastilles cliquables relançant la recherche (panneau + page)
- Historique et favoris visibles en permanence sur la page (et au repli dans le tiroir Outils)
- Lien « Traduire » → `/translate?text=…` (préremplissage du texte source)
- Définitions, synonymes, antonymes, expressions, mode scolaire, cache hors-ligne (inchangés)
- Source libre Wiktionary (CC BY-SA) + dictionaryapi.dev (EN) ; aucune dépendance ajoutée

## 0.40.0 — Pack 9 Traduction : OCR local + traduction EN ↔ FR

### Traduction (legacy ArchNote → Forma)
- Page `/translate` : import image / PDF, extraction de texte et traduction, lien sidebar
- OCR 100 % local (Tesseract) sur images, texte PDF natif via PDF.js avec repli OCR (jusqu'à 12 pages)
- Traduction EN ↔ FR : fournisseurs `api`, `browser` (MyMemory / LibreTranslate, en ligne) et `mock` (démo hors-ligne mot à mot)
- Inversion des langues, copie et téléchargement `.txt` du résultat
- Réseau déclenché uniquement à l'action « Traduire » ; aucune dépendance ajoutée (Tesseract / PDF.js déjà présents)

## 0.39.0 — Pack 8 FPause : mini-jeux de détente hors-ligne

### FPause (legacy ArchNote → Forma)
- Page `/fpause` : 5 mini-jeux canvas chargés à la demande (lazy), lien sidebar
- Jeux : Dino Run, Snake, Pong, Ball Bounce, Breakout — clavier, souris et tactile
- Thème canvas dérivé des variables CSS Forma (suit le thème actif)
- Meilleurs scores persistés localement par jeu, modale de jeu fermable (Échap)
- 100 % hors-ligne, aucune dépendance ajoutée

## 0.38.0 — Pack 7 FormaAI : recherche unifiée locale et assistant

### FormaAI (legacy ArchNote → Forma)
- Page `/formaai` : onglets Recherche et Assistant, lien sidebar
- Recherche unifiée **100 % locale** sur carnets, FormaDoc, FormaTab, FormaPresent,
  FormatCal, FormaReview, FormaCombine, moodboards, dossiers et formules (index Dexie caché)
- Surlignage des termes, filtres par source, navigation clavier (↑↓ / Entrée)
- Assistant : provider IA opt-in (`VITE_AI_API_KEY`) avec **fallback local garanti**
  (résumer, corriger, reformuler, notes techniques, classer…), historique persistant
- Aucune dépendance ajoutée, aucune donnée envoyée sans clé API explicite

## 0.37.0 — Pack 6 : docs architecture future (collab / sync / IA)

### Documentation (aucun changement de code applicatif)
- `docs/COLLAB-DESIGN.md` (nouveau) : modèle collaboration hérité (profils, amis,
  partages, dossiers, commentaires, permissions) → cible local-first opt-in
- `docs/SYNC-DESIGN.md` enrichi : moteur sync legacy (providers, file d'attente,
  détection conflits), snapshots/versions, FormaCloud bundles, backlog Hub
- `docs/AI-PRIVACY.md` enrichi : couche FormaAI (provider api/mock + fallback local,
  actions locales, indexeur de recherche unifié 100 % local)

## 0.36.0 — Pack 5 FormaCombine : assemblage multi-sources et export PDF

### FormaCombine (legacy ArchNote → Forma)
- Dexie v14 : table `formaCombineProjects` (pages combinées, réglages numérotation)
- Page `/formacombine` : bibliothèque projets, sidebar réordonnable, aperçu canvas
- Import fichiers : PDF, images, TXT/MD/CSV, DOCX + sources FormaDoc/FormaTab/carnets
- Pages spéciales : blanc, titre, séparateur · rotation, duplication, drag-drop
- Export PDF combiné (pdf-lib), ZIP PNG/JPG, dossier projet, pages individuelles

## 0.35.0 — Pack 5 FormaReview : sessions annotation Dexie et commentaires

### FormaReview (legacy ArchNote → Forma)
- Dexie v13 : table `formaReviewSessions` (pages, pins, markups, threads commentaires)
- Page `/formareview` : bibliothèque modes (plans, équipe, jury, prof), éditeur canvas
- Outils annotation : crayon, surligneur, flèches, formes, texte, gomme, pins
- Panneau fil commentaires : réponses, édition, historique, résolution pin/thread
- Import PDF/images, autosave, lien FormaReview sidebar

## 0.34.0 — Pack 5 FormatCal : calendrier Dexie et vues agenda

### FormatCal (legacy ArchNote → Forma)
- Dexie v12 : table `formaCalEvents` (événements, catégories, rappels, checklist)
- Page `/formatcal` : vues mois/semaine/jour/agenda/timeline + listes projets/remises
- Modal événement : presets architecture/école, filtres sidebar, drag-drop mois
- Export ICS et PDF agenda, notifications locales, lien FormatCal sidebar

## 0.33.0 — Pack 5 FormaPresent : diaporamas Dexie et mode présentation

### FormaPresent (legacy ArchNote → Forma)
- Dexie v11 : table `formaDecks` (slides 16:9, éléments texte/image)
- Page `/formapresent` : bibliothèque templates, éditeur stage + sidebar slides
- 6 templates : vierge, architecture, portfolio, jury, scolaire, planche concept
- Mode présentation plein écran : navigation, notes (N), laser (L), transitions
- Grille, guides, magnétisme, alignement, autosave + lien FormaPresent sidebar

## 0.32.0 — Pack 5 FormaTab : tableur Dexie et formules

### FormaTab (legacy ArchNote → Forma)
- Dexie v10 : table `formaSheets` (grille 20×26, cellules, fusions)
- Page `/formatab` : bibliothèque + éditeur grille avec barre de formules
- Formules : SOMME, MOYENNE, MIN, MAX, COMPTER + arithmétique A1:B5
- Styles cellule, fusion, tri colonne, undo/redo, verrouillage
- Export CSV et JSON + lien FormaTab dans sidebar bibliothèque

## 0.31.0 — Pack 5 FormaDoc : documents riches Dexie

### FormaDoc (legacy ArchNote → Forma)
- Dexie v9 : table `formaDocuments` (pages HTML multi-pages)
- Page `/formadoc` : bibliothèque (recherche, tri, aperçu), éditeur riche
- 4 templates : vierge, notes, cours, fiche technique
- Toolbar : gras/italique/titres/listes/images, gestion pages
- Export TXT, MD, PDF (texte via pdf-lib)
- Autosave debounced + lien FormaDoc dans sidebar bibliothèque

## 0.30.0 — Pack 4 moodboard : boards Dexie, grille et canvas

### FMoodboard (legacy ArchNote → Forma)
- Dexie v8 : tables `moodboardBoards`, `moodboardImages` (blobs via `assets`)
- Page `/moodboard` : sidebar boards / favoris / archives, création board emoji+couleur
- Vues grille (masonry) et canvas (drag, resize, rotation, z-index)
- Import fichier, URL distante, export PNG, lien partage `?board=`
- Lien Moodboard dans sidebar bibliothèque

## 0.29.0 — Pack 3 outils : calc, convertisseur, traduction, dico, formules

### Outils contextuels (legacy ArchNote → Forma)
- Calculatrice drawer : scientifique + outils architecture (surface, pente, échelle, unités…)
- Convertisseur unités longueur / surface / volume + échelles de dessin
- Widget traduction EN↔FR (MyMemory / LibreTranslate / API / mode démo)
- FormaDico : dictionnaire Wiktionary + cache local
- Catalogue **67 formules** architecture (`/formulas`) : Blondel, pentes, structures, accessibilité…
- Barre outils éditeur : 🧮 🌐 📖 📐 + panneau latéral
- Lien Formules dans sidebar bibliothèque

## 0.28.0 — Pack 2 bibliothèque : matières, tableau, chronologie

### Bibliothèque (legacy ArchNote → Forma)
- 20 matières par défaut + matières personnalisées (`src/lib/subjects.ts`)
- Onglets sidebar : Tableau de bord, Matières (+ Carnets, Favoris, Récents)
- Vue chronologie par mois + tri par matière / taille
- Dossiers avec emoji et couleur (`FolderCard`, création enrichie)
- Menu contextuel iOS-like sur carnets et dossiers (`ContextMenu`)
- Dashboard stats : totaux, par matière, activité récente
- `Notebook.subjectId` + assignation depuis panneau Matières ou menu contextuel

## 0.27.0 — Pack 1 visuel : FTheme, glass UI, shell bibliothèque

### Visuel (legacy ArchNote → Forma)
- 20 thèmes FTheme (`src/theme/themes.ts`) + application runtime CSS vars
- Glass UI : panels, cartes, modals, toasts, boutons (`index.css` + `GlassPanel` / `GlassButton`)
- `AppBackground` — dégradé ambiance depuis thème actif
- `LibraryShell` — sidebar bibliothèque style ArchNote
- Sélecteur thème visuel dans Paramètres
- Cartes carnets glass + header translucide

## 0.26.2 — Multi-agent parallel: bench strokes, storage cleanup, UX toasts

### Canvas (Agent 1+2)
- `resize-utils.ts` — coords resize handles ; métrique `partialAreaRatio` PerfHud

### Bench (Agent 3)
- E2E `canvas-stroke-bench.spec.ts` — seed IDB 500/1000 strokes
- Bench lasso dans `canvas-render-bench.spec.ts`

### `.forma v2` (Agent 4)
- `remapThumbnailKeys()` pour merge avec IDs remappés

### PWA / locks (Agent 6)
- `attemptStaleDocumentLockTakeover` ; SW cache v9 ; toasts success/error reprise

### Storage (Agent 7)
- `assets-orphan.ts` + `runStorageCleanup` ; test `db-health.test.ts`

### UX (Agent 8)
- Toasts variants info/success/error (dark mode)

### QA / E2E
- Helpers E2E : `waitForStrokePersisted`, `waitForEditorReady`, reset IDB sans conflit Dexie
- Playwright : workers=1, timeout 60s, sélecteur lasso `title`
- `replaceImportBackup` : download via `waitForEvent`

## 0.26.1 — usePageCanvasPointer, dirty rects eraser, forma v2 E2E, render bench

### Canvas
- Hook `usePageCanvasPointer` — extraction pointer down/move/up (~400 lignes)
- `canvas-erase.ts`, `page-mutations.ts` — helpers extraits
- Dirty rects gomme : `eraserInkClip` + redraw partiel

### `.forma v2`
- Export Paramètres : option « Inclure vignettes (.forma v2) »
- E2E roundtrip export v2 + replace import

### PWA / verrou
- Bannière lock : hint expiration + toast reprise/échec

### Bench / QA
- E2E `canvas-render-bench.spec.ts` (pan, zoom, 12 traits)
- Tests `canvas-erase`, `document-lock remaining`

## 0.26.0 — Multi-onglets dur, `.forma v2` import thumbs, canvas modules

### PWA / verrou multi-onglets
- Pruning verrous au démarrage (`main.tsx`) + release `pagehide`
- Doc `MULTI-TAB-LOCK.md` ; E2E reprise après verrou expiré
- Export `DOCUMENT_LOCK_STALE_MS` (45 s)

### Canvas
- Extraction `pointer-utils.ts`, `overlay-interaction.ts` depuis `PageCanvas`
- PerfHud : métriques redraw partial/full (`canvas-redraw-metrics`)
- Bench E2E canvas : 24 traits (advisory)

### Export / import `.forma`
- Import v2 : lecture `thumbnails/{pageId}.png` + seed cache sidebar/bibliothèque
- Format `forma-v2` dans `ImportFormaResult.importedThumbnails`

### Architecture future
- `renderer-types.ts` + `docs/RENDERER.md`, `docs/PWA.md`

## 0.25.2 — PageCanvas refactor, dirty rects phase 2, architecture future

### Moteur canvas
- Hooks extraits : `useCanvasHistory`, `useCanvasRenderScheduler`
- Dirty rects phase 2 : overlay lasso/sélection partiel + métriques `canvas-redraw-metrics`
- Bench Playwright advisory (`canvas-bench.spec.ts`)

### Données / export
- `.forma v2` thumbnails optionnels (`includeThumbnails`) — doc `FORMA-V2.md`
- E2E export PDF multi-pages

### PWA / verrou
- Pruning verrous expirés + bouton « Reprendre l'édition »

### Docs
- `SYNC-DESIGN.md`, `WEBGL-STUDY.md`, `AI-PRIVACY.md`, `ARCHITECTURE.md` enrichi

## 0.25.1 — Preview deploy docs, rotation handles, dirty rects phase 1

### Infra
- `.env.example` + `docs/DEPLOY.md` (preview Vercel branche `formacursor`)
- `vercel.json` SPA rewrites
- CI job `bench` advisory (stroke 1k/5k/10k warning, non bloquant)

### Canvas
- Poignée rotation visuelle (texte / image / sticker) + undo/redo batch
- Dirty rectangles phase 1 : clips encre drag/rotation ; lasso overlay RAF
- `src/lib/dirty-rect.ts` + tests

### QA
- E2E export PDF carnet (`pdf-export.spec.ts`)
- Tests rotation handle + dirty-rect Vitest

### Docs
- `docs/ARCHITECTURE.md` — modules, fichiers >500 lignes, plan découpage
- `docs/LIMITES.md` — export PDF, perf, preview

## 0.25.0 — E2E production + verrou dur + rotation visuelle

### QA
- E2E replace `.forma` avec confirm + backup auto
- E2E multi-onglets : second onglet lecture seule verrouillée
- Reset IDB/localStorage locks entre tests

### Données / PWA
- Verrou document **dur** (localStorage + readMode forcé)
- Toolbar désactivée en « Lecture (verrouillée) »

### Canvas
- Rotation visuelle : `rotation` (rad) sur texte, images, stickers
- Rendu canvas via `drawRotatedRect` dans `page-render.ts`

### Docs
- `docs/MIGRATIONS.md` — Dexie v1→v7 + v8 prévu

## 0.24.2 — E2E production + Dexie v7 + verrou document

### QA / CI
- E2E : round-trip `.forma` merge, import PDF, création dossier, reset IndexedDB entre tests
- Playwright : projet iPad ; CI Chromium only
- `prepareE2EPage()` + helpers IDB

### Données
- Dexie **v7** : migration `pdfSourceDataUrl` → `pdfSourceAssetId`
- Import backup : journal `importLog[]` diagnostic
- Préparation `.forma v2` (`FORMA_V2_THUMBNAIL_PREFIX`)

### PWA / multi-onglets
- `document-lock.ts` : verrou sessionStorage par carnet + bannière éditeur

### Canvas / perf
- `stroke-bench.ts` : benchmark 1k / 5k / 10k strokes (Vitest)

## 0.24.1 — CI + E2E éditeur

### QA
- GitHub Actions `.github/workflows/ci.yml` : Vitest, build, Playwright
- E2E éditeur : dessin + persistance après refresh, ajout page
- `data-testid="page-draw-canvas"` pour tests navigateur

## 0.24.0 — Sprint multi-agents (7 périmètres, Pack 1–5)

Release coordonnée : Git/E2E, sécurité import, Dexie v6, canvas rotation, PDF bench, PWA multi-onglets, sync queue.

### Agent 1 — Git, CI, tests E2E
- Dépôt git initialisé ; `@playwright/test` + `playwright.config.ts` (port 5199)
- Smoke E2E : accueil, création carnet, navigation Paramètres / Modèles
- Scripts `test:e2e`, `test:all`

### Agent 2 — Import / export / sécurité données
- Mode `replace` : sauvegarde `.forma` auto horodatée avant remplacement
- Cloud-restore : modes `replace` / `merge` + confirmations
- Merge : remap collisions page id et asset id
- Tests round-trip enrichis (`backup-roundtrip.test.ts`)

### Agent 3 — Dexie / migration / stockage
- Dexie **v6** : upgrade dataURL → blob (`runDexieDataUrlMigrationTx`)
- `db-health` : refs cassées ; commentaires gaps champs temporels
- Tests migration v5→v6 (`schema.test.ts`, `dataurl-migration.test.ts`)

### Agent 4 — Canvas / lasso / undo / performance
- `rotateSelection()` + raccourcis `[` / `]` (±15°, Shift ±45°)
- Fix undo batch après drag sélection
- `countStrokesRenderCost()` pour benchmark strokes
- Tests rotation mixte stroke+shape, batch page-history

### Agent 5 — PDF / thumbnails / export
- Bench PDF 50/100/200 pages (`benchmarkPdfPageCounts`)
- SVG : data URLs > 256 ko omises avec commentaire XML
- Export PDF : fond raster documenté dans `pdf-vector-export.ts`

### Agent 6 — PWA / offline / multi-onglets
- `multi-tab.ts` : BroadcastChannel + heartbeat localStorage
- `MultiTabBanner` + `OfflineBanner` renforcé (reconnexion, aria-live)
- `storage-errors` : kind `unavailable` (quota, IndexedDB bloqué)

### Agent 7 — Sync locale / préparation cloud
- Statuts sync : `pending` | `applied` | `synced` | `failed`
- Pruning ops > 30 jours / max 500 ; `processSyncQueue` simulation locale
- `docs/SYNC_API.md` : contrat futur Supabase/API

## 0.23.1 — Corrections post-rapport

### Données
- `cloud-restore.ts` : mode `replace` explicite ; suppression double `backfillMissingPdfText`

### Dev / perf
- Paramètres : bouton « Bench rendu PDF » (cold/warm page 1)

### Docs
- `CONFORMITE.md` : statut import merge corrigé
- `PHASE2.md` : aligné 0.23

## 0.23.0 — Import merge + prefetch PDF

### Données
- `importBackupFile({ mode: 'merge' })` : fusion non destructive
- Conflit d’id carnet → clone sous nouvel identifiant (contenu conservé)
- Paramètres : boutons « remplacer » / « fusionner »
- Refactor `importNotebookCloneFromData` partagé avec import carnet

### PDF
- Vue continue : prefetch PDF centré sur la page active (`centerIndex`)

### Tests
- `backup-roundtrip.test.ts` : merge + remap id conflict

## 0.22.0 — Sprint multi-agents (5 périmètres parallèles)

Release coordonnée : stockage, canvas, PDF/thumbs, PWA, QA. **68 tests Vitest, build OK.**

### Agent 1 — Stockage / `.forma` / Dexie
- Intégrité SHA-256 optionnelle dans le manifest `.forma`
- Import ZIP : parse unique (`importFormaPackage(file, { zip })`)
- Fix migration dataURL → blob (`dataUrl` effacé après externalisation)
- `importAssetsFromZip` limité aux blobs avec notebookId déduit
- Tests : `dataurl-migration.test.ts`, `schema.test.ts`, round-trip enrichi

### Agent 2 — Canvas / outils / perf
- Page pooling vue continue (`page-canvas-pool.ts`, `PagePlaceholder.tsx`)
- Redraws overlay via `requestAnimationFrame` (lasso, ruban sans re-hydrat PDF)
- Lasso : rect min 4px, batch undo corrigé
- Tests : `page-history`, `continuous-viewport`, `selection-engine`

### Agent 3 — PDF / thumbnails / export
- `pdf-page-render-helpers.ts` + prefetch ordonné/limité (LRU touch)
- Thumb-queue : coalescence, bump priorité, `invalidateMany`
- Bibliothèque : couvertures lazy IO ; sidebar prefetch ±2
- Export PNG async ; PerfHud cache PDF

### Agent 4 — PWA / offline
- `pwa.ts`, `usePwaUpdate.ts`, `OfflineBanner.tsx`
- SW v8 : shell precache, network-first app, cache-first assets
- Manifest enrichi ; update flow SKIP_WAITING + confirm reload
- Section PWA dans Paramètres

### Agent 5 — QA / conformité
- Tests : `autosave`, `sync-queue`, `save-journal`, `selection-engine`
- `docs/CONFORMITE.md`, `docs/LIMITES.md` mis à jour

## 0.21.0 — Phase 1 tests + SVG + undo transactionnel

### Tests
- `fake-indexeddb` + `backup-roundtrip.test.ts` : export/import Dexie, blobs assets, import carnet
- `page-history.test.ts`, `path-simplify.test.ts`
- Vitest : setup global, environnement jsdom

### Export SVG
- `path-simplify.ts` : Ramer–Douglas–Peucker sur traits longs (≥8 points)

### Données / import
- Fix import ZIP : lecture unique du buffer (assets blobs réimportés correctement)
- `readBlobBytes`, sniff MIME PNG/JPEG/PDF à l’import assets
- `blobToArrayBuffer` robuste à l’export

### Éditeur
- Undo transactionnel : `beginBatch` / `endBatch` (trait, gomme, resize, déplacement sélection)
- Fix undo resize : snapshot via `localRef` (état à jour pendant drag)

## 0.20.0 — Phase 2 suite

### Performance
- `thumb-queue.ts` : file miniatures (priorité, cache, concurrence limitée)
- Sidebar pages : génération lazy au scroll + page active prioritaire
- Bibliothèque : couvertures via queue (1 concurrent)
- Canvas : batch rendu stylo (≥4 traits pen identiques)

### Tests
- `thumb-queue.test.ts`

## 0.19.0 — Phase 2 performance (début)

### Vue continue & PDF
- `continuous-viewport.ts` : marge IO dynamique, prefetch indices, démontage différé
- Cache PDF : clé stable par carnet, LRU 36 pages, DPR adaptatif
- `prefetchPdfPages` : préchargement ±2 pages en vue continue
- Tests : `continuous-viewport.test.ts`

## 0.18.0 — Phase 1 consolidation

### Format `.forma`
- `forma-types.ts`, `forma-validate.ts` : validation manifest, metadata, structure ZIP
- Import retourne `validationIssues` ; manifest `integrity` (checksum futur)
- Export/import audio `assetId` + blobs
- Tests : `forma-validate.test.ts`, `forma-package.test.ts`, fixtures

### Autosave
- File séquentielle par page (`saveChains`) — plus de races concurrentes
- Re-sauvegarde si la page change pendant un flush
- `save-journal.ts` : journal local des événements save/recovery/import

### Données
- `db-health.ts` : refs assets cassées, orphelins, pages inline restantes
- Import sauvegarde complète : **confirmation destructive** obligatoire
- Paramètres : indicateurs santé DB

## 0.17.0

### Stabilité stockage
- `storage-errors.ts` : détection quota IndexedDB / Dexie
- Autosave : toast explicite, libellé « Espace insuffisant » dans l’éditeur
- Paramètres : jauge stockage navigateur (`navigator.storage.estimate`)

### Sync & tests
- File sync : persistance **localStorage** (migration depuis session)
- Vitest : tests unitaires `storage-errors`

## 0.16.0

### Données
- Import carnet `.forma` : clonage systématique des assets (évite le partage / écrasement entre carnets)
- Ordre import : blobs ZIP → clone → pages (aligné sur la duplication de carnet)

## 0.15.0

### Format `.forma`
- Import : conservation des `assetId` si blobs présents (`assets/blobs/{id}.{ext}`)
- Blobs exportés avec extension MIME (pdf, png, …) ; lecture `.bin` legacy
- Import carnet : restauration des assets IndexedDB depuis le ZIP
- Carnets : `pdfSourceAssetId` préservé à l’import

### Sélection
- Redimensionnement groupé (poignée SE, mode lasso, multi-sélection)

### Performance
- Constantes SLA (`PERF_TARGET_FPS`, `PERF_WARN_FPS`, `PERF_TARGET_PAGE_MS`) ; HUD aligné

## 0.14.0

### Format `.forma`
- Export pages/carnets : blobs IndexedDB (`assetId`) inclus dans `assets/blobs/` (plus seulement dataURL inline)

### Autosave & PWA
- Bouton « Erreur — réessayer » dans l’éditeur (`retryFailedSaves`)
- Bandeau « Hors ligne » global (données locales toujours accessibles)

### Export
- SVG vecteur : surligneurs sous l’encre (ordre calques)

## 0.13.0

### Performance & viewport
- Zoom mémorisé par carnet (`localStorage`, 35–160 %)
- Vue continue : préchargement PDF des pages proches du viewport (cache LRU)
- Pression mémoire : GC assets orphelins en plus de la purge caches

### Export
- PDF vectoriel : surligneurs dessinés avant l’encre (ordre de calques)

### Autosave
- Flush avant « Fermer les autres » / « Tout fermer » (onglets)

## 0.12.0

### Export
- `export-resolve.ts` : blob/http → data: pour SVG autonomes (hors session)

### Données
- GC assets orphelins (`garbageCollectOrphanAssets`) : démarrage idle + bouton Paramètres
- Sync queue sur `updateNotebookMetadata`

### Sélection
- Flèches clavier pour déplacer la sélection (8 px, Shift 32 px)

## 0.11.0

### Export
- SVG vecteur : hydratation assets/PDF source, stickers, tapes, fond PDF lazy

### Données & sync
- Collage : clonage des blobs images dans le carnet cible
- File sync : panneau Paramètres (compteur + vider) ; `notebook_update` au renommage
- Fermeture d’onglet : flush autosave avant navigation

### UX
- Changement d’outil : désélection automatique
- PWA : cache SW v6

## 0.10.0

### Sélection
- Aperçu fantôme pendant le déplacement (contenu suit le curseur)
- Shift+clic : bascule ajout/retrait dans la sélection

### Presse-papiers
- Collage async : résolution des `assetId` → dataURL, nouveaux ids sans référence orpheline

### Export PDF vectoriel
- Flèches vectorielles, rubans adhésifs (tapes), stickers en raster emoji

## 0.9.0

### Sélection
- Module **`selection-engine.ts`** (collecte rect/cercle, hit-test, déplacement, suppression, cadres)
- Outil lasso : clic pour sélectionner un élément, Shift+clic pour ajouter, glisser dans la sélection pour déplacer
- Cadres de sélection pour formes, textes, tapes ; aperçu pendant le drag
- Raccourcis : Échap (désélection), Ctrl+A (tout sélectionner en mode lasso)

### Performance
- **`perf-monitor.ts`** : FPS, frame drops, temps de changement de page
- HUD activable dans Paramètres

### Données
- Migration idle des dataURL inline vers assets (par lots)

## 0.8.0

### Données & assets
- Suppression des blobs IndexedDB à la suppression définitive d’un carnet
- Duplication de carnet : clonage des assets (PDF source, images, audio, raster page)
- Réassignation `notebookId` des assets lors du déplacement de page ou `savePage`
- Migration PDF source au démarrage (`requestIdleCallback`) pour tous les carnets PDF

### Export & rendu
- Tous les exports passent le carnet complet pour hydrater `pdfSourceAssetId` / images blob
- PDF vectoriel : images via `data:` ou `blob:` (assets externalisés)
- Impression : hydratation assets
- Export bibliothèque en masse : hydratation corrigée

### Sync
- File d’attente sync persistée en `sessionStorage` (déduplication par entité, max 500 ops)

## 0.7.0

### Données
- Table IndexedDB **`assets`** (blobs) — images, audio, PDF source externalisés (> 4 Ko)
- Hydratation à la volée pour rendu / export (URLs objet en cache)
- Import `.forma` v1 : blobs réinjectés dans `assets`

### Canvas
- **Fond mis en cache** (pas de rerender PDF/template à chaque trait)
- **Dirty rectangles** sur la couche encre pendant le dessin

### Audio
- Enregistrements stockés en blob (`AudioClip` + lecture résolue)

## 0.6.0

### Format & données
- **Format `.forma` v1** : ZIP structuré (`manifest.json`, `pages/`, `strokes/`, `assets/`, `indexes/`)
- Import **rétrocompatible** (`backup.json`, manifest carnet legacy)
- Récupération partielle : pages corrompues ignorées à l’import
- Assets externalisés dans le ZIP (images, PDF source, audio)

### Export
- **PDF vectoriel** (traits et formes en paths pdf-lib, fond/images raster si besoin)
- Export PNG toujours en 2×

### Stabilité
- Autosave : brouillon de récupération (`localStorage`) en cas d’échec
- Restauration automatique au chargement si le brouillon est plus riche
- Écoute pression mémoire : purge caches PDF / images

### PWA
- Icônes PNG 192 / 512 (`npm run icons`)
- Service Worker v5 (shell + assets SWR)

## 0.5.0

- Autosave debounce 2 s, flush visibility
- Virtualisation vue continue, import PDF lazy, split strokes
