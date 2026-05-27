# FORMA

> Creative Spatial Thinking — free & open source

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/forma)

## 🚀 Démarrage rapide (5 minutes)

### 1. Clone & install
```bash
git clone https://github.com/YOUR_USERNAME/forma.git
cd forma
npm install
```

### 2. Configure Supabase (gratuit)
1. Crée un compte sur [supabase.com](https://supabase.com)
2. Crée un nouveau projet
3. Va dans **SQL Editor** et colle le schéma de `src/lib/supabase.js` (commentaire en bas du fichier)
4. Copie tes clés depuis **Settings > API**

```bash
cp .env.example .env.local
# Remplis VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
```

### 3. Lance en local
```bash
npm run dev
# → http://localhost:5173
```

### 4. Déploie sur Vercel (gratuit)
```bash
npm install -g vercel
vercel
# Ajoute tes variables d'environnement dans le dashboard Vercel
```

## 📦 Stack technique (100% gratuit)

| Service | Usage | Limite gratuite |
|---------|-------|-----------------|
| **Vercel** | Hébergement + CDN | 100GB bandwidth/mois |
| **Supabase** | Auth + DB + Storage + Realtime | 500MB DB, 1GB storage |
| **GitHub** | Code + CI/CD | Illimité open source |
| **Tesseract.js** | OCR manuscrit | Local, gratuit |
| **jsPDF** | Export PDF | Local, gratuit |

## 🎨 Fonctionnalités

- ✅ 15 thèmes visuels (Dark, Neon, Blueprint, Sépia...)
- ✅ 12 palettes de couleurs + 5 palettes surligneur
- ✅ 8 pinceaux avec taille personnalisable
- ✅ Règle + rapporteur intégrés
- ✅ Bibliothèque structurelle (70+ éléments bois/acier/béton)
- ✅ Glisser-déposer des éléments sur la feuille
- ✅ 20 modèles de pages (plan, élévation, coupe, Cornell, ligné...)
- ✅ 18 matières (Architecture, Anglais, Maths, Physique...)
- ✅ Import PDF, images, DWG, IFC, Word, Excel...
- ✅ Calques (visibilité, verrouillage)
- ✅ Collaboration en temps réel (Supabase Realtime)
- ✅ OCR manuscrit (Tesseract.js)
- ✅ Export PDF haute résolution (cartouche archi)
- ✅ PWA installable sur iPad
- ✅ Offline first
- ✅ Échelles métriques et impériales
- ✅ Système de cotation architectural

## 📱 iPad / Apple Pencil

FORMA est optimisé pour iPad. Pour l'installer :
1. Ouvre ton instance FORMA dans Safari
2. Partager → **Sur l'écran d'accueil**
3. L'app s'installe comme une app native

## 🤝 Contribuer

PRs bienvenues ! Voir [CONTRIBUTING.md](CONTRIBUTING.md)

## 📄 Licence

MIT — gratuit pour toujours pour les étudiants
