# PWA — Forma offline

## Composants

| Fichier | Rôle |
|---------|------|
| `public/manifest.json` | Standalone, theme, icônes maskable |
| `public/sw.js` | Precache shell, network-first HTML, cache-first assets |
| `src/lib/pwa.ts` | Enregistrement SW, update flow (SKIP_WAITING) |
| `src/components/OfflineBanner.tsx` | Indicateur hors-ligne |

## Flux offline

1. **Première visite online** — SW installe, precache `index.html`, JS/CSS
2. **Visite offline** — shell servi depuis cache ; app charge depuis IndexedDB (Dexie)
3. **Édition offline** — autosave local (debounce 2s) ; sync cloud **non branchée**
4. **Refresh offline** — OK si SW actif ; sinon page d’erreur navigateur

## Mise à jour

- Nouveau déploiement Vercel → SW détecte `waiting` worker
- Paramètres → « Mettre à jour » envoie `SKIP_WAITING` puis reload
- **Non destructif** : IndexedDB conservée entre updates

## Preview Vercel

- Branche `formacursor` → **https://formacursor.vercel.app**
- Production ArchNote (`main`) → **https://forma-iota-six.vercel.app** (ne pas modifier)

## Limites connues

| Limite | Détail |
|--------|--------|
| Taille cache SW | Pas de precache des chunks lazy PDF/OCR |
| iOS Safari | Install PWA limitée ; quota storage variable |
| Multi-onglets | Verrou localStorage, pas sync cloud |
| Export PDF offline | OK si moteur déjà chargé ; import PDF nécessite réseau initial pour pdf.js worker |

## Tests manuels recommandés

1. DevTools → Offline → refresh éditeur → dessiner → refresh → persistance
2. Installer PWA Windows/iPad → ouvrir sans réseau
3. Déployer preview → vérifier bannière update après 2e visite
