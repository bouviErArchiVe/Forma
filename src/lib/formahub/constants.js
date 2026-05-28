/** FormaHub — espace communautaire Forma */

export const FH_STORAGE_KEY = 'forma-hub-v1'

export const FH_CATEGORIES = [
  { id: 'architecture', label: 'Architecture', icon: '🏛' },
  { id: 'design', label: 'Design', icon: '✏️' },
  { id: 'construction', label: 'Construction', icon: '🏗' },
  { id: 'urbanisme', label: 'Urbanisme', icon: '🌆' },
  { id: 'etudes', label: 'Études', icon: '🎓' },
  { id: 'inspiration', label: 'Inspiration', icon: '💡' },
]

export const FH_TRADES = [
  { id: 'architecte', label: 'Architecte', icon: '📐', category: 'architecture', desc: 'Conception de bâtiments, espace et patrimoine.' },
  { id: 'designer-interieur', label: 'Designer intérieur', icon: '🛋', category: 'design', desc: 'Aménagement, matériaux, ambiance des espaces.' },
  { id: 'technologue', label: 'Technologue', icon: '🔧', category: 'construction', desc: 'Détails constructifs, prototypes et fabrication.' },
  { id: 'ingenieur', label: 'Ingénieur', icon: '⚙️', category: 'construction', desc: 'Structure, fluides, énergie et calcul.' },
  { id: 'charpentier', label: 'Charpentier', icon: '🪵', category: 'construction', desc: 'Ossature bois, assemblages et chantier.' },
  { id: 'soudeur', label: 'Soudeur', icon: '🔥', category: 'construction', desc: 'Assemblages métalliques et sécurité.' },
  { id: 'electricien', label: 'Électricien', icon: '⚡', category: 'construction', desc: 'Réseaux, tableaux et domotique.' },
  { id: 'plombier', label: 'Plombier', icon: '🚿', category: 'construction', desc: 'Eau, chauffage et sanitaires.' },
  { id: 'entrepreneur', label: 'Entrepreneur', icon: '📋', category: 'construction', desc: 'Pilotage de chantier et coordination.' },
  { id: 'urbaniste', label: 'Urbaniste', icon: '🗺', category: 'urbanisme', desc: 'Ville, PLU, mobilité et territoire.' },
  { id: 'paysagiste', label: 'Paysagiste', icon: '🌿', category: 'urbanisme', desc: 'Espaces extérieurs et végétal.' },
  { id: 'modelisateur-3d', label: 'Modélisateur 3D', icon: '🧊', category: 'design', desc: 'Modèles BIM, rendus et visualisation.' },
  { id: 'designer-industriel', label: 'Designer industriel', icon: '🪑', category: 'design', desc: 'Objets, ergonomie et prototypage.' },
  { id: 'graphiste', label: 'Graphiste', icon: '🎨', category: 'design', desc: 'Identité visuelle, planches et communication.' },
]

export const POST_TYPES = {
  image: 'image',
  text: 'text',
  project: 'project',
  moodboard: 'moodboard',
  pdf: 'pdf',
  tip: 'tip',
  question: 'question',
}

export const FH_FEEDS = [
  { id: 'recent', label: 'Récents' },
  { id: 'trending', label: 'Tendances' },
  { id: 'saved', label: 'Enregistrés' },
]

export const SEED_POSTS = [
  {
    id: 'seed_1', author: 'Forma', authorId: 'forma', tradeId: 'architecte', category: 'architecture',
    type: 'tip', title: 'Bien démarrer un croquis d\'esquisse', body: 'Commencez par les volumes principaux, la lumière et l\'échelle humaine avant les détails.',
    tags: ['croquis', 'esquisse'], likes: 12, saves: 4, createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'seed_2', author: 'Forma', authorId: 'forma', tradeId: 'designer-interieur', category: 'design',
    type: 'inspiration', title: 'Palette matériaux — béton & bois', body: 'Contraste chaud/froid pour espaces de vie contemporains.',
    tags: ['matériaux', 'inspiration'], likes: 28, saves: 9, createdAt: Date.now() - 86400000,
  },
  {
    id: 'seed_3', author: 'Forma', authorId: 'forma', tradeId: 'modelisateur-3d', category: 'design',
    type: 'tip', title: 'Export rendu depuis Forma', body: 'Publiez vos rendus et moodboards directement depuis FormaHub pour inspirer la communauté.',
    tags: ['forma', 'rendu'], likes: 7, saves: 3, createdAt: Date.now() - 3600000 * 5,
  },
]
