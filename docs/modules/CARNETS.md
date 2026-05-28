# Module Carnets (Editor) — statut

Route : `/editor/:id`

## Fonctionnel
- Dessin (stylo, surligneur, formes, texte, gomme 3 modes)
- Calques (visibilité, verrou, opacité, réordre)
- Pages (+ / dupliquer / supprimer / menu ⋯)
- Sauvegarde auto local-first (`useAutoSave`)
- Bibliothèque structurale + images importées
- Lasso traits + objets bibliothèque/images
- Déplacement groupé objets sélectionnés (lasso)
- Export PNG, mode focus, iPad (sidebar + bottom toolbar)
- Mode lecture seule (collab)
- Formats page (A0–A6, B4/B5, Letter, Legal, carré, personnalisé mm/cm/po, infini)
- Application immédiate du format à la page courante (panneau Pages, Style de page, menu ⋯)
- Format par défaut pour les nouvelles pages (panneau Pages)
- Poignées resize/rotation : formes canvas (line, flèche, cote, rect, cercle, bulle, texte), éléments bibliothèque, images importées

## Reste à compléter (prochains packs)
- Dictée vocale intégrée canvas
- Tests iPad réels device

## Validation
```bash
npm run build
node scripts/qa-smoke.mjs http://127.0.0.1:5173
```
