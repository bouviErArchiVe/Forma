# FORMA — Addendum technique critique

Document de référence pour l’architecture et les contraintes de développement. Complète le cahier des charges principal.

## Décisions clés

- **Produit** : PWA web premium, local-first, offline-first — **pas d’app iOS native au lancement**
- **Référence UX** : iPad Safari (Add to Home Screen, Pencil, plein écran)
- **Deuxième cible** : Chrome / Edge Windows (souris, clavier, stylet)
- **Mobile** : secondaire (consultation, annotation légère)
- **Moteur** : Canvas 2D (WebGL / PixiJS = futur)
- **Refactor** : architecture `features/` = long terme ; **stabiliser avant refactoriser**

## PWA obligatoire

- Service Worker : shell cache-first, assets stale-while-revalidate
- `manifest.json` : `standalone`, icônes, `theme_color`
- Enregistrement SW en production (`main.tsx`)

## Canvas

- Coordonnées : screen / world (page) / PDF
- Layers cibles (ordre) : fond → template → PDF → images → strokes → surligneur → formes → texte → sélection → UI
- Dirty rectangles : objectif (rerendu partiel)
- Strokes : split si > 10 s ou > 5000 points ; points avec `tiltX` / `tiltY`
- Export PDF : vectoriel cible (progressif)

## Format `.forma` (cible)

ZIP avec `manifest.json`, `pages/`, `strokes/`, `assets/` (blobs, pas dataURL en base).

Migration depuis `backup.json` v4 prévue.

## PDF

- Import lazy : pas de rasterisation de toutes les pages
- Rendu à la demande via `pdfSourceDataUrl` + `pdfPageIndex`
- Cache viewport, DPR-aware
- Formulaires PDF : hors scope

## Autosave

- Debounce **2 s** après modification
- Flush : fermeture document, `visibilitychange` hidden
- UI : Enregistrement… / Enregistré / Erreur

## Performance (objectifs)

- 60 FPS iPad récent, changement page < 200 ms, PDF 200 pages, 10 000 strokes/page
- Virtualisation pages en vue continue

## Priorités actuelles (§17)

1. Optimisation PDF / lazy loading
2. Performance gros documents
3. Stabilité viewport
4. Architecture autosave
5. Virtualisation pages
6. Export (2× PNG minimum)
7. Moteur sélection
8. Squelette sync future
9. Optimisation mémoire

## Fonctionnalités existantes (à documenter)

Whiteboard, Study Sets / flashcards (SM-2), mode lecture, présentation, quick note, presets stylo, favoris pages ★, palette commandes (Ctrl+K), export SVG vecteur.

**Note** : Pomodoro n’est pas implémenté — retiré de la liste « existant » jusqu’à livraison.

Voir [CONFORMITE.md](./CONFORMITE.md) pour le suivi spec ↔ code.
