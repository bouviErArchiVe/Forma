/**
 * ResourceFilters — recherche + filtres par catégorie pour un catalogue de
 * ressources graphiques (Resource Factory). Réutilisable par toute famille
 * de ressources (hachures, symboles, …).
 */

export function ResourceFilters({
  search,
  onSearch,
  category,
  onCategory,
  categories,
  placeholder = 'Rechercher…',
}: {
  search: string
  onSearch: (v: string) => void
  category: string
  onCategory: (key: string) => void
  categories: { key: string; label: string }[]
  placeholder?: string
}) {
  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder={placeholder}
        className="w-full text-xs border border-forma-border rounded-lg px-2.5 py-1.5 bg-forma-bg focus:outline-none focus:border-forma-accent mb-2"
      />
      <div className="flex flex-wrap gap-1 mb-2">
        <button type="button" onClick={() => onCategory('all')} className={`text-[11px] px-2 py-0.5 rounded-full border ${category === 'all' ? 'border-forma-accent text-forma-accent' : 'border-forma-border text-forma-muted'}`}>Tous</button>
        {categories.map((c) => (
          <button key={c.key} type="button" onClick={() => onCategory(c.key)} className={`text-[11px] px-2 py-0.5 rounded-full border ${category === c.key ? 'border-forma-accent text-forma-accent' : 'border-forma-border text-forma-muted'}`}>{c.label}</button>
        ))}
      </div>
    </div>
  )
}
