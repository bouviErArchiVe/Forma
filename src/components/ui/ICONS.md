# Icônes UI (`Icon.tsx`)

Set restreint d'icônes SVG inline (24x24, `stroke="currentColor"`, style "Lucide-like")
pour remplacer progressivement les emoji utilisés comme chrome UI (boutons, headers, menus).

## Usage

```tsx
import { Icon } from '../components/ui/Icon'

<Icon name="settings" className="w-4 h-4" />
<Icon name="star" className="w-3.5 h-3.5 text-amber-400" />
```

## Icônes disponibles

| name | usage typique |
| --- | --- |
| `settings` | réglages, options |
| `close` | fermer un panneau/dialogue |
| `star` / `star-outline` | favori plein / vide |
| `trash` | corbeille, supprimer |
| `search` | recherche |
| `sparkles` | assistant IA |
| `undo` / `redo` | annuler / rétablir |
| `copy` | copier dans le presse-papiers |
| `sun` / `moon` | thème clair / sombre |
| `folder` | dossier, bibliothèque vide |
| `plus` | ajouter / créer |
| `chevron-up/down/left/right` | navigation, menus déroulants |
| `check` | succès, validation |
| `alert` | avertissement, erreur |
| `cloud` / `monitor` | IA cloud / IA locale |
| `help` | aide, "?" |
| `edit` | renommer, modifier |
| `more-horizontal` | menu overflow "···" |
| `book` | carnet manuscrit |
| `layout` | whiteboard, modèles de page |
| `file-text` | document texte (FormaDoc) |
| `table` | tableau (FormaTab) |
| `image` | moodboard, images |
| `zap` | note rapide |
| `upload` | import de fichier (PDF, .forma) |
| `keyboard` | raccourcis clavier |

## Dette résiduelle

Le reste de l'app garde encore des emoji (✦ ☁ 💻 🔒 📐 ⚡ etc.) — voir le rapport
de la passe A9 pour la liste par fichier. À traiter dans une passe ultérieure (A9-bis).
