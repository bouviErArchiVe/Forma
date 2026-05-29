# Déploiement — Forma `formacursor`

## Production ArchNote (ne pas écraser)

| Élément | Valeur |
|---------|--------|
| Branche | `main` |
| URL | https://forma-iota-six.vercel.app |
| Repo | https://github.com/bouviErArchiVe/Forma |

## Preview PWA `formacursor` (branche dédiée)

| Élément | Valeur |
|---------|--------|
| Branche Git | `formacursor` |
| CI | GitHub Actions sur push `formacursor` |
| Build | `npm run build` → `dist/` |

### Créer le preview Vercel (projet séparé)

1. [Vercel Dashboard](https://vercel.com/new) → Import `bouviErArchiVe/Forma`
2. **Project name** : `formacursor` (ou `forma-pwa`)
3. **Production Branch** : `formacursor` (pas `main`)
4. Framework : Vite — Build `npm run build`, Output `dist`
5. Variables (Environment Variables) :

   | Variable | Preview / Production |
   |----------|----------------------|
   | `VITE_SUPABASE_URL` | optionnel |
   | `VITE_SUPABASE_ANON_KEY` | optionnel |
   | `VITE_APP_URL` | URL du preview Vercel |

6. Deploy → URL attendue : `https://formacursor-*.vercel.app`

### CLI (si `vercel login` actif)

```bash
cd formacursor
npx vercel link --project formacursor
npx vercel --prod --yes
```

### Preview URL

| Environnement | URL |
|---------------|-----|
| **Production (projet `formacursor`)** | https://formacursor.vercel.app |
| Dernier deploy CLI | https://formacursor-oczfzfjcu-erwan-bouvier-s-projects.vercel.app |

Configurer `VITE_APP_URL` sur l’URL production du projet preview (pas `forma-iota-six.vercel.app`).

Ne pas pointer le projet Vercel `forma` (production ArchNote) vers la branche `formacursor`.
