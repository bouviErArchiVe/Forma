# Forma

Application web de prise de notes type Goodnotes — locale, installable (PWA), proche d’un produit fini.

**Documentation produit / architecture** : voir le dossier [`docs/`](docs/README.md) (addendum technique, matrice de conformité).

## Fonctionnalités

### Bibliothèque
- Carnets, **whiteboards**, PDF (import + **drag & drop**)
- Favoris, récents, corbeille, dossiers
- Recherche : titres, texte saisi, **texte PDF indexé à l’import** (lien direct vers la page)
- **Note rapide**, **galerie de modèles**, sélection multiple
- **Drag & drop** PDF **et images** (nouveau carnet avec image)
- Favoris / Récents **globaux** (tous dossiers)
- **Fil d’Ariane** dossiers, **Note rapide** (carnet persistant)
- Navigation clavier : **flèches** + **Entrée** sur dossiers et carnets
- Déplacer vers dossier : navigation **dossiers imbriqués**

### Éditeur
- 11 outils : stylo, crayon, surligneur, gomme (modes ciblés), lasso, formes, texte, image, éléments, ruban, laser
- **Gomme** : tout / encre / surligneur / formes / ruban
- **Redimensionnement** image (poignée lasso)
- **Présentation** (plein écran, flèches, Échap), pan (Espace), PIN carnet, vue partage `/share/:token`
- **PDF** : liens cliquables en mode lecture, source PDF conservée pour réindexation
- Import carnet `.forma.zip`, page **Offres** `/plans`
- **Circle to Lasso** : dessinez un cercle au stylo → sélection automatique
- **Lasso** : copier, coller, dupliquer (Ctrl+C / V / D)
- **OCR sélection** → bloc texte sur la page
- Ruban redimensionnable, maintien du trait → forme
- Outils **sticky** (retour au stylo après image)
- Pages : **+ Page ▾** (choix modèle), dupliquer ⧉, copier/coller, favorites, rotation, miniatures incrémentales
- **Stickers** redimensionnables · **Shift** = snap ligne/flèche
- **Whiteboards** en format paysage
- **Accrochage grille** (réglages), **pinch-to-zoom**, liens PDF **internes** (saut de page)
- Export carnet **ZIP PNG** (bouton ZIP)
- **Historique de versions** par page (panneau Versions, jusqu’à 15 instantanés, inclus dans backup)
- **Trousse** : 3 presets outil (clic droit pour enregistrer), crayon avec couleur
- **Recherche in-document** : live, navigation Préc./Suiv., surlignage des blocs texte
- **Présentation** : pointeur **laser** (bouton 🔴)
- IA / Study : contexte enrichi avec **texte PDF** indexé
- OCR : worker Tesseract **partagé** + barre de progression
- **Défilement continu** (toutes les pages, page active éditable)
- **Scanner** : contraste + niveaux de gris avant insertion
- **Recherche manuscrit** : index OCR de l’encre (`inkText`) + hits type « Encre »
- Sauvegarde auto **silencieuse** → slot cloud local
- **Versions auto** (option, 90 s après modification)
- **Partage portable** : export/import `.forma-share.zip` (autre navigateur)
- **Gomme circulaire** : petit cercle au stylo efface l’encre
- **Règle mm** sur la page (📐 ou Paramètres)
- **Audio** : transcription live (Web Speech API, Chrome/Edge)
- **Dupliquer un dossier** (⧉ au survol), **renommer** (✎)
- **Nombre de pages** sur les cartes bibliothèque
- **Export sélection** (.forma.zip) · export/import **page JSON**
- **Rubans** : révéler / masquer tout (mode lecture)
- **IA** : plan à puces, génération cartes Study
- **Ctrl+F** : panneau recherche · indicateur **Enregistré**
- Corbeille : purge auto **30 jours**
- **Plusieurs images** en drop → carnet multi-pages
- **+ PDF** : ajouter des pages PDF à un carnet existant
- Export **SVG** · saut de page par **clic** sur le numéro
- Filtre **pages ★** dans la sidebar · stats bibliothèque (Paramètres)
- Options carnet : **couverture**, modèle, orientation
- **Ctrl+K** : palette de commandes (carnets, navigation)
- **Fusionner** deux carnets (sélection ×2 en bibliothèque)
- **Déplacer une page** vers un autre carnet (menu ⋮)
- Sidebar pages **repliable** (‹ ›)
- Bannière **installer PWA**
- Menu **Exporter ▾** (en-tête éditeur allégé)
- **Miniatures** première page sur les cartes bibliothèque
- **Renommer** un carnet depuis la bibliothèque (double-clic ou ✎)
- **Supprimer un dossier** (carnets → corbeille)
- **Tout sélectionner** en mode sélection
- Zoom par défaut **persistant** (Paramètres)
- Surlignage recherche **encre / PDF** sur la page
- **Ctrl+K** dans l’éditeur : recherche, plan, versions, présentation, pages…
- Filtre **type** (carnet / PDF / whiteboard) + tris complets
- **Export PDF** en lot (sélection bibliothèque)
- Boîtes de dialogue **Confirmer** (plus de `alert` natif)
- Bandeau **Récents** · couverture rapide sur les cartes
- **Liste des pages** (☰) dans le navigateur
- **Coller page** dans un autre carnet
- Export **plage de pages** (PDF / ZIP PNG)
- Teinte du **papier** (crème / blanc / sépia)
- Révision Study **mélangée** (🔀)
- **Mode focus** (`) — canvas seul + navigation
- **SVG vecteur** (traits, formes, texte)
- **Swipe** tactile entre les pages
- **Home / End** — première / dernière page
- Drop **.forma.zip** sur la bibliothèque
- Rappel sauvegarde si &gt; 7 jours
- **Ctrl+K** : recherche dans les pages (texte, PDF, encre) de tous les carnets + **pages récentes**
- **ZIP SVG vecteur** — export carnet entier en SVG vectoriels
- **Stats page** dans le panneau Plan (traits, mots, images)
- Préférences bibliothèque **persistées** (tri, filtre, dossier)
- Dupliquer un carnet au survol (⧉)
- Export **Markdown** (page, carnet, ZIP sélection ou **bibliothèque entière**)
- **Import .md** par glisser-déposer (sections `---` → pages)
- Onglets : **Autres ×** · clic **molette** pour fermer
- **Study** : export **CSV** · révision SM-2
- Dossiers : **compteur de carnets** · corbeille **filtrable**
- **Ctrl+A** bibliothèque · toast **clic pour fermer**
- Couverture **par défaut** (Paramètres)
- **Study CSV** import/export · carnets **🔒** visibles en bibliothèque
- **Ctrl+K** : mode lecture, favori page ★
- OCR / audio : **copier** le texte · boîte **Entrée/Échap**
- OCR : **Indexer pour la recherche** (sans insérer sur la page)
- Liste pages ☰ : **★** sur les favoris · onglet bibliothèque **mémorisé**
- Déplacer page : **filtre** des carnets cibles
- **Ctrl+K** : panneaux IA / Study / OCR / partage / audio
- **Ctrl+N** bibliothèque · recherche **persistée** · sauvegarde auto au démarrage
- Onglets : **Tout fermer** · papier par défaut dans Paramètres
- Dates relatives sur les cartes · **Tout restaurer** en corbeille

### Panneaux
- Recherche, **Plan** (blocs texte de la page), OCR → page ou **Study Set**, audio + marqueurs, IA locale, **Study Sets** (révision SM-2), partage
- **Rubans** : révéler / masquer tout en mode lecture
- **Impression** : carnet entier (Ctrl+P ou 🖨)
- **Onglets** documents persistés au rechargement
- Partage : **révoquer** un lien de partage

### Données & sync
- IndexedDB, export/import **.forma.zip** (carnet : pages + study + audio + **versions**)
- Sauvegarde complète inclut **instantanés de pages**
- Corbeille avec **vider tout**
- Sauvegarde auto (quotidienne / hebdo), slot cloud local **+ restauration**
- Thème clair / sombre, onboarding

## Démarrage

```bash
npm install
npm run dev
```

## Raccourcis

| Touche | Action |
|--------|--------|
| P / H / E / L / T / M | Outils |
| Ctrl+C / V / D | Copier / coller / dupliquer sélection |
| Ctrl+Z / Ctrl+Shift+Z | Annuler / rétablir |
| Ctrl+Shift+D | Dupliquer la page |
| Espace + glisser | Déplacer la vue |
| ? | Aide raccourcis |
| Alt+← → | Changer de page |
| Ctrl+K | Palette — carnets, pages récentes, recherche globale |
| Cercle au stylo | Sélection lasso |

## Stack

React 19 · Vite · Dexie · pdf.js · Tesseract.js · JSZip · Zustand

## Roadmap

Sync cloud temps réel · Apps natives · Marketplace communautaire
