# FORMA_QA_RELEASE_CHECKLIST.md

# Forma — Checklist QA / Release

Utiliser cette checklist avant chaque commit important et avant chaque merge.

## 1. Git

```bash
git status
git branch --show-current
```

Vérifier :

- branche correcte ;
- pas de fichiers inattendus ;
- pas de données générées inutiles ;
- pas de secrets.

## 2. Tests

```bash
npm run test -- --run
```

Vérifier :

- tous les tests passent ;
- nouveaux tests ajoutés si logique nouvelle ;
- aucun test ignoré sans raison.

## 3. Build

```bash
npm run build
```

Vérifier :

- build production vert ;
- pas d’erreur TypeScript ;
- pas de crash bundle.

## 4. Playwright

```bash
npx playwright test
```

Vérifier :

- tests e2e verts ;
- artefacts teardown distingués des vrais échecs ;
- noter les erreurs environnementales si connues.

## 5. Lint

Si possible :

```bash
npm run lint
```

Sinon lint ciblé :

```bash
npx eslint <fichiers-modifiés>
```

Vérifier :

- nouveaux fichiers propres ;
- erreurs préexistantes documentées ;
- pas de nouveau warning critique.

## 6. QA navigateur

Tester manuellement :

- ouverture app ;
- route du nouveau module ;
- état vide ;
- action principale ;
- sauvegarde/reload ;
- recherche si intégrée ;
- FormAI si intégré ;
- suppression/restauration si données ;
- retour navigation ;
- console.

## 7. Console

La console doit être propre.

Zéro :

- exception ;
- warning React nouveau ;
- key duplicate ;
- crash route ;
- erreur Dexie ;
- erreur canvas.

## 8. Persistance

Si données :

- créer élément ;
- reload ;
- vérifier présent ;
- modifier ;
- reload ;
- supprimer/restaurer si applicable.

## 9. Search

Si contenu indexable :

- créer contenu ;
- rechercher titre ;
- rechercher mot clé ;
- vérifier section de résultats.

## 10. FormAI

Si FormAI impliqué :

- mode local ;
- absence clé API ;
- message honnête ;
- confirmation avant création ;
- pas d’hallucination normative.

## 11. Normes / conformité

Toujours vérifier présence du texte :

> À vérifier dans le texte officiel. Résultat indicatif.

## 12. Rapport final

Le rapport doit inclure :

- branche ;
- commit ;
- PR ;
- tests ;
- build ;
- Playwright ;
- QA ;
- limites ;
- prochain pack recommandé.
