# Format `.forma` v2 — thumbnails optionnels

**Version app** : 0.25.2 · **Compatibilité v1** : import v1 inchangé

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

- `formatVersion === 2` lu comme v1 + fichiers thumb disponibles
- UI peut charger `thumbnails/{id}.png` du ZIP avant régénération
- Fallback : `thumb-queue` local (comportement v1)

## Limites

- Pas de thumb carnet obligatoire en v2.0
- Digest SHA-256 inclut les PNG thumb si présents
