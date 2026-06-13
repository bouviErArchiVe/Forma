/**
 * CombineModule — Combine V2 : fusion de PDF et d'images en un seul PDF.
 *
 * Les fichiers importés sont stockés dans la table assets existante
 * (db.assets, blobs) ; l'état du module ne garde que les références
 * ordonnées. La fusion est déléguée à merge-pdf.ts (pdf-lib, testé).
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from '../../components/ui/Icon'
import { db } from '../../db'
import { putAsset } from '../../lib/assets'
import { createId } from '../../lib/id'
import { ensurePdfWorker } from '../../lib/pdf-worker-setup'
import { confirm } from '../../stores/confirmStore'
import { useToastStore } from '../../stores/toastStore'
import type { ModuleProps } from '../ModuleHost'
import { mergeToPdf, type MergeInputItem } from './merge-pdf'
import { thumbUrlForAsset } from './thumbnails'

interface CombineItem {
  id: string
  assetId: string
  name: string
  kind: 'pdf' | 'image'
  pageCount?: number
}

interface CombineState {
  v: 1
  items: CombineItem[]
}

function parseState(json: string): CombineState {
  const empty: CombineState = { v: 1, items: [] }
  if (json.trim() === '') return empty
  try {
    const parsed = JSON.parse(json) as Partial<CombineState>
    return { v: 1, items: Array.isArray(parsed.items) ? (parsed.items as CombineItem[]) : [] }
  } catch {
    return empty
  }
}

/** Nombre de pages d'un PDF (pdfjs, worker partagé). */
async function countPdfPages(blob: Blob): Promise<number | undefined> {
  try {
    ensurePdfWorker()
    const pdfjs = await import('pdfjs-dist')
    const buf = await blob.arrayBuffer()
    const doc = await pdfjs.getDocument({ data: buf }).promise
    const n = doc.numPages
    void doc.destroy()
    return n
  } catch {
    return undefined
  }
}

/** Vignette 40×52 d'un item (image ou première page de PDF), fallback icône. */
function ItemThumb({ assetId, kind }: { assetId: string; kind: CombineItem['kind'] }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void thumbUrlForAsset(assetId, kind).then((u) => {
      if (!cancelled) setUrl(u)
    })
    return () => {
      cancelled = true
    }
  }, [assetId, kind])

  if (url === null) {
    return (
      <div className="w-10 h-[52px] shrink-0 rounded border border-forma-border bg-forma-bg flex items-center justify-center">
        <Icon
          name={kind === 'pdf' ? 'file-text' : 'image'}
          className="w-4 h-4"
          style={{ color: kind === 'pdf' ? '#ef4444' : '#ec4899' }}
        />
      </div>
    )
  }
  return (
    <img
      src={url}
      alt=""
      draggable={false}
      onError={() => setUrl(null)}
      className="w-10 h-[52px] shrink-0 rounded border border-forma-border object-cover bg-forma-bg"
    />
  )
}

export function CombineModule({ notebook, data, onDataChange }: ModuleProps) {
  const [state, setState] = useState<CombineState>(() => parseState(data))
  const [busy, setBusy] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const update = (next: CombineState) => {
    setState(next)
    onDataChange(JSON.stringify(next))
  }

  // ── Import ───────────────────────────────────────────────────────────────────
  const addFiles = useCallback(
    async (files: File[]) => {
      const accepted = files.filter(
        (f) => f.type === 'application/pdf' || /^image\/(png|jpe?g|webp)$/.test(f.type),
      )
      if (accepted.length === 0) {
        useToastStore.getState().show('Formats acceptés : PDF, PNG, JPG, WebP')
        return
      }
      const newItems: CombineItem[] = []
      for (const file of accepted) {
        const assetId = createId()
        await putAsset(assetId, notebook.id, file, file.type)
        const kind: CombineItem['kind'] = file.type === 'application/pdf' ? 'pdf' : 'image'
        const item: CombineItem = {
          id: createId(),
          assetId,
          name: file.name.replace(/\.(pdf|png|jpe?g|webp)$/i, ''),
          kind,
        }
        if (kind === 'pdf') item.pageCount = await countPdfPages(file)
        newItems.push(item)
      }
      update({ ...state, items: [...state.items, ...newItems] })
      useToastStore.getState().show(`${newItems.length} fichier(s) ajouté(s)`)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, notebook.id],
  )

  // ── Réordonner / supprimer / renommer ───────────────────────────────────────
  const move = (index: number, delta: -1 | 1) => {
    const items = [...state.items]
    const target = index + delta
    if (target < 0 || target >= items.length) return
    const [it] = items.splice(index, 1)
    items.splice(target, 0, it)
    update({ ...state, items })
  }

  const remove = async (item: CombineItem) => {
    const ok = await confirm(`Retirer « ${item.name} » du projet ?`, {
      confirmLabel: 'Retirer',
      danger: true,
    })
    if (!ok) return
    await db.assets.delete(item.assetId)
    update({ ...state, items: state.items.filter((i) => i.id !== item.id) })
  }

  const commitRename = () => {
    if (renamingId && renameValue.trim() !== '') {
      update({
        ...state,
        items: state.items.map((i) => (i.id === renamingId ? { ...i, name: renameValue.trim() } : i)),
      })
    }
    setRenamingId(null)
  }

  // ── Fusion ───────────────────────────────────────────────────────────────────
  const merge = async () => {
    setBusy(true)
    try {
      const inputs: MergeInputItem[] = []
      for (const item of state.items) {
        const asset = await db.assets.get(item.assetId)
        if (!asset) {
          useToastStore.getState().show(`Fichier manquant : ${item.name} — ignoré`, 5000)
          continue
        }
        inputs.push({ blob: asset.blob, kind: item.kind, name: item.name })
      }
      const failures: string[] = []
      const bytes = await mergeToPdf(inputs, {
        onItemError: (f) => failures.push(f.name),
      })
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${notebook.name || 'combine'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      useToastStore
        .getState()
        .show(
          failures.length > 0
            ? `PDF exporté — ${failures.length} élément(s) illisible(s) ignoré(s) : ${failures.join(', ')}`
            : 'PDF fusionné et exporté',
          failures.length > 0 ? 6000 : 3000,
        )
    } catch (err) {
      useToastStore
        .getState()
        .show(err instanceof Error ? `Fusion échouée : ${err.message}` : 'Fusion échouée', 6000)
    } finally {
      setBusy(false)
    }
  }

  // Empêche le navigateur d'ouvrir les fichiers déposés hors zone
  useEffect(() => {
    const prevent = (e: DragEvent) => e.preventDefault()
    window.addEventListener('dragover', prevent)
    window.addEventListener('drop', prevent)
    return () => {
      window.removeEventListener('dragover', prevent)
      window.removeEventListener('drop', prevent)
    }
  }, [])

  const totalPages = state.items.reduce((s, i) => s + (i.kind === 'image' ? 1 : (i.pageCount ?? 0)), 0)

  return (
    <div className="h-full overflow-y-auto min-h-0">
      <div className="max-w-3xl mx-auto p-6">
        {/* ── Zone d'import ──────────────────────────────────────────────────── */}
        <div
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors mb-5 ${
            dragOver ? 'border-forma-accent bg-forma-accent/5' : 'border-forma-border'
          }`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            void addFiles(Array.from(e.dataTransfer.files))
          }}
        >
          <Icon name="upload" className="w-7 h-7 mx-auto text-forma-muted mb-2" />
          <p className="text-sm text-forma-text mb-1">Glissez des PDF et des images ici</p>
          <p className="text-xs text-forma-muted mb-3">PDF, PNG, JPG, WebP — fusionnés dans l’ordre de la liste</p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-xs px-3 py-1.5 rounded-lg bg-forma-accent text-white hover:bg-forma-accent-hover transition-colors inline-flex items-center gap-1.5"
          >
            <Icon name="plus" className="w-3.5 h-3.5" />
            Choisir des fichiers
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/webp"
            multiple
            className="hidden"
            onChange={(e) => {
              void addFiles(Array.from(e.target.files ?? []))
              e.target.value = ''
            }}
          />
        </div>

        {/* ── Liste ordonnée ─────────────────────────────────────────────────── */}
        {state.items.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-forma-text">
                {state.items.length} élément{state.items.length > 1 ? 's' : ''}
                {totalPages > 0 && (
                  <span className="text-forma-muted font-normal"> · ≈ {totalPages} page{totalPages > 1 ? 's' : ''}</span>
                )}
              </h3>
              <button
                type="button"
                disabled={busy || state.items.length === 0}
                onClick={() => void merge()}
                className="text-xs px-3 py-1.5 rounded-lg bg-forma-accent text-white hover:bg-forma-accent-hover disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
              >
                <Icon name="check" className="w-3.5 h-3.5" />
                {busy ? 'Fusion en cours…' : 'Fusionner et exporter PDF'}
              </button>
            </div>
            <div className="space-y-1">
              {state.items.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-forma-border bg-forma-surface"
                >
                  <span className="text-[10px] text-forma-muted w-5 text-right shrink-0">{index + 1}.</span>
                  <ItemThumb assetId={item.assetId} kind={item.kind} />
                  {renamingId === item.id ? (
                    <input
                      type="text"
                      value={renameValue}
                      autoFocus
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename()
                        if (e.key === 'Escape') setRenamingId(null)
                      }}
                      className="flex-1 text-xs border border-forma-accent rounded px-1.5 py-0.5 bg-forma-bg focus:outline-none min-w-0"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setRenamingId(item.id)
                        setRenameValue(item.name)
                      }}
                      title="Renommer"
                      className="flex-1 text-left text-xs text-forma-text truncate hover:text-forma-accent min-w-0"
                    >
                      {item.name}
                    </button>
                  )}
                  {item.kind === 'pdf' && item.pageCount !== undefined && (
                    <span className="text-[10px] text-forma-muted shrink-0">{item.pageCount} p.</span>
                  )}
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      title="Monter"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                      className="p-1 text-forma-muted hover:text-forma-accent disabled:opacity-30"
                    >
                      <Icon name="chevron-up" className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Descendre"
                      disabled={index === state.items.length - 1}
                      onClick={() => move(index, 1)}
                      className="p-1 text-forma-muted hover:text-forma-accent disabled:opacity-30"
                    >
                      <Icon name="chevron-down" className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Retirer"
                      onClick={() => void remove(item)}
                      className="p-1 text-forma-muted hover:text-red-500"
                    >
                      <Icon name="trash" className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {state.items.length === 0 && (
          <p className="text-xs text-forma-muted text-center">
            Le projet est sauvegardé automatiquement — vous pouvez revenir le compléter plus tard.
          </p>
        )}
      </div>
    </div>
  )
}
