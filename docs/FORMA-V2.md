# Format `.forma` v2 — thumbnails optionnels

**Version app** : 0.26.0 · **Compatibilité v1** : import v1 inchangé

## Changements v2

| Élément | v1 | v2 |
|---------|----|----|
| `manifest.formatVersion` | `1` | `2` |
| Thumbnails | absents (régénération locale) | `thumbnails/{pageId}.png` optionnels |
| Payload pages/assets | identique | identique |

## Export

```typescript
import { exportLibraryFormaPackage } from './forma-package'

await exportLibraryFormaPackage(payload, { includeThumbnails: true })
```

- Génère PNG ~35 % échelle via `renderFullPage`
- Échec vignette = skip (export continue)

## Import

- `formatVersion === 2` → `ImportFormaResult.format === 'forma-v2'`
- `extractFormaThumbnailsFromZip` + `seedImportedPageThumbnails` après écriture Dexie
- Précharge `sidebarThumbQueue` + couverture `libraryThumbQueue` (1re page par carnet)
- Fallback : `thumb-queue` régénère si thumb absent ou IDs remappés (merge)

## Limites

- Pas de thumb carnet obligatoire en v2.0
- Digest SHA-256 inclut les PNG thumb si présents
