# Limites connues — Forma 0.25.1

## Canvas & rendu

- **Layers** : 3 calques canvas au lieu des 10 cibles (addendum).
- **Dirty rectangles** : phase 1 — clips encre sur trait live, drag sélection, rotation poignée ; lasso = overlay RAF uniquement (fond PDF non re-hydraté pendant lasso).
- **Zoom / pan** : transform CSS — coût canvas nul ; pas de re-raster PDF au zoom.
- **Page pooling** : limite les montages `PageCanvas`, pas de réutilisation DOM d’un même canvas entre pages.
- **Rotation sélection** : clavier `[` `]` + poignée souris (texte/image/sticker) ; traits/formes pivotent par points.
- **Export PDF** : raster par page (pdf-lib) ; PDF vectoriel séparé (`pdf-vector-export`) — fond raster, traits vectoriels.

### Export PDF — limites

| Aspect | Limite |
|--------|--------|
| Taille | Gros carnets = mémoire élevée (canvas 2× par page) |
| Fond PDF | Raster haute rés ; pas de texte PDF sélectionnable dans l’export raster |
| Vectoriel | Option « PDF vectoriel » — traits/formes OK ; images rasterisées |
| E2E | Export carnet entier testé (1 page + trait) |

## Données & sync

- **Import backup full** : mode `replace` efface tout après sauvegarde auto `.forma` + confirm ; mode `merge` non destructif.
- **Checksum `.forma`** : avertissement seulement si digest mismatch (non bloquant).
- **Sync cloud** : queue localStorage — pas de backend branché.
- **Supabase** : variables `.env` documentées ; **non connecté** en 0.25.x.

## Performance

- **SLA 60 FPS / 200 ms** : HUD dev ; non garanti sur 10k+ traits.
- **Bench CI** : warning advisory 1k/5k/10k (`scripts/stroke-bench-ci.mjs`) — ne bloque pas le merge.
- **Chunk pdf.js** : ~830 kB (warning Vite).

## PWA & déploiement

- **SW** : enregistré en prod uniquement (`import.meta.env.PROD`).
- **Production ArchNote** : https://forma-iota-six.vercel.app (`main`) — **ne pas confondre** avec preview `formacursor`.
- **Preview PWA** : projet Vercel séparé, branche `formacursor` — voir [DEPLOY.md](./DEPLOY.md).
- **E2E Playwright** : 13 tests Chromium (smoke, éditeur, backup, PDF import/export, multi-onglets).

## Hors scope

- App iOS native, formulaires PDF interactifs, WebGL prod, sync realtime, IA connectée.

Voir [CONFORMITE.md](./CONFORMITE.md), [ARCHITECTURE.md](./ARCHITECTURE.md).
