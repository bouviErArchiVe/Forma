# 🚀 Guide de déploiement FORMA — Étape par étape

## Tout est gratuit. Ça prend environ 15 minutes.

---

## ÉTAPE 1 — Créer ton compte GitHub (si pas déjà fait)

1. Va sur [github.com](https://github.com)
2. Crée un compte gratuit
3. Crée un nouveau repository appelé `forma`
4. Mets-le en **Public** (requis pour Vercel gratuit)

---

## ÉTAPE 2 — Créer ton projet Supabase

1. Va sur [supabase.com](https://supabase.com)
2. **New Project** → choisis un nom (ex: `forma`)
3. Note bien ton **mot de passe de base de données**
4. Attends ~2 minutes que le projet se crée
5. u&e&Pbgfeq-m5EJ

### Configurer la base de données
1. Dans ton projet Supabase, clique **SQL Editor**
2. Copie tout le commentaire SQL en bas de `src/lib/supabase.js`
3. Colle-le dans l'éditeur SQL et clique **Run**
4. Tu devrais voir "Success. No rows returned"

### Récupérer tes clés API
1. Va dans **Settings > API**
2. Copie **Project URL** → c'est ton `VITE_SUPABASE_URL`
3. Copie **anon public** → c'est ton `VITE_SUPABASE_ANON_KEY`

### Activer l'auth Google (optionnel mais recommandé)
1. **Authentication > Providers > Google**
2. Suis le guide pour créer un projet Google OAuth
3. Colle tes Client ID et Secret

---

## ÉTAPE 3 — Uploader le code sur GitHub

```bash
# Dans le dossier forma/
git init
git add .
git commit -m "🏛 Initial FORMA commit"
git branch -M main
git remote add origin https://github.com/TON_USERNAME/forma.git
git push -u origin main
```

---

## ÉTAPE 4 — Déployer sur Vercel

1. Va sur [vercel.com](https://vercel.com)
2. **New Project** → importe ton repo GitHub `forma`
3. Framework Preset: **Vite**
4. Dans **Environment Variables**, ajoute :
   - `VITE_SUPABASE_URL` = ton URL Supabase
   - `VITE_SUPABASE_ANON_KEY` = ta clé anon
5. Clique **Deploy**

🎉 En 2 minutes, ton app est en ligne à `forma-xxx.vercel.app` !

---

## ÉTAPE 5 — Domaine personnalisé (optionnel, gratuit)

### Option A — Freenom (domaine .tk ou .ml gratuit)
1. [freenom.com](https://freenom.com) → cherche `forma.tk`
2. Configure les DNS vers Vercel

### Option B — .app via GitHub Student Pack
Si tu es étudiant, [education.github.com](https://education.github.com) donne des crédits chez Name.com

### Option C — reste sur vercel.app
`forma.vercel.app` c'est parfait pour commencer !

---

## ÉTAPE 6 — Installer sur iPad

1. Ouvre ton URL dans **Safari** sur iPad
2. Bouton Partager → **Sur l'écran d'accueil**
3. L'icône FORMA apparaît — c'est une PWA installée !

---

## Mises à jour futures

À chaque fois que tu modifies du code :
```bash
git add .
git commit -m "✨ Nouvelle fonctionnalité"
git push
```
Vercel redéploie automatiquement en ~30 secondes. ✅

---

## Limites du plan gratuit

| Service | Limite | Dépasse quand |
|---------|--------|---------------|
| Vercel | 100GB bande passante/mois | ~100 000 visites/mois |
| Supabase | 500MB DB, 1GB storage | ~5000 utilisateurs actifs |
| Supabase Realtime | 500 connexions simultanées | Grande école |

**Pour passer à l'échelle** : Supabase Pro = 25$/mois, Vercel Pro = 20$/mois.
Mais pour démarrer, le gratuit tient largement.
