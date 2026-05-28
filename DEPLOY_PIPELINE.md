# Forma — Pipeline Git / Vercel (vérifié 2026-05-28)

## Résumé

| Élément | Valeur |
|---------|--------|
| Branche active | `main` |
| Repo Git (origin) | https://github.com/bouviErArchiVe/forma |
| Dernier commit | `63ea6602` — chore: define final Forma development direction |
| Push | ✅ Synchronisé (`origin/main` = local) |
| Build local | ✅ `npm run build` OK |
| Projet Vercel | `erwan-bouvier-s-projects/forma` |
| **URL production** | **https://forma-iota-six.vercel.app** |
| Dernier déploiement | Ready (~30 min après push) |
| Modules en prod | ✅ FormaHub, FormaMessage, FormaDico détectés dans le bundle JS |

## ⚠️ Cause probable si « le site ne se met pas à jour »

1. **Mauvaise URL** — `https://forma.vercel.app` est une **autre application** (Next.js/Chakra, pas Forma Vite).  
   → Utiliser **https://forma-iota-six.vercel.app**

2. **Deux repos Git** — ne pas confondre :
   - `origin` → `bouviErArchiVe/forma` (**actif**, code à jour)
   - `upstream` → `bouvierarchive/archnote` (**obsolète**, dernier commit README seulement)

3. **Cache navigateur / PWA** — vider le cache ou réinstaller la PWA après déploiement.

4. **Cache Vercel assets** — les fichiers `/assets/*` ont `max-age=31536000` (hashés). Un hard refresh (Ctrl+Shift+R) suffit ; le HTML est toujours revalidé.

## Vérifications rapides

```bash
git status
git branch
git remote -v
git log -1 --oneline
git push origin main
npm run build
npx vercel ls
npx vercel inspect forma-iota-six.vercel.app
```

## Configuration Vercel

- Framework : Vite
- Build : `npm run build`
- Output : `dist`
- Branche écoutée : `main` (GitHub → Vercel auto-deploy)
- Variables requises : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Production URL OAuth : mettre `VITE_APP_URL=https://forma-iota-six.vercel.app` dans Vercel **Environment Variables**

## Redéploiement manuel

```bash
npx vercel link --yes --project forma
npx vercel --prod --yes
```

Ou : Vercel Dashboard → Project `forma` → Deployments → Redeploy (option « Clear cache » si doute).

## Checklist post-push

- [ ] Commit visible sur https://github.com/bouviErArchiVe/Forma/commits/main
- [ ] Nouveau deployment « Ready » sur Vercel
- [ ] https://forma-iota-six.vercel.app/formahub accessible
- [ ] Pas d'erreur console majeure
