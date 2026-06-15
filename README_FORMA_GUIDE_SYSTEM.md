# FORMA GUIDE SYSTEM PRO

Ce dossier contient les fichiers de pilotage permanents du projet Forma.

## Objectif

Ces fichiers servent de mémoire longue durée et de cadre de travail pour Claude Code, Codex, Cursor ou tout autre agent de développement.

Ils doivent être placés à la racine du repo Forma.

## Fichiers

- `FORMA_CONTEXT.md` : identité du projet, stack, règles absolues, vision produit.
- `FORMA_STATE.md` : état réel connu de Forma, modules déjà construits, branches/commits importants, zones sensibles.
- `FORMA_MASTER_ROADMAP.md` : roadmap long terme structurée par grands packs.
- `FORMA_WORKFLOW.md` : méthode de développement obligatoire.
- `FORMA_ARCHITECTURE_RULES.md` : règles techniques et contraintes d’architecture.
- `FORMA_AGENT_PROMPT_TEMPLATE.md` : prompt de départ à utiliser pour chaque nouveau pack.
- `FORMA_QA_RELEASE_CHECKLIST.md` : checklist QA, tests, build, navigateur, merge.
- `FORMA_BRANCHING_STRATEGY.md` : branches, commits, PR, merge, protection de main.
- `FORMA_PACKS_NEXT.md` : prochains packs recommandés à partir de l’état actuel.
- `FORMA_RISK_REGISTER.md` : risques techniques et produit à surveiller.

## Utilisation

À chaque nouveau prompt envoyé à Claude Code, commencer par :

```text
Lis d’abord :
- FORMA_CONTEXT.md
- FORMA_STATE.md
- FORMA_MASTER_ROADMAP.md
- FORMA_WORKFLOW.md
- FORMA_ARCHITECTURE_RULES.md
- FORMA_QA_RELEASE_CHECKLIST.md

Utilise ces fichiers comme source de vérité du projet.
Travaille uniquement sur le pack demandé.
Ne casse pas main, Dexie, Canvas, FormAI, Library, Search, PDF, sauvegarde/reload.
```

## Règle importante

Ces fichiers ne remplacent pas l’audit du code réel.  
Ils servent à éviter de refaire le contexte à chaque session, mais Claude doit toujours vérifier les fichiers concernés avant de modifier.
