# Limites connues — Forma 0.24.0

## Canvas & rendu

- **Layers** : 3 calques canvas au lieu des 10 cibles (addendum).
- **Dirty rectangles** : partiel ; fond PDF non re-hydraté pendant lasso (RAF overlay).
- **Page pooling** : limite les montages `PageCanvas`, pas de réutilisation DOM d’un même canvas entre pages.
- **Rotation sélection** : clavier uniquement ; pas de poignée souris ; textes/images pivotent position seule
- **Export PDF** : vectoriel partiel ; fond de page raster.

## Données & sync

- **Import backup full** : mode `replace` efface tout après sauvegarde auto `.forma` ; mode `merge` non destructif
- **Checksum `.forma`** : avertissement seulement si digest mismatch (non bloquant).
- **Sync cloud** : queue localStorage (`pending` → `applied` en simulation) ; statuts `synced` / `failed` et API décrits dans [SYNC_API.md](./SYNC_API.md) — pas de backend.
- **Sync queue** : max **500** ops, purge **30 jours** ; pas d’envoi réseau.
- **fake-indexeddb** : blobs Dexie mal sérialisés en test Node ; prod navigateur OK.

## Performance

- **SLA 60 FPS / 200 ms** : mesurés HUD dev, non garantis sur gros docs.
- **Chunk pdf.js** : ~830 kB (warning Vite).

## PWA

- **SW** : enregistré en prod uniquement (`import.meta.env.PROD`).
- **E2E Playwright** : smoke seulement (pas dessin/refresh/import en CI pour l’instant)
- **Icônes PNG** : générées via `npm run icons` si absentes en dev.

## Hors scope

- App iOS native, formulaires PDF interactifs, Pomodoro, sync cloud réelle.

Voir [CONFORMITE.md](./CONFORMITE.md).
