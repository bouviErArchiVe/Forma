# FORMA_WORKFLOW.md

# Forma — Workflow permanent de développement

Ce fichier définit la méthode obligatoire à suivre par Claude Code.

## Règle principale

Ne jamais transformer un pack ciblé en refonte globale.

Toujours :

1. comprendre le pack demandé ;
2. lire les fichiers guide ;
3. vérifier l’état réel du repo ;
4. auditer seulement les zones concernées ;
5. minimiser les modifications ;
6. ajouter tests ;
7. build ;
8. QA navigateur ;
9. rapport final ;
10. attendre validation avant merge.

## Début obligatoire de chaque pack

```bash
git checkout main
git pull origin main
git status
```

Puis :

```bash
git checkout -b feat/<nom-du-pack>
```

## Taille idéale d’un pack

Un bon pack doit avoir :

- 1 domaine principal ;
- 4 à 6 agents logiques maximum ;
- peu de fichiers partagés ;
- un risque limité ;
- des tests ciblés ;
- une QA navigateur claire.

Si un pack commence à toucher :

- Dexie ;
- Library ;
- Search ;
- Dashboard ;
- Canvas ;
- FormAI ;
- routes ;
- PDF ;

alors il faut être particulièrement prudent.

## Méthode multi-agent recommandée

Même si Claude travaille seul, il doit structurer son travail comme plusieurs agents :

### Agent 1 — Audit

- lire les fichiers concernés ;
- identifier les risques ;
- décider architecture.

### Agent 2 — Data / types

- types ;
- services ;
- migrations ;
- tests unitaires.

### Agent 3 — UI

- pages ;
- composants ;
- navigation.

### Agent 4 — Intégrations

- Search ;
- FormAI ;
- Library ;
- Dashboard.

### Agent 5 — QA/tests

- tests ;
- build ;
- Playwright ;
- navigateur.

### Agent 6 — Rapport

- résumé ;
- limites ;
- commit ;
- PR.

## Commandes obligatoires

```bash
npm run test -- --run
npm run build
npx playwright test
```

Si lint complet est instable à cause d’erreurs préexistantes :

- lancer lint ciblé sur les fichiers modifiés ;
- noter explicitement les erreurs préexistantes ;
- ne pas corriger hors scope sauf si très simple et sans risque.

## QA navigateur obligatoire

Chaque pack doit tester en navigateur réel :

- ouverture page ;
- flow principal ;
- sauvegarde/reload si données ;
- console ;
- navigation ;
- état vide ;
- erreur/fallback.

## Rapport final obligatoire

Le rapport final doit contenir :

- branche ;
- commit ;
- PR ;
- fichiers modifiés ;
- fonctionnalités livrées ;
- tests ajoutés ;
- build ;
- Playwright ;
- QA navigateur ;
- bugs corrigés ;
- limites restantes ;
- risques ;
- recommandation de merge.

## Merge

Ne jamais merger sans validation.

Après validation :

```bash
git checkout main
git pull origin main
git merge feat/<nom-du-pack>
git push origin main
```

## Si un agent touche sa limite

Ne pas abandonner.

Faire :

1. inventaire du working tree ;
2. lire les fichiers partiels ;
3. corriger les erreurs ;
4. continuer méthodiquement ;
5. tester ;
6. rapporter honnêtement.
