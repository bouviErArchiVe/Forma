# Limites connues — Forma 0.26.2

## Canvas & rendu

- **Layers** : 3 calques canvas au lieu des 10 cibles (addendum).
- **Dirty rectangles** : phase 2+ — gomme/sélection/overlay partiels ; métriques `partialAreaRatio` dans PerfHud.
- **Zoom / pan** : transform CSS — coût canvas nul ; pas de re-raster PDF au zoom.
- **Page pooling** : limite les montages `PageCanvas`, pas de réutilisation DOM d’un même canvas entre pages.
- **Export PDF** : raster par page (pdf-lib) ; PDF vectoriel séparé (`pdf-vector-export`).

### Export PDF — limites

| Aspect | Limite |
|--------|--------|
| Taille | Gros carnets = mémoire élevée (canvas 2× par page) |
| Bench dev | Paramètres → bench 50/100/200 pages ; advisory, non CI |
| Seuils recommandés | Reload éditeur < 30 s (1 page) ; export < 120 s (100 pages) sur desktop |
| Fond PDF | Raster haute rés ; pas de texte PDF sélectionnable dans l’export raster |
| Vectoriel | Option « PDF vectoriel » — traits/formes OK ; images rasterisées |
| E2E | Export carnet entier + multi-pages testés |

### Bench canvas (E2E advisory)

| Scénario | Seuil advisory |
|----------|----------------|
| 12 traits UI | draw < 120 s |
| 500 strokes IDB seed | reload < 45 s |
| 1000 strokes IDB seed | reload < 60 s |
| Pan / zoom / lasso | log console only |

## Données & sync

- **Import backup** : replace efface après sauvegarde auto ; merge non destructif.
- **`.forma v2`** : thumbnails remappés via `remapThumbnailKeys` ; fallback régénération si ID inconnu.
- **Sync cloud** : queue localStorage — pas de backend branché.

## Performance

- **SLA 60 FPS / 200 ms** : HUD dev ; non garanti sur 10k+ traits.
- **Bench CI** : warning advisory 1k/5k/10k segments — ne bloque pas le merge.

## PWA & déploiement

- **SW v9** : shell precache ; update via Paramètres.
- **Preview** : https://formacursor.vercel.app (branche `formacursor`).
- **E2E Playwright** : 20 tests Chromium (+ stroke seed bench, forma v2, render bench).

## Hors scope

- WebGL prod, sync realtime, IA connectée, app iOS native.

Voir [CONFORMITE.md](./CONFORMITE.md), [ARCHITECTURE.md](./ARCHITECTURE.md).