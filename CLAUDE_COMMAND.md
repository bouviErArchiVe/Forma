# Commande à envoyer à Claude

Crée ces fichiers à la racine du repo, puis commit-les seuls.

```bash
git checkout main
git pull origin main
git checkout -b docs/forma-guide-system-pro

git add FORMA_CONTEXT.md FORMA_STATE.md FORMA_MASTER_ROADMAP.md FORMA_WORKFLOW.md FORMA_ARCHITECTURE_RULES.md FORMA_AGENT_PROMPT_TEMPLATE.md FORMA_QA_RELEASE_CHECKLIST.md FORMA_BRANCHING_STRATEGY.md FORMA_PACKS_NEXT.md FORMA_RISK_REGISTER.md README_FORMA_GUIDE_SYSTEM.md

git commit -m "docs: add Forma pro guide system"
git push origin docs/forma-guide-system-pro
```

Ensuite, pour chaque nouveau pack, commencer le prompt par :

```text
Lis d’abord :
- FORMA_CONTEXT.md
- FORMA_STATE.md
- FORMA_MASTER_ROADMAP.md
- FORMA_WORKFLOW.md
- FORMA_ARCHITECTURE_RULES.md
- FORMA_QA_RELEASE_CHECKLIST.md
- FORMA_RISK_REGISTER.md

Utilise ces fichiers comme source de vérité permanente du projet Forma.
Travaille uniquement sur le pack demandé.
```
