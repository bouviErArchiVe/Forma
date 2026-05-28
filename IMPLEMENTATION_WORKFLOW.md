# Forma — Workflow d'implémentation obligatoire

## Règle
Aucune mise à jour partielle. Chaque pack doit être exécuté et validé en entier.

## Méthode (6 étapes)
1. Lire **tout** le pack avant modification.
2. Créer une checklist interne complète.
3. Exécuter **chaque** point.
4. Vérifier **chaque** point après implémentation.
5. Tester réellement (build + navigation + console).
6. Ne pas marquer terminé sans validation.

## Interdictions
- Ignorer silencieusement une étape
- UI sans logique derrière
- Boutons morts / placeholders cassés
- « Terminé » sans test

## Validation avant commit
- [ ] Chaque point du pack coché
- [ ] `npm run build` OK
- [ ] Navigation modules concernés
- [ ] Pas d'erreur console critique
- [ ] Sauvegarde locale si applicable

## Rapport obligatoire post-pack
1. Tâches terminées
2. Tâches restantes + raison
3. Bugs rencontrés
4. Limites techniques
5. Modules testés
