# Ce que j'ai fait sur ton projet — à lire en premier

Ce document explique le rangement effectué sur FORMA. Rien n'a été
supprimé : tout ce qui a été retiré du projet a été déplacé dans le dossier
`_archive/`.

---

## 1. Rangement effectué

Ces éléments encombraient le projet et faisaient perdre des tokens à Claude
Code (qui lisait des doublons et ne savait plus quel code était le bon). Ils
sont maintenant dans `_archive/` :

| Élément déplacé                | Pourquoi                                |
|--------------------------------|-----------------------------------------|
| `temp_update/`                 | Copie partielle et ancienne du projet   |
| `public/forma_update/`         | Copie en double, mal placée dans public/|
| `old.patch`                   | Vieux fichier de patch, inutile         |
| `old/` (dossier vide)         | Dossier vide créé par erreur            |
| `main`, `vite`, `forma@1.0.0` | Fichiers vides créés par erreur         |

Le vrai projet (`src/`, `public/themes/`, et tous les fichiers de config)
n'a pas été touché : il était déjà bien rangé.

Tu peux supprimer `_archive/` toi-même plus tard, une fois certain de ne plus
en avoir besoin. Je ne l'ai pas fait par précaution.

## 2. Skill ajouté

Un skill sur mesure a été créé dans :

```
.claude/skills/forma-builder/
  SKILL.md
  references/
    steel-profiles.md
    wood-studs.md
```

Claude Code lit automatiquement ce dossier. Le skill décrit ta vraie stack
(React + Vite + Supabase, en JavaScript), ta vraie arborescence, tes
conventions et ta feuille de route. Résultat : Claude Code n'a plus besoin de
redécouvrir le projet à chaque session — ça économise des tokens.

## 3. IMPORTANT — Répare ton fichier .env.local

Ton fichier `.env.local` est cassé. Il contient actuellement ceci :

```
https://pwkvajyxbbxmmhktbupp.supabase.co
process.env.SUPABASE_KEY
```

Ce n'est pas le bon format : ton application ne peut pas le lire. Il doit
ressembler à `.env.example`, avec des noms de variables. Voici ce qu'il faut
mettre à la place :

```
VITE_SUPABASE_URL=https://pwkvajyxbbxmmhktbupp.supabase.co
VITE_SUPABASE_ANON_KEY=ta_vraie_cle_anon_publique
VITE_APP_URL=http://localhost:5173
```

Pour récupérer ta vraie clé : va sur supabase.com, ouvre ton projet, puis
**Settings > API**, et copie la clé appelée « anon public ». Colle-la à la
place de `ta_vraie_cle_anon_publique`.

Fais cette correction toi-même, directement sur ton ordinateur. Ne partage
jamais ce fichier `.env.local` (il est déjà ignoré par Git, c'est bien).

## 4. Pour remettre le projet en route sur ton ordinateur

Le zip ne contient pas `node_modules/` (c'est normal, il se régénère). Dans
ton terminal, place-toi dans le dossier du projet et tape :

```
npm install
npm run dev
```

Puis ouvre http://localhost:5173 dans ton navigateur.

## 5. Comment travailler maintenant pour économiser tes crédits

1. Garde le terminal `npm run dev` ouvert pendant que tu travailles.
2. Ouvre Claude Code dans le dossier du projet.
3. Demande **une seule fonctionnalité à la fois**, en étant précis sur le
   fichier concerné. Exemple :
   « Dans EditorPage.jsx, ajoute le sélecteur de police pour l'outil texte,
   en suivant le skill forma-builder et le NEXT_VERSION_PLAN.md. »
4. Teste dans le navigateur, puis passe à la fonctionnalité suivante.

Évite les demandes larges du type « fais toute la refonte UI » : c'est ce qui
brûle le plus de crédits.
