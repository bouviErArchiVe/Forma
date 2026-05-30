import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BrandLogo } from '../components/BrandLogo'
import { SpreadsheetGrid } from '../components/spreadsheet/SpreadsheetGrid'
import { SpreadsheetPreview, sheetSnippet } from '../components/spreadsheet/SpreadsheetPreview'
import { GlassButton } from '../components/ui/GlassButton'
import { exportSheetCsv, exportSheetJson } from '../lib/spreadsheet/export'
import {
  autosaveSheet,
  createSheetRecord,
  deleteSheet,
  duplicateSheet,
  getSheet,
  listSheets,
  saveSheet,
  searchSheets,
  sortSheets,
  type SheetSortBy,
  type SheetSortDir,
} from '../services/formatab'
import { useToastStore } from '../stores/toastStore'
import type { FormaSheet } from '../types'

type View = 'library' | 'editor'

export function FormaTabPage() {
  const [view, setView] = useState<View>('library')
  const [sheets, setSheets] = useState<FormaSheet[]>([])
  const [activeSheet, setActiveSheet] = useState<FormaSheet | null>(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SheetSortBy>('updated')
  const [sortDir, setSortDir] = useState<SheetSortDir>('desc')
  const [saving, setSaving] = useState(false)

  const loadSheets = useCallback(async () => {
    const list = search.trim() ? await searchSheets(search) : await listSheets()
    setSheets(sortSheets(list, sortBy, sortDir))
  }, [search, sortBy, sortDir])

  useEffect(() => {
    void loadSheets()
  }, [loadSheets])

  const displayed = useMemo(() => sheets, [sheets])

  const openSheet = async (id: string) => {
    const s = await getSheet(id)
    if (!s) return
    setActiveSheet(structuredClone(s))
    setView('editor')
  }

  const handleNew = async () => {
    const s = await createSheetRecord('Nouveau tableau')
    await loadSheets()
    setActiveSheet(s)
    setView('editor')
  }

  const handleChange = (next: FormaSheet) => {
    setActiveSheet(next)
    setSaving(true)
    void autosaveSheet(next).finally(() => setSaving(false))
  }

  const handleRename = (name: string) => {
    if (!activeSheet || !name.trim()) return
    const next = { ...activeSheet, name: name.trim() }
    setActiveSheet(next)
    void saveSheet(next).then(() => loadSheets())
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce tableau ?')) return
    await deleteSheet(id)
    if (activeSheet?.id === id) {
      setActiveSheet(null)
      setView('library')
    }
    await loadSheets()
    useToastStore.getState().show('Tableau supprimé')
  }

  const handleDuplicate = async (id: string) => {
    const copy = await duplicateSheet(id)
    if (copy) {
      await loadSheets()
      setActiveSheet(copy)
      setView('editor')
    }
  }

  const toggleLock = () => {
    if (!activeSheet) return
    handleChange({ ...activeSheet, locked: !activeSheet.locked })
  }

  if (view === 'editor' && activeSheet) {
    return (
      <div className="min-h-full flex flex-col p-4 max-w-[100rem] mx-auto w-full">
        <header className="forma-glass-header rounded-xl px-4 py-3 mb-4 flex flex-wrap items-center gap-3 border border-forma-border/50">
          <button
            type="button"
            onClick={() => {
              setView('library')
              void loadSheets()
            }}
            className="text-sm text-forma-accent hover:underline shrink-0"
          >
            ← Bibliothèque tableurs
          </button>
          <BrandLogo size="sm" subtitle="FormaTab" />
          <input
            value={activeSheet.name}
            onChange={(e) => setActiveSheet({ ...activeSheet, name: e.target.value })}
            onBlur={(e) => handleRename(e.target.value)}
            className="flex-1 min-w-[12rem] font-medium bg-transparent border-b border-transparent focus:border-forma-accent outline-none text-sm"
          />
          {saving && <span className="text-xs text-forma-muted">Enregistrement…</span>}
          <GlassButton
            size="sm"
            onClick={() => {
              exportSheetCsv(activeSheet)
              useToastStore.getState().show('CSV exporté')
            }}
          >
            CSV
          </GlassButton>
          <GlassButton
            size="sm"
            onClick={() => {
              exportSheetJson(activeSheet)
              useToastStore.getState().show('JSON exporté')
            }}
          >
            JSON
          </GlassButton>
          <button type="button" className="text-xs text-forma-muted" onClick={toggleLock}>
            {activeSheet.locked ? '🔓 Déverrouiller' : '🔒 Verrouiller'}
          </button>
          <button
            type="button"
            className="text-xs text-red-600"
            onClick={() => void handleDelete(activeSheet.id)}
          >
            Supprimer
          </button>
        </header>
        <div className="flex-1 min-h-[60vh]">
          <SpreadsheetGrid
            sheet={activeSheet}
            onChange={handleChange}
            readOnly={activeSheet.locked}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full flex flex-col max-w-6xl mx-auto w-full p-4">
      <header className="forma-glass-header rounded-xl px-4 py-3 mb-6 flex flex-wrap items-center gap-3 border border-forma-border/50">
        <BrandLogo size="sm" subtitle="FormaTab" />
        <div className="flex-1" />
        <Link to="/" className="text-sm text-forma-accent hover:underline">
          ← Bibliothèque
        </Link>
      </header>

      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher…"
          className="flex-1 min-w-[12rem] border rounded-lg px-3 py-2 text-sm"
        />
        <select
          value={`${sortBy}-${sortDir}`}
          onChange={(e) => {
            const [by, dir] = e.target.value.split('-') as [SheetSortBy, SheetSortDir]
            setSortBy(by)
            setSortDir(dir)
          }}
          className="border rounded-lg px-2 py-2 text-sm"
        >
          <option value="updated-desc">Modifié ↓</option>
          <option value="updated-asc">Modifié ↑</option>
          <option value="name-asc">Nom A→Z</option>
          <option value="name-desc">Nom Z→A</option>
        </select>
        <GlassButton accent onClick={() => void handleNew()}>
          + Tableau
        </GlassButton>
      </div>

      {displayed.length === 0 ? (
        <div className="text-center py-20 text-forma-muted">
          <p className="text-4xl mb-3">📊</p>
          <p>Aucun tableau — créez-en un avec + Tableau</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map((sheet) => (
            <article
              key={sheet.id}
              className="forma-glass-panel rounded-xl p-4 border border-forma-border/40 flex flex-col gap-3"
            >
              <div className="h-32 overflow-hidden rounded-lg border border-forma-border/30 bg-white">
                <SpreadsheetPreview sheet={sheet} maxRows={5} maxCols={6} compact />
              </div>
              <div>
                <h2 className="font-medium text-sm truncate">{sheet.name}</h2>
                <p className="text-xs text-forma-muted mt-1 line-clamp-2">{sheetSnippet(sheet)}</p>
                <p className="text-[10px] text-forma-muted mt-1">
                  {sheet.rows}×{sheet.cols} · {new Date(sheet.updatedAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 mt-auto">
                <GlassButton accent size="sm" onClick={() => void openSheet(sheet.id)}>
                  Ouvrir
                </GlassButton>
                <GlassButton size="sm" onClick={() => void handleDuplicate(sheet.id)}>
                  Dupliquer
                </GlassButton>
                <button
                  type="button"
                  className="text-xs text-red-600 px-2"
                  onClick={() => void handleDelete(sheet.id)}
                >
                  Supprimer
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
