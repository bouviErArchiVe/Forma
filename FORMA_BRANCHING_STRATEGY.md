# FORMA_BRANCHING_STRATEGY.md

# Forma — Stratégie Git / Branches

## Branche stable

`main` est la branche stable.

Ne jamais :

- force push sur `main` ;
- merger une branche non testée ;
- lancer un gros pack directement sur `main`.

## Branches de feature

Format :

```bash
feat/<nom-du-pack>
```

Exemples :

```bash
feat/compliance-checker
feat/hatch-library
feat/technical-symbols
feat/architecture-templates
feat/drawing-dimensions
```

## Branches de domaine possibles

Pour gros développement parallèle :

```bash
dev/architecture
dev/drawing
dev/academic
dev/formai
```

Mais préférer des branches `feat/*` courtes si possible.

## Début d’un pack

```bash
git checkout main
git pull origin main
git checkout -b feat/<pack>
```

## Commit

Message clair :

```bash
git commit -m "feat: add <feature>"
```

ou :

```bash
git commit -m "fix: stabilize <system>"
```

ou :

```bash
git commit -m "docs: add <documentation>"
```

## Push

```bash
git push origin feat/<pack>
```

## Merge après validation

```bash
git checkout main
git pull origin main
git merge feat/<pack>
git push origin main
```

## Si conflit

Ne pas résoudre à l’aveugle.

Faire :

1. lire les fichiers en conflit ;
2. comprendre les deux côtés ;
3. préserver tests ;
4. relancer build ;
5. relancer QA.

## Si une branche devient trop grosse

Couper en sous-branches :

```bash
feat/architecture-resources
feat/architecture-ui
feat/architecture-search
```

## Historique

Toujours noter dans `FORMA_STATE.md` après gros merge :

- branche ;
- commit ;
- tests ;
- modules ajoutés ;
- limites restantes.
