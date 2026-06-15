# FORMA_CONTEXT.md

# Forma — Contexte permanent du projet

## Identité du produit

Forma est une application web/PWA destinée aux étudiants en architecture, design, construction, gestion de projet et métiers liés au bâtiment.

Forma vise à devenir une plateforme complète combinant :

- prise de notes manuscrites et dessin ;
- carnets vectoriels ;
- documents ;
- tableaux ;
- moodboards ;
- calendrier académique ;
- tâches ;
- projets ;
- matières ;
- ressources architecture ;
- normes ;
- détails constructifs ;
- calculatrices ;
- convertisseurs ;
- dictionnaire ;
- traduction ;
- IA spécialisée ;
- bibliothèque de blocs ;
- import/export de documents.

L’objectif long terme est de faire de Forma un outil hybride entre :

- Goodnotes ;
- Concepts ;
- Freeform ;
- Notion ;
- Milanote ;
- un carnet d’architecture ;
- un assistant IA spécialisé architecture/construction/études.

## Stack technique

Stack connue :

- React
- Vite
- TypeScript
- Dexie / IndexedDB
- Zustand
- Canvas
- Vitest
- Playwright
- PWA offline-first

## Philosophie produit

Forma doit rester :

- rapide ;
- fluide ;
- offline-first ;
- utilisable sans cloud obligatoire ;
- cohérent visuellement ;
- stable ;
- testable ;
- maintenable ;
- extensible.

## Règles absolues

Ne jamais casser :

- `main` ;
- Dexie ;
- les migrations existantes ;
- les documents utilisateur ;
- les carnets ;
- le canvas ;
- la sauvegarde/reload ;
- FormAI ;
- Library ;
- Search ;
- PDF/import/export ;
- la corbeille ;
- les favoris ;
- les modules déjà validés ;
- les tests existants.

## Contraintes fortes

- Pas de migration destructive.
- Pas de refonte UI globale sans demande explicite.
- Pas de système parallèle si un système existant peut être étendu.
- Pas de cloud obligatoire.
- Pas de backend imposé.
- Pas de suppression de données existantes.
- Pas de réactivation de vieux code sans audit.
- Pas de faux contenus normatifs présentés comme officiels.
- Pas d’hallucination de codes/articles/normes.
- Toujours indiquer quand une vérification officielle est nécessaire.

## Style UI

Toujours rester proche du design actuel de Forma.

Les nouveaux modules doivent :

- utiliser les composants existants si possible ;
- respecter le style visuel courant ;
- avoir un header clair ;
- avoir un état vide utile ;
- avoir une navigation de retour ;
- être compatibles dark mode ;
- éviter les boutons morts ;
- éviter les pages blanches.

## Vision d’usage

L’utilisateur doit pouvoir :

- ouvrir Forma ;
- voir son dashboard ;
- retrouver ses matières ;
- suivre ses tâches ;
- gérer ses projets ;
- ouvrir ses documents ;
- dessiner ;
- insérer des blocs ;
- consulter des normes ;
- utiliser des formules ;
- importer des documents ;
- demander de l’aide à FormAI ;
- rechercher dans tout son écosystème ;
- tout retrouver après reload.
