import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { importBackupFile } from '../lib/backup'
import { restoreFromCloudSlot } from '../lib/cloud-restore'
import { backfillMissingPdfText } from '../lib/pdf-backfill'
import { indexAllInk } from '../lib/handwriting-index'
import { importShareBundle } from '../lib/share-bundle'
import { clearRecentIds } from '../lib/recent'
import { clearRecentPages } from '../lib/recent-pages'
import { exportFullLibraryMarkdownZip } from '../lib/bulk-markdown'
import { APP_VERSION } from '../lib/version'
import { getDbHealthReport, type DbHealthReport } from '../lib/db-health'
import { formatBytes, type LibraryStats } from '../lib/storage-stats'
import {
  formatStorageEstimate,
  isStorageNearlyFull,
  type BrowserStorageEstimate,
} from '../lib/storage-quota'
import { shareUrl } from '../services/share'
import {
  getLastBackupTime,
  runAutoBackupIfDue,
  runManualBackupDownload,
  saveBackupToCloudSlot,
} from '../services/sync'
import { useSettingsStore } from '../stores/settingsStore'
import { TEMPLATE_LABELS } from '../lib/templates'
import { COVER_COLORS, type PaperTemplate, type PaperTone, type ThemeMode } from '../types'
import { usePwaUpdate } from '../hooks/usePwaUpdate'
import { getPwaUpdateState } from '../lib/pwa'

export function SettingsPage() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const mergeFileRef = useRef<HTMLInputElement>(null)
  const shareImportRef = useRef<HTMLInputElement>(null)
  const [importMsg, setImportMsg] = useState('')
  const [syncMsg, setSyncMsg] = useState('')
  const [indexMsg, setIndexMsg] = useState('')
  const [indexing, setIndexing] = useState(false)
  const [stats, setStats] = useState<LibraryStats | null>(null)
  const [dbHealth, setDbHealth] = useState<DbHealthReport | null>(null)
  const [browserStorage, setBrowserStorage] = useState<BrowserStorageEstimate | null>(null)
  const [exportIncludeThumbnails, setExportIncludeThumbnails] = useState(false)
  const lastBackup = getLastBackupTime()
  const {
    theme,
    palmRejection,
    fingerScroll,
    gridSnap,
    pageViewMode,
    autoSnapshot,
    scribbleErase,
    showRuler,
    showPerfHud,
    defaultPenWidth,
    defaultZoom,
    shapeHoldMs,
    setTheme,
    setPalmRejection,
    setFingerScroll,
    setGridSnap,
    setPageViewMode,
    setAutoSnapshot,
    setScribbleErase,
    setShowRuler,
    setShowPerfHud,
    setDefaultPenWidth,
    setDefaultZoom,
    setShapeHoldMs,
    syncInterval,
    setSyncInterval,
    paperTone,
    setPaperTone,
    defaultPaperTemplate,
    setDefaultPaperTemplate,
    defaultCoverColor,
    setDefaultCoverColor,
    setOnboardingDone,
    applyTheme,
  } = useSettingsStore()

  const refreshStats = () => {
    void getDbHealthReport().then((h) => {
      setDbHealth(h)
      setStats(h.stats)
      setBrowserStorage(h.browserStorage)
    })
  }

  useEffect(() => {
    refreshStats()
  }, [])

  return (
    <div className="min-h-full p-4 max-w-lg mx-auto">
      <Link to="/" className="text-sm text-forma-accent">
        ← Bibliothèque
      </Link>
      <h1 className="text-2xl font-bold mt-4 mb-6">Paramètres</h1>

      {stats && (
        <section className="mb-8 p-4 rounded-xl border border-forma-border bg-forma-surface/50 space-y-1 text-sm">
          <h2 className="text-sm font-semibold text-forma-muted uppercase mb-2">Bibliothèque</h2>
          <p>{stats.notebooks} carnet(s) · {stats.pages} page(s)</p>
          <p>
            {stats.folders} dossier(s) · {stats.studyCards} cartes Study · {stats.audioRecordings}{' '}
            audio
          </p>
          <p className="text-xs text-forma-muted">
            Instantanés : {stats.snapshots} · Encre indexée : {stats.inkIndexedPages} / {stats.pages}{' '}
            page(s)
          </p>
          <p className="text-xs text-forma-muted">
            Assets (blobs) : {stats.assets} fichier(s) · {formatBytes(stats.assetBytes)}
          </p>
          <p className="text-xs text-forma-muted">
            Taille estimée JSON : {formatBytes(stats.estimatedBytes)}
          </p>
          {(browserStorage ?? dbHealth?.browserStorage) &&
            formatStorageEstimate(browserStorage ?? dbHealth!.browserStorage) && (
            <p
              className={`text-xs mt-1 ${
                isStorageNearlyFull((browserStorage ?? dbHealth?.browserStorage)?.percent ?? null)
                  ? 'text-amber-700 dark:text-amber-300 font-medium'
                  : 'text-forma-muted'
              }`}
            >
              Stockage navigateur :{' '}
              {formatStorageEstimate(browserStorage ?? dbHealth!.browserStorage)}
              {isStorageNearlyFull((browserStorage ?? dbHealth?.browserStorage)?.percent ?? null) &&
                ' — espace faible, exportez ou supprimez des carnets'}
            </p>
          )}
          {dbHealth && dbHealth.pagesWithInlineDataUrl > 0 && (
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              Migration en cours : {dbHealth.pagesWithInlineDataUrl} page(s) avec images inline
              (conversion idle vers blobs)
            </p>
          )}
          {dbHealth && dbHealth.brokenAssetRefs.length > 0 && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              {dbHealth.brokenAssetRefs.length} référence(s) asset cassée(s) — réimportez ou restaurez
              une sauvegarde
            </p>
          )}
          {dbHealth && dbHealth.orphanAssetCount > 0 && (
            <p className="text-xs text-forma-muted mt-1">
              {dbHealth.orphanAssetCount} asset(s) orphelin(s) — utilisez « Nettoyer assets »
            </p>
          )}
          <button type="button" className="text-xs text-forma-accent mt-1" onClick={refreshStats}>
            Actualiser
          </button>
        </section>
      )}

      <section className="mb-8 space-y-4">
        <h2 className="text-sm font-semibold text-forma-muted uppercase">Apparence</h2>
        <label className="block text-sm">
          Thème
          <select
            value={theme}
            onChange={(e) => {
              setTheme(e.target.value as ThemeMode)
              applyTheme()
            }}
            className="mt-1 w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600"
          >
            <option value="system">Système</option>
            <option value="light">Clair</option>
            <option value="dark">Sombre</option>
          </select>
        </label>
        <label className="block text-sm">
          Teinte du papier (pages)
          <select
            value={paperTone}
            onChange={(e) => setPaperTone(e.target.value as PaperTone)}
            className="mt-1 w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600"
          >
            <option value="cream">Crème (défaut)</option>
            <option value="white">Blanc</option>
            <option value="sepia">Sépia</option>
          </select>
        </label>
      </section>

      <section className="mb-8 space-y-3">
        <h2 className="text-sm font-semibold text-forma-muted uppercase">Stylet & tactile</h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={palmRejection}
            onChange={(e) => setPalmRejection(e.target.checked)}
          />
          Rejet de la paume (ignorer gros contacts)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={fingerScroll}
            onChange={(e) => setFingerScroll(e.target.checked)}
          />
          Doigt pour faire défiler (au lieu d’écrire)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={gridSnap}
            onChange={(e) => setGridSnap(e.target.checked)}
          />
          Accrochage grille (32 px) au stylo et aux formes
        </label>
        <label className="block text-sm">
          Épaisseur stylo par défaut
          <input
            type="range"
            min={0.5}
            max={6}
            step={0.5}
            value={defaultPenWidth}
            onChange={(e) => setDefaultPenWidth(+e.target.value)}
            className="mt-1 w-full"
          />
        </label>
        <label className="block text-sm">
          Zoom éditeur par défaut ({Math.round(defaultZoom * 100)} %)
          <input
            type="range"
            min={35}
            max={160}
            step={5}
            value={Math.round(defaultZoom * 100)}
            onChange={(e) => setDefaultZoom(+e.target.value / 100)}
            className="mt-1 w-full"
          />
        </label>
        <label className="block text-sm">
          Maintien du trait → forme (ms)
          <input
            type="range"
            min={300}
            max={1200}
            step={50}
            value={shapeHoldMs}
            onChange={(e) => setShapeHoldMs(+e.target.value)}
            className="mt-1 w-full"
          />
        </label>
      </section>

      <section className="mb-8 space-y-3">
        <h2 className="text-sm font-semibold text-forma-muted uppercase">Éditeur</h2>
        <label className="block text-sm mb-2">
          Couverture par défaut (nouveaux carnets)
          <div className="flex flex-wrap gap-1 mt-1">
            {COVER_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setDefaultCoverColor(c)}
                className={`w-8 h-10 rounded border-2 ${
                  defaultCoverColor === c ? 'border-forma-accent' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
                title="Couverture"
              />
            ))}
          </div>
        </label>
        <label className="block text-sm">
          Papier par défaut (nouveaux carnets)
          <select
            value={defaultPaperTemplate}
            onChange={(e) => setDefaultPaperTemplate(e.target.value as PaperTemplate)}
            className="mt-1 w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600"
          >
            {(Object.keys(TEMPLATE_LABELS) as PaperTemplate[]).map((t) => (
              <option key={t} value={t}>
                {TEMPLATE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Affichage des pages
          <select
            value={pageViewMode}
            onChange={(e) => setPageViewMode(e.target.value as typeof pageViewMode)}
            className="mt-1 w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600"
          >
            <option value="single">Une page à la fois</option>
            <option value="continuous">Défilement continu</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={autoSnapshot}
            onChange={(e) => setAutoSnapshot(e.target.checked)}
          />
          Versions auto (instantané 90 s après modification)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={scribbleErase}
            onChange={(e) => setScribbleErase(e.target.checked)}
          />
          Petit cercle au stylo = gomme (sinon sélection Circle to Lasso)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showRuler}
            onChange={(e) => setShowRuler(e.target.checked)}
          />
          Afficher la règle (mm) sur les pages
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showPerfHud}
            onChange={(e) => setShowPerfHud(e.target.checked)}
          />
          HUD performance (FPS, temps changement de page) dans l&apos;éditeur
        </label>
      </section>

      <section className="mb-8 space-y-3">
        <h2 className="text-sm font-semibold text-forma-muted uppercase">Partage portable</h2>
        <p className="text-xs text-forma-muted">
          Importez un fichier <code>.forma-share.zip</code> reçu d&apos;un autre appareil pour activer le lien de partage.
        </p>
        <button
          type="button"
          onClick={() => shareImportRef.current?.click()}
          className="w-full py-2 border rounded-lg dark:border-gray-600 text-sm"
        >
          Importer un pack de partage
        </button>
        <input
          ref={shareImportRef}
          type="file"
          accept=".zip,application/zip"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0]
            if (!f) return
            try {
              const { notebookId, token } = await importShareBundle(f)
              setImportMsg(`Partage importé. Lien : ${shareUrl(token)}`)
              navigate(`/document/${notebookId}`)
            } catch (err) {
              setImportMsg(err instanceof Error ? err.message : 'Erreur import partage')
            }
            e.target.value = ''
          }}
        />
      </section>

      <section className="mb-8 space-y-3">
        <h2 className="text-sm font-semibold text-forma-muted uppercase">Recherche manuscrit</h2>
        <p className="text-xs text-forma-muted">
          Indexe l’écriture au stylo via OCR (long). Les pages déjà indexées sont ignorées.
        </p>
        <button
          type="button"
          disabled={indexing}
          className="w-full py-2 border rounded-lg dark:border-gray-600 text-sm disabled:opacity-50"
          onClick={async () => {
            setIndexing(true)
            setIndexMsg('')
            try {
              const n = await indexAllInk((d, t) => setIndexMsg(`${d}/${t}…`))
              setIndexMsg(`${n} page(s) indexée(s).`)
            } catch {
              setIndexMsg('Échec indexation.')
            } finally {
              setIndexing(false)
            }
          }}
        >
          {indexing ? 'Indexation…' : 'Indexer toute la bibliothèque'}
        </button>
        {indexMsg && <p className="text-xs text-forma-muted">{indexMsg}</p>}
      </section>

      <section className="mb-8 space-y-3">
        <h2 className="text-sm font-semibold text-forma-muted uppercase">Sauvegarde</h2>
        <p className="text-xs text-forma-muted">
          Exportez toute votre bibliothèque en .forma.zip. Remplacer télécharge d’abord une sauvegarde
          horodatée puis efface les données locales ; fusionner ajoute les carnets (conflits d’id →
          nouveaux ids).
        </p>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            data-testid="export-include-thumbnails"
            checked={exportIncludeThumbnails}
            onChange={(e) => setExportIncludeThumbnails(e.target.checked)}
          />
          Inclure vignettes pages (.forma v2)
        </label>
        <button
          type="button"
          onClick={() =>
            void runManualBackupDownload(
              exportIncludeThumbnails ? { includeThumbnails: true } : undefined,
            ).then((ok) => {
              if (ok) setImportMsg('Export .forma téléchargé.')
            })
          }
          className="w-full py-2.5 bg-forma-accent text-white rounded-lg"
        >
          Exporter la bibliothèque (fichier)
        </button>
        <button
          type="button"
          className="w-full py-2 border rounded-lg dark:border-gray-600 text-sm"
          onClick={async () => {
            try {
              setImportMsg('Export Markdown…')
              const n = await exportFullLibraryMarkdownZip((name, i, t) =>
                setImportMsg(`${name} (${i}/${t})…`),
              )
              setImportMsg(`${n} carnet(s) exporté(s) en ZIP Markdown.`)
            } catch (err) {
              setImportMsg(err instanceof Error ? err.message : 'Export Markdown échoué')
            }
          }}
        >
          Exporter toute la bibliothèque (ZIP Markdown)
        </button>
        <button
          type="button"
          className="w-full py-2 border rounded-lg dark:border-gray-600 text-sm"
          onClick={async () => {
            const n = await backfillMissingPdfText()
            setImportMsg(n > 0 ? `${n} page(s) PDF réindexée(s).` : 'Aucune page à réindexer.')
          }}
        >
          Réindexer texte PDF (carnets avec source)
        </button>
        <button
          type="button"
          className="w-full py-2 border rounded-lg dark:border-gray-600 text-sm text-forma-muted"
          onClick={async () => {
            try {
              const { db } = await import('../db')
              const { resolveNotebookPdfSource } = await import('../lib/assets')
              const { benchmarkPdfPageCounts, clearPdfRenderCache } = await import(
                '../lib/pdf-page-render'
              )
              const nb = (await db.notebooks.toArray()).find(
                (n) => n.pdfSourceAssetId || n.pdfSourceDataUrl,
              )
              if (!nb) {
                setImportMsg('Bench PDF : aucun carnet avec source PDF.')
                return
              }
              const src = await resolveNotebookPdfSource(nb)
              if (!src) {
                setImportMsg('Bench PDF : source illisible.')
                return
              }
              clearPdfRenderCache()
              setImportMsg('Bench PDF 50/100/200 pages…')
              const results = await benchmarkPdfPageCounts(src, undefined, nb.id)
              const lines = results.map(
                (r) => `${r.pageCount}p: ${r.totalMs} ms (~${r.avgMs} ms/p)`,
              )
              setImportMsg(`Bench PDF « ${nb.name} » — ${lines.join(' · ')}`)
            } catch (err) {
              setImportMsg(err instanceof Error ? err.message : 'Bench PDF échoué')
            }
          }}
        >
          Bench rendu PDF (50/100/200 pages, dev)
        </button>
        <button
          type="button"
          className="w-full py-2 border rounded-lg dark:border-gray-600 text-sm"
          onClick={async () => {
            const { garbageCollectOrphanAssets } = await import('../lib/assets')
            const n = await garbageCollectOrphanAssets()
            setImportMsg(
              n > 0 ? `${n} asset(s) orphelin(s) supprimé(s).` : 'Aucun asset orphelin.',
            )
          }}
        >
          Nettoyer assets orphelins (IndexedDB)
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full py-2.5 border border-forma-border rounded-lg dark:border-gray-600"
        >
          Importer et remplacer la bibliothèque
        </button>
        <button
          type="button"
          onClick={() => mergeFileRef.current?.click()}
          className="w-full py-2.5 border border-forma-accent/40 text-forma-accent rounded-lg dark:border-forma-accent/50"
        >
          Importer et fusionner
        </button>
        <input
          ref={fileRef}
          data-testid="import-replace-input"
          type="file"
          accept=".zip,.json,application/zip"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0]
            if (!f) return
            try {
              const r = await importBackupFile(f, { mode: 'replace' })
              const skip =
                r.skippedPages > 0 ? ` (${r.skippedPages} page(s) ignorée(s) — fichier partiel)` : ''
              const backup =
                r.preReplaceBackupFilename ?
                  ` · sauvegarde « ${r.preReplaceBackupFilename} » téléchargée`
                : ''
              const val = r.validationSummary ? ` · ${r.validationSummary}` : ''
              setImportMsg(
                `Remplacé : ${r.notebooks} carnets, ${r.pages} pages${skip}${backup}${val}. Rechargez la page.`,
              )
            } catch (err) {
              setImportMsg(err instanceof Error ? err.message : 'Erreur import')
            }
            e.target.value = ''
          }}
        />
        <input
          ref={mergeFileRef}
          data-testid="import-merge-input"
          type="file"
          accept=".zip,.json,application/zip"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0]
            if (!f) return
            try {
              const r = await importBackupFile(f, { mode: 'merge' })
              const skip =
                r.skippedPages > 0 ? ` (${r.skippedPages} page(s) ignorée(s))` : ''
              const remap =
                r.remappedNotebooks ?
                  ` · ${r.remappedNotebooks} carnet(s) renommé(s) (id local existant)`
                : ''
              const pageRemap =
                r.remappedPages ? ` · ${r.remappedPages} page(s) renommée(s)` : ''
              const assetRemap =
                r.remappedAssets ? ` · ${r.remappedAssets} asset(s) renommé(s)` : ''
              const val = r.validationSummary ? ` · ${r.validationSummary}` : ''
              setImportMsg(
                `Fusionné : ${r.notebooks} carnets, ${r.pages} pages${skip}${remap}${pageRemap}${assetRemap}${val}.`,
              )
            } catch (err) {
              setImportMsg(err instanceof Error ? err.message : 'Erreur import')
            }
            e.target.value = ''
          }}
        />
        {importMsg && <p className="text-sm text-green-700 dark:text-green-400">{importMsg}</p>}
      </section>

      <section className="mb-8 space-y-3">
        <h2 className="text-sm font-semibold text-forma-muted uppercase">Sync & sauvegarde auto</h2>
        <p className="text-xs text-forma-muted">
          La sauvegarde automatique écrit dans le slot cloud local (silencieux, sans boîte de dialogue).
        </p>
        <label className="block text-sm">
          Fréquence
          <select
            value={syncInterval}
            onChange={(e) => setSyncInterval(e.target.value as typeof syncInterval)}
            className="mt-1 w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600"
          >
            <option value="off">Désactivée</option>
            <option value="daily">Quotidienne</option>
            <option value="weekly">Hebdomadaire</option>
          </select>
        </label>
        {lastBackup && (
          <p className="text-xs text-forma-muted">
            Dernière sauvegarde : {new Date(lastBackup).toLocaleString('fr-FR')}
          </p>
        )}
        <button
          type="button"
          className="w-full py-2 border rounded-lg dark:border-gray-600"
          onClick={async () => {
            const ok = await runAutoBackupIfDue()
            setSyncMsg(ok ? 'Slot cloud mis à jour.' : 'Pas encore due ou échec.')
          }}
        >
          Sauvegarder maintenant
        </button>
        <button
          type="button"
          className="w-full py-2 border rounded-lg dark:border-gray-600 text-sm"
          onClick={async () => {
            try {
              await saveBackupToCloudSlot()
              setSyncMsg('Copie locale « cloud slot » enregistrée (navigateur).')
            } catch (err) {
              setSyncMsg(err instanceof Error ? err.message : 'Erreur')
            }
          }}
        >
          Copie cloud locale (5 Mo max)
        </button>
        <button
          type="button"
          className="w-full py-2 border rounded-lg dark:border-gray-600 text-sm"
          onClick={async () => {
            try {
              const r = await restoreFromCloudSlot({ mode: 'replace' })
              const backup =
                r.preReplaceBackupFilename ?
                  ` · sauvegarde « ${r.preReplaceBackupFilename} » téléchargée`
                : ''
              setSyncMsg(`Restauré (remplacement) : ${r.notebooks} carnets, ${r.pages} pages${backup}.`)
            } catch (err) {
              setSyncMsg(err instanceof Error ? err.message : 'Erreur')
            }
          }}
        >
          Restaurer depuis cloud (remplacer)
        </button>
        <button
          type="button"
          className="w-full py-2 border rounded-lg dark:border-gray-600 text-sm text-forma-accent"
          onClick={async () => {
            try {
              const r = await restoreFromCloudSlot({ mode: 'merge' })
              const remap =
                [
                  r.remappedNotebooks ? `${r.remappedNotebooks} carnet(s)` : '',
                  r.remappedPages ? `${r.remappedPages} page(s)` : '',
                  r.remappedAssets ? `${r.remappedAssets} asset(s)` : '',
                ]
                  .filter(Boolean)
                  .join(', ')
              const remapMsg = remap ? ` · ids renommés : ${remap}` : ''
              setSyncMsg(`Fusionné depuis cloud : ${r.notebooks} carnets, ${r.pages} pages${remapMsg}.`)
            } catch (err) {
              setSyncMsg(err instanceof Error ? err.message : 'Erreur')
            }
          }}
        >
          Restaurer depuis cloud (fusionner)
        </button>
        {syncMsg && <p className="text-sm text-forma-accent">{syncMsg}</p>}
        <SyncQueuePanel />
      </section>

      <section className="mb-8 space-y-2">
        <h2 className="text-sm font-semibold text-forma-muted uppercase">Historique de navigation</h2>
        <p className="text-xs text-forma-muted">
          Efface les listes « Récents » et « pages récentes » de la palette (Ctrl+K).
        </p>
        <button
          type="button"
          className="w-full py-2 border rounded-lg dark:border-gray-600 text-sm"
          onClick={() => {
            clearRecentIds()
            clearRecentPages()
            setImportMsg('Historique de navigation effacé.')
          }}
        >
          Effacer carnets et pages récents
        </button>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-forma-muted uppercase mb-2">Raccourcis utiles</h2>
        <ul className="text-xs text-forma-muted space-y-1">
          <li><strong className="text-forma-text">Ctrl+K</strong> ou <strong className="text-forma-text">/</strong> — palette de commandes</li>
          <li><strong className="text-forma-text">Ctrl+F</strong> — recherche dans le document</li>
          <li><strong className="text-forma-text">Ctrl+Shift+S</strong> — version de page</li>
          <li><strong className="text-forma-text">Alt+← →</strong> — page précédente / suivante</li>
          <li>Dans l’éditeur : bouton <strong className="text-forma-text">?</strong> pour la liste complète</li>
        </ul>
      </section>

      <PwaSettingsSection />

      <section className="mb-8 space-y-2">
        <h2 className="text-sm font-semibold text-forma-muted uppercase">À propos</h2>
        <p className="text-xs text-forma-muted">
          Forma v{APP_VERSION} — données 100 % locales (IndexedDB)
        </p>
        <p className="text-xs text-forma-muted">OCR : français + anglais (Tesseract, traitement local)</p>
        <button
          type="button"
          className="text-xs text-forma-accent"
          onClick={() => {
            setOnboardingDone(false)
            setImportMsg('L’introduction s’affichera au prochain rechargement.')
          }}
        >
          Revoir l’introduction
        </button>
      </section>
    </div>
  )
}

function PwaSettingsSection() {
  const { supported, hasUpdate, isApplying, applyUpdate, checkForUpdate } = usePwaUpdate()
  const [checkMsg, setCheckMsg] = useState('')

  if (!supported) {
    return (
      <section className="mb-8 space-y-2">
        <h2 className="text-sm font-semibold text-forma-muted uppercase">Application (PWA)</h2>
        <p className="text-xs text-forma-muted">
          Service worker actif uniquement en production (<code>npm run build</code> + preview ou
          déploiement). En dev Vite, pas de cache offline.
        </p>
      </section>
    )
  }

  return (
    <section className="mb-8 space-y-3">
      <h2 className="text-sm font-semibold text-forma-muted uppercase">Application (PWA)</h2>
      <p className="text-xs text-forma-muted">
        Forma peut être installée et ouverte hors ligne. Le shell de l&apos;app est mis en cache ;
        vos carnets restent dans IndexedDB.
      </p>
      <p className="text-xs text-forma-muted">
        <strong className="text-forma-text">Mises à jour :</strong> une nouvelle version affiche une
        invite « Recharger » au lancement. Vous pouvez aussi vérifier manuellement ci-dessous
        (skipWaiting puis rechargement automatique).
      </p>
      {hasUpdate ? (
        <p className="text-xs text-forma-accent font-medium">Mise à jour disponible</p>
      ) : (
        <p className="text-xs text-forma-muted">Version installée à jour.</p>
      )}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={!hasUpdate || isApplying}
          className="w-full py-2 bg-forma-accent text-white rounded-lg text-sm disabled:opacity-50"
          onClick={() => void applyUpdate()}
        >
          {isApplying ? 'Application…' : 'Appliquer la mise à jour'}
        </button>
        <button
          type="button"
          className="w-full py-2 border rounded-lg dark:border-gray-600 text-sm"
          onClick={async () => {
            setCheckMsg('Vérification…')
            try {
              await checkForUpdate()
              setCheckMsg(
                getPwaUpdateState() === 'available'
                  ? 'Mise à jour trouvée.'
                  : 'Aucune mise à jour.',
              )
            } catch {
              setCheckMsg('Échec de la vérification.')
            }
          }}
        >
          Vérifier les mises à jour
        </button>
      </div>
      {checkMsg && <p className="text-xs text-forma-muted">{checkMsg}</p>}
    </section>
  )
}

function SyncQueuePanel() {
  const [count, setCount] = useState(0)

  const refresh = () => {
    import('../services/sync-queue').then(({ peekSyncQueue }) => setCount(peekSyncQueue().length))
  }

  useEffect(() => {
    refresh()
  }, [])

  return (
    <div className="mt-3 p-3 rounded-lg border border-forma-border bg-forma-surface/40 text-xs space-y-2">
      <p className="font-medium text-forma-muted">File sync future (local)</p>
      <p>{count} opération(s) en attente d’API cloud</p>
      <div className="flex gap-2">
        <button type="button" className="text-forma-accent" onClick={refresh}>
          Actualiser
        </button>
        <button
          type="button"
          className="text-red-600"
          onClick={() => {
            import('../services/sync-queue').then(({ clearSyncQueue }) => {
              clearSyncQueue()
              setCount(0)
            })
          }}
        >
          Vider
        </button>
      </div>
    </div>
  )
}
