# FORMA_RISK_REGISTER.md

# Forma — Registre des risques

## Risque 1 — Dexie / migrations

Impact : très élevé.

Toute migration destructive peut perdre les données utilisateur.

Mesures :

- migrations additives ;
- tests de schéma ;
- champs optionnels ;
- backup logique ;
- QA reload.

## Risque 2 — Canvas

Impact : très élevé.

Le canvas supporte dessin, images, blocs, détails, export.

Mesures :

- éviter refactor non nécessaire ;
- réutiliser ImageElement ;
- tester dessin + sélection + reload ;
- tester export si touché.

## Risque 3 — Library

Impact : élevé.

Library est le centre utilisateur.

Mesures :

- ne pas casser création ;
- ne pas casser favoris ;
- ne pas casser corbeille ;
- ne pas casser filtres.

## Risque 4 — Search

Impact : moyen/élevé.

Search indexe beaucoup de contenus.

Mesures :

- extractions légères ;
- tests ;
- éviter gros JSON bruts ;
- conserver sections existantes.

## Risque 5 — FormAI hallucinations

Impact : élevé pour normes/conformité.

Mesures :

- avertissements ;
- mode local honnête ;
- pas d’articles inventés ;
- confirmation avant actions.

## Risque 6 — Trop gros packs

Impact : élevé.

Les packs géants créent conflits, limites de session, erreurs.

Mesures :

- limiter 4–6 agents ;
- 1 domaine ;
- tests fréquents ;
- branches courtes.

## Risque 7 — UI incohérente

Impact : moyen.

Mesures :

- réutiliser composants ;
- respecter style Forma ;
- empty states ;
- dark mode.

## Risque 8 — Performance

Impact : moyen/élevé.

Mesures :

- éviter gros calculs au render ;
- lazy load ;
- caches bornés ;
- workers si nécessaire ;
- tests documents lourds.

## Risque 9 — Contenu normatif faux

Impact : élevé.

Mesures :

- fiches synthétiques ;
- niveau de confiance ;
- mention officielle ;
- pas de faux articles ;
- FormAI prudent.

## Risque 10 — Surdéveloppement

Impact : moyen.

Forma a déjà beaucoup de modules.  
Le risque est d’ajouter trop sans relier.

Mesures :

- privilégier intégrations ;
- dashboard ;
- search ;
- relations ;
- QA utilisateur.
