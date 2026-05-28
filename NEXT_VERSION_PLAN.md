# FORMA — Plan Version Suivante
_Généré le 2026-05-26 · Branch: claude/stoic-wright-3X38O_

---

## ✅ SESSION ACTUELLE — Terminé

| Quoi | Fichier |
|------|---------|
| Bug z-index : animations devant la page | App.jsx, EditorPage, LibraryPage, MoodboardPage |
| ThemePicker : onglets Animation/Fond non-cliquables | LibraryPage |
| ThemePicker : fond personnalisé "Ma photo" | LibraryPage, useAppStore, App.jsx |
| Lasso free + lasso rect (pointInPolygon, selectedStrokes) | EditorPage |
| Calculatrice flottante (header icon) | LibraryPage |
| Convertisseur d'unités flottant (mm/cm/m/km/po/pi) | LibraryPage |
| Panneau profil sur clic avatar (pseudo modifiable) | LibraryPage |
| Stats bar réorg (Moodboard + Thèmes chips) | LibraryPage |
| MoodboardPage créé (/moodboard) | MoodboardPage, App.jsx |

---

## 🔴 BUGS RESTANTS

### Gomme — objets disparaissent au survol
- **Status** : Non reproduit en code. La gomme opère sur canvas (zIndex:5) ; éléments DOM à zIndex:10 ne peuvent pas être effacés par destination-out.
- **Hypothèse** : pointer events capturés par l'élément DOM quand le crayon/doigt est proche, interrompant le tracé.
- **Fix suggéré** : Ajouter `pointerEvents:"none"` sur les éléments placés quand l'outil actif est "eraser".
- **Fichier** : `EditorPage.jsx` ligne ~1566 (div des éléments placés)

---

## 🟡 PARTIE 2 — UI/UX Premium iPad (Grande refonte)

### 2.1 Hiérarchie visuelle & espacement
- Augmenter les paddings globaux (20→28px minimum sur mobile/iPad)
- Réduire le nombre d'éléments visibles simultanément
- Spacing uniforme : système 4px/8px/16px/24px/32px/48px
- Supprimer bordures superflues (utiliser ombres à la place)
- Cartes notebooks : elevation shadows type iOS (`0 2px 8px rgba(0,0,0,.08)` → `0 8px 32px rgba(0,0,0,.12)` au hover)

### 2.2 Animations & Motion design
- Transitions de page avec `framer-motion` ou CSS transitions
  - LibraryPage ↔ EditorPage : slide + fade
  - Ouverture modals : scale(0.95)→scale(1) + fade
  - Fermeture : scale(1)→scale(0.95) + fade out
- Micro-animations sur les cartes notebooks (scale hover déjà présent, améliorer)
- Panels flottants : slide-in depuis bas/côté
- Boutons : press feedback `scale(0.96)` on active
- Liste : stagger animation cardIn déjà présent, uniformiser

### 2.3 Navigation iPad
- Toolbar EditorPage : gestes swipe gauche/droite pour changer d'outil
- Library : swipe horizontal sur carte → actions rapides (étoile, supprimer)
- Bottom sheet modals pour les panneaux (au lieu de modals centrés)
- Sidebar escamotable sur iPad (slide depuis la gauche)

### 2.4 Design system unifié
- Variables CSS communes : `--radius-sm: 10px`, `--radius-md: 16px`, `--radius-lg: 22px`
- Shadows : `--shadow-sm`, `--shadow-md`, `--shadow-lg`
- Typography scale uniformisée
- Créer `src/lib/design.js` avec les constantes partagées

---

## 🟡 PARTIE 3 — Nouvelles Fonctionnalités

### 3.1 Polices d'écriture (outil Texte dans EditorPage)
- Ajouter un sélecteur de police dans le panneau flottant
- Polices cibles : Syne, Nunito, Architects Daughter, Patrick Hand, Caveat, Kalam, Gloria Hallelujah, Indie Flower, Nothing You Could Do, Reenie Beanie
- Charger via Google Fonts (`@import` ou `<link>` dans index.html)
- Stocker `fontFamily` dans useAppStore + persist
- Fichier : `EditorPage.jsx` — FloatingPanel + outil texte sur canvas

### 3.2 Bibliothèque éléments structuraux — améliorations
- **Redimensionnement** : handles sur les éléments placés (coin + côté)
  - Drag sur handle → resize (width/height)
  - Shift+drag → conserver ratio
- **Rotation** : handle de rotation (arc au-dessus de l'élément)
  - Drag circulaire → rotation en degrés
  - Snap à 45°, 90°, 180° avec Shift
- **Profils HEA/HEB/WLS personnalisés** : 
  - Bouton "Nouveau profil" dans la bibliothèque
  - Form : nom, type (HEA/HEB/WLS/IPE/etc.), dimensions (w, h, t_f, t_w)
  - Rendu SVG généré à la volée selon le type
  - Stocké dans useAppStore (`customProfiles: []`)
  - Option "Dessiner à la main" : mini canvas de 200×200px pour dessiner le profil
- Fichier : `EditorPage.jsx` lignes ~1560-1600 + useAppStore

### 3.3 Documents partagés & Collaboration
- Onglet "Documents" dans la stats bar (remplace ou s'ajoute)
- **Dossiers dans dossiers** : structure hiérarchique (max 3 niveaux)
  - `folders` dans useAppStore → tree structure `{ id, name, emoji, parentId, children[] }`
  - Breadcrumb navigation dans LibraryPage
- **Personnalisation dossiers** : 
  - Upload photo de couverture (comme customBg, stocké en data URL)
  - Dessin à la main pour la couverture (mini canvas)
- **Collaboration temps réel** :
  - Supabase Realtime `presence` + `broadcast`
  - Affichage curseurs des collaborateurs (déjà partiellement présent avec `remoteCursors`)
  - Inviter par email ou lien partageable
  - Permissions : lecture seule / édition
- Fichier : LibraryPage + useAppStore + nouveau `CollabManager.js`

### 3.4 Vues & tri des carnets (LibraryPage)
- **Toggle vue** : boutons Grille / Liste / Timeline dans la barre de filtres
  ```
  [⊞ Grille] [☰ Liste] [📅 Timeline]
  ```
- **Grille** (actuelle, améliorée)
- **Liste** : rangées avec infos étendues (dernier modif, pages, dossier)
- **Timeline** : groupé par mois/semaine, line verticale style iOS
- **Tri** : dropdown "Trier par" → Date création, Dernière modif, Nom A→Z, Type/Matière
- **Sélection multiple** : long press → mode sélection → actions batch (déplacer, supprimer, archiver)
- Stocker préférence vue dans useAppStore (`libraryView: 'grid' | 'list' | 'timeline'`)
- Fichier : LibraryPage

### 3.5 Profil utilisateur enrichi
- **Photo de profil** : upload image, stockée en Supabase Storage ou data URL locale
- **Amis** : 
  - Chercher utilisateur par email
  - Envoyer demande d'ami (table Supabase `friendships`)
  - Liste d'amis avec statut en ligne
  - Partage rapide de carnets avec un ami
- **Stats profil** : carnets créés, pages totales, streak (jours consécutifs)
- Panneau profil élargi (280px → panneau latéral complet)
- Fichier : LibraryPage + nouveau `ProfilePanel.jsx`

### 3.6 Tailles de page (EditorPage)
- Déjà partiellement présent (`PAGE_FORMATS` dans EditorPage)
- Améliorer le sélecteur : 
  - Formats impériaux : Letter 8½×11, Legal 8½×14, Tabloid 11×17, Half Letter 5½×8½
  - Formats métriques : A6, A5, A4, A3, A2, B5, B4
  - Format personnalisé : saisie libre (w × h) avec unité mm/cm/in
- Sélecteur visuel (aperçu proportionnel de chaque format)
- Fichier : EditorPage.jsx

### 3.7 Dictée vocale (EditorPage)
- Bouton micro dans la toolbar ou le panneau flottant
- Utilise `window.SpeechRecognition` / `webkitSpeechRecognition`
- Mode texte manuscrit : la transcription est insérée comme objet texte positionnable
- Langue auto-détectée (fr-FR par défaut)
- Feedback visuel : animation de son pendant la dictée
- Fichier : EditorPage.jsx

### 3.8 Nouvelle page à partir d'une photo
- Dans le modal "Ajouter une page" (EditorPage) :
  - Option "Importer une photo comme fond de page"
  - Positionnement : Avant la page 1 / Après la page actuelle / À la fin
  - La photo devient le fond de la page à opacité configurable (comme customBg mais par page)
- Stocker `pages[i].bgImage` (data URL, max 500KB)
- Fichier : EditorPage.jsx + useAppStore

### 3.9 Moodboard amélioré (déjà créé, à enrichir)
- Mode grille Pinterest : masonry layout
- Mode canvas libre : déjà fait
- Tags sur les images
- Recherche dans les images (par nom, tag, description)
- Export board en PDF/PNG
- Partage de board (lien public)
- Fichier : MoodboardPage.jsx + useMoodboardStore.js

### 3.10 IA contextuelle discrète
- **OCR** : Tesseract.js pour reconnaissance texte sur photo importée
- **Auto-tag** : suggestion automatique de tags sur les images moodboard (CLIP/Transformers.js ou API externe)
- **Palette de couleurs** : extraction automatique des couleurs d'une image
- **Classement auto** : suggestion de matière/dossier lors de la création d'un carnet (basé sur le titre)
- Ces fonctionnalités sont **optionnelles** et **non-intrusives** (toujours une suggestion, jamais automatique)

---

## 📦 Fichiers à créer / modifier (prochaine session)

| Fichier | Changements |
|---------|-------------|
| `src/pages/LibraryPage.jsx` | Vues grille/liste/timeline, tri, sélection multiple, dossiers nested |
| `src/pages/EditorPage.jsx` | Resize/rotation éléments, dictée vocale, tailles page améliorées, polices |
| `src/pages/MoodboardPage.jsx` | Mode Pinterest, tags, recherche |
| `src/stores/useAppStore.js` | `libraryView`, `customProfiles`, `fontFamily` |
| `src/components/ProfilePanel.jsx` | Nouveau composant profil enrichi |
| `src/lib/design.js` | Constantes design system |
| `src/lib/structuralProfiles.js` | Profils SVG générés (HEA/HEB/WLS/IPE) |
| `index.html` | Google Fonts additionnels |

---

## ⚠️ Notes techniques importantes

1. **Push** : Fonctionne directement depuis le worktree (`git push origin <branche>`).

2. **Branche** : `claude/stoic-wright-3X38O`

3. **`framer-motion`** : Non installé. Pour les animations, utiliser CSS transitions + `@keyframes` (déjà présents dans le code).

4. **Supabase Realtime** : La collaboration temps réel nécessite des tables Supabase supplémentaires :
   - `friendships(id, user_a, user_b, status, created_at)`
   - `shared_notebooks(notebook_id, owner_id, collaborator_id, permission)`
   - `presence` via Supabase Channels (pas de table)

5. **Google Fonts** : Ajouter dans `index.html` :
   ```html
   <link href="https://fonts.googleapis.com/css2?family=Caveat&family=Kalam&family=Patrick+Hand&family=Gloria+Hallelujah&family=Indie+Flower&display=swap" rel="stylesheet">
   ```

6. **SpeechRecognition** : Disponible sur iOS Safari (webkit) et Chrome. Firefox non supporté. Fallback élégant nécessaire.

---

## 🚀 Priorité recommandée pour la prochaine session

### ✅ Déjà livré (sessions récentes)
- Polices d'écriture canvas
- Vues bibliothèque grille / liste / timeline + tri
- Resize + rotation éléments structuraux
- Formules architecture (calculateurs)
- Mini-jeux Pause (lazy load)
- Fix écran blanc (`applyAppearanceToTheme` dans useAppStore)

### 🔴 Avant toute nouvelle feature
- Autosave stable
- Pages stables (ajout, rotation, formats)
- Menus / panneaux flottants stables
- Éditeur stable (gomme, sélection, sauvegarde)
- Thèmes / fonds / polices stables

### 🟡 Prochaines vraies priorités
1. **Dictée vocale** (différenciateur unique)
2. **Design system / Premium UI** (refonte progressive)
3. **Tailles de page améliorées** (formats impériaux/métriques)
4. **Profils HEA/HEB personnalisés** (bibliothèque structurale)

---

## 🎁 PARTIE 4 — EN ATTENTE (mises de côté — ne pas développer avant stabilité)

> Specs figées pour plus tard. **Priorité basse à moyenne.**  
> Commit cible si un jour développé : `Add easter eggs, translation widget and document translation scanner`

### 4.1 Easter eggs emojis — priorité **basse / fun**

**Déclencheurs :**
| Mot saisi | Animation |
|-----------|-----------|
| `caca` | 💩 volent partout (2–3 s max) |
| `chat` | 🐱 / 😺 volent partout (2–3 s max) |

**Contraintes :**
- Animation courte, non bloquante
- Ne modifie pas le contenu du carnet
- Ne casse pas l'éditeur
- Option désactivation (store ou préférences)

**Architecture prévue :**
```
src/components/easter-eggs/EmojiBurst.jsx
src/hooks/useEasterEggTrigger.js
```
- Hook écoute saisie texte (LibraryPage recherche ? éditeur texte ?) — à préciser à l'implémentation
- Overlay `pointer-events: none`, z-index au-dessus du canvas, `@keyframes` CSS (pas framer-motion)

---

### 4.2 Mini-fenêtre de traduction — priorité **moyenne**

**Objectif :** widget flottant type Google Traduction (DraggablePanel existant).

**Fonctions :**
- Texte source → traduction
- Langues : EN ↔ FR par défaut ; modes « anglais base » / « anglais avancé » (prompt ou dictionnaire local)
- Copier, insérer dans carnet (réutiliser `pendingFormulaNote` / `__addTextStroke`)
- Déplaçable, réductible

**UI :**
- Champ source, champ résultat
- Select langue source / cible
- Boutons : Traduire, Copier, Ajouter au carnet

**Architecture prévue :**
```
src/components/translation/TranslationWidget.jsx
src/lib/translation.js
```
**Phase 1 sans API :** mock / placeholder / dictionnaire minimal EN↔FR  
**Phase 2 :** API (LibreTranslate self-host, DeepL, Google Cloud — variable `VITE_TRANSLATE_API`)

**Intégration :** icône discrète LibraryPage + EditorPage (comme UnitConverter / CalculatorDrawer)

---

### 4.3 Scan / traduction document — priorité **future avancée**

**Objectif :** importer image ou PDF → OCR → traduction EN→FR → copier / carnet

**Flux :**
1. Import image / PDF
2. OCR (`tesseract.js` — **lazy load obligatoire**)
3. Traduction (même couche que 4.2)
4. Affichage original | traduction côte à côte
5. Copier / ajouter au carnet

**Cas d'usage :** consignes école, fiches techniques, PDF, photo de document

**Architecture prévue :**
```
src/pages/TranslateScanPage.jsx          (ou panneau modal)
src/components/translation/DocumentScanTranslator.jsx
src/lib/ocr.js                           (wrapper tesseract lazy)
src/lib/translation.js                   (partagé avec 4.2)
```
**Contraintes :**
- Ne pas charger Tesseract au boot
- Fallback si OCR échoue (message + saisie manuelle)
- PDF : extraction texte native si possible, sinon raster + OCR page par page (phase 2)

**Route possible :** `/translate` ou entrée depuis widget 4.2

---

### 4.4 Fichiers à créer (quand priorité validée)

| Fichier | Feature |
|---------|---------|
| `src/components/easter-eggs/EmojiBurst.jsx` | 4.1 |
| `src/hooks/useEasterEggTrigger.js` | 4.1 |
| `src/components/translation/TranslationWidget.jsx` | 4.2 |
| `src/lib/translation.js` | 4.2 + 4.3 |
| `src/pages/TranslateScanPage.jsx` | 4.3 |
| `src/components/translation/DocumentScanTranslator.jsx` | 4.3 |
| `src/lib/ocr.js` | 4.3 (lazy tesseract) |

**Store / persistance optionnelle :**
- `translationSourceLang`, `translationTargetLang` dans useAppStore
- Pas de easter eggs persist (sauf toggle off)

