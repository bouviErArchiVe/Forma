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

## Reste à compléter (prochains packs)
- Resize/rotation poignées sur tous types d’éléments
- Dictée vocale intégrée canvas
- Formats page avancés (perso mm)
- Tests iPad réels device

## Validation
```bash
npm run build
node scripts/qa-smoke.mjs http://127.0.0.1:5173
```
