/** Insertion / renumérotation de pages dans un carnet. */

/** @typedef {'start' | 'after-current' | 'end'} PageInsertPosition */

export function resolveInsertPageNumber(position, currentPage, pagesCount) {
  const count = Math.max(1, pagesCount || 1)
  const cur = Math.min(Math.max(1, currentPage || 1), count)
  if (position === 'start') return 1
  if (position === 'after-current') return Math.min(cur + 1, count + 1)
  return count + 1
}

/** Décale page_number +1 pour les pages >= atNum (ordre local). */
export function shiftLocalPagesForInsert(pages, atNum) {
  return (pages || [])
    .map((p) => ({
      ...p,
      page_number: (p.page_number || 0) >= atNum ? (p.page_number || 0) + 1 : p.page_number,
    }))
    .sort((a, b) => a.page_number - b.page_number)
}

/** Met à jour page_number en base (décroissant pour éviter les conflits d'unicité). */
export async function shiftSupabasePagesForInsert(supabase, notebookId, atNum) {
  const { data: toShift, error: selErr } = await supabase
    .from('pages')
    .select('id, page_number')
    .eq('notebook_id', notebookId)
    .gte('page_number', atNum)
    .order('page_number', { ascending: false })
  if (selErr) throw selErr
  for (const pg of toShift || []) {
    const { error } = await supabase
      .from('pages')
      .update({ page_number: pg.page_number + 1 })
      .eq('id', pg.id)
    if (error) throw error
  }
}

export const PAGE_INSERT_LABELS = {
  start: 'Avant la page 1',
  'after-current': 'Après la page actuelle',
  end: 'À la fin du carnet',
}
