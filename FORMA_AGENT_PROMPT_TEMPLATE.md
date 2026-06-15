# FORMA_AGENT_PROMPT_TEMPLATE.md

# Template de prompt pour Claude Code

Copier-coller ce template pour chaque nouveau pack.

---

Lis d’abord :

- `FORMA_CONTEXT.md`
- `FORMA_STATE.md`
- `FORMA_MASTER_ROADMAP.md`
- `FORMA_WORKFLOW.md`
- `FORMA_ARCHITECTURE_RULES.md`
- `FORMA_QA_RELEASE_CHECKLIST.md`
- `FORMA_RISK_REGISTER.md`

Utilise ces fichiers comme source de vérité permanente du projet Forma.

## Pack demandé

Nom du pack :

`<NOM_DU_PACK>`

Objectif :

`<OBJECTIF_CLAIR>`

## Contraintes

- Ne casse pas `main`.
- Ne casse pas Dexie.
- Ne casse pas les documents existants.
- Ne casse pas Canvas.
- Ne casse pas FormAI.
- Ne casse pas Library.
- Ne casse pas Search.
- Ne casse pas PDF/import/export.
- Pas de migration destructive.
- Pas de refonte UI globale.
- Réutilise les systèmes existants.
- Travaille en autonomie.
- Demande validation uniquement si risque destructif.

## Organisation multi-agent

### Agent 1 — Audit

- lire les fichiers concernés ;
- identifier architecture existante ;
- identifier risques ;
- décider stratégie minimale.

### Agent 2 — Data / services

- types ;
- services ;
- migrations si nécessaire ;
- tests unitaires.

### Agent 3 — UI

- composants ;
- pages ;
- empty states ;
- navigation ;
- responsive simple.

### Agent 4 — Intégrations

- Search ;
- FormAI ;
- Library ;
- Dashboard ;
- relations modules.

### Agent 5 — Tests / QA

- tests ;
- build ;
- Playwright ;
- QA navigateur ;
- console.

### Agent 6 — Rapport

- résumé ;
- fichiers ;
- tests ;
- limites ;
- commit ;
- PR.

## Commandes

```bash
git checkout main
git pull origin main
git checkout -b feat/<nom-du-pack>

npm run test -- --run
npm run build
npx playwright test
```

## Commit

```bash
git status
git add .
git commit -m "<message clair>"
git push origin feat/<nom-du-pack>
```

## Rapport attendu

Fournir :

1. branche ;
2. commit ;
3. PR ;
4. fonctionnalités ;
5. fichiers modifiés ;
6. tests ;
7. QA navigateur ;
8. limites ;
9. bugs restants ;
10. recommandation de merge.

## Critère final

Le pack est réussi si :

- flow utilisateur principal fonctionne ;
- reload ne perd rien ;
- console propre ;
- build vert ;
- tests verts ;
- architecture cohérente ;
- aucune régression majeure.
