import { useRef, useState } from 'react'
import { ExportRangeDialog } from './ExportRangeDialog'
import { exportNotebookZip } from '../../lib/backup'
import { exportPageJson, mergePageFromJson, parsePageJsonFile } from '../../lib/page-json'
import {
  exportNotebookPngZip,
  exportNotebookToPdf,
  exportPageToPng,
  exportPageToSvg,
} from '../../lib/pdf-export'
import { exportNotebookToVectorPdf } from '../../lib/pdf-vector-export'
import { downloadNotebookMarkdown, downloadPageMarkdown } from '../../lib/notebook-markdown'
import { exportNotebookVectorSvgZip, exportPageToVectorSvg } from '../../lib/vector-svg-export'
import { printNotebookPages } from '../../lib/print-document'
import { appendPdfToNotebook } from '../../services/library'
import { getPages } from '../../services/pages'
import { useToastStore } from '../../stores/toastStore'
import type { Notebook, Page } from '../../types'

interface ExportMenuProps {
  notebook: Notebook
  activePage: Page
  pageIndex: number
  pageCount: number
  onAppendPdf: (count: number) => void
  onImportJson: (page: Page) => void
  onExporting?: (busy: boolean) => void
}

export function ExportMenu({
  notebook,
  activePage,
  pageIndex,
  pageCount,
  onAppendPdf,
  onImportJson,
  onExporting,
}: ExportMenuProps) {
  const [open, setOpen] = useState(false)
  const [rangePdf, setRangePdf] = useState(false)
  const [rangeZip, setRangeZip] = useState(false)
  const pdfAppendRef = useRef<HTMLInputElement>(null)
  const jsonImportRef = useRef<HTMLInputElement>(null)

  const run = async (label: string, fn: () => Promise<void>) => {
    onExporting?.(true)
    setOpen(false)
    try {
      await fn()
      useToastStore.getState().show(`${label} terminé`)
    } catch (err) {
      useToastStore.getState().show(err instanceof Error ? err.message : `${label} échoué`, 6000)
    } finally {
      onExporting?.(false)
    }
  }

  const items: { label: string; deferred?: boolean; testId?: string; action: () => void | Promise<void> }[] = [
    {
      label: 'PNG — page active',
      action: () =>
        exportPageToPng(
          activePage,
          `${notebook.name}-p${pageIndex + 1}.png`,
          undefined,
          notebook,
        ),
    },
    {
      label: 'SVG — page active (image)',
      action: () =>
        exportPageToSvg(
          activePage,
          `${notebook.name}-p${pageIndex + 1}.svg`,
          undefined,
          notebook,
        ),
    },
    {
      label: 'SVG — page active (vecteur)',
      action: async () =>
        exportPageToVectorSvg(
          activePage,
          `${notebook.name}-p${pageIndex + 1}-vector.svg`,
          notebook.orientation,
          notebook,
        ),
    },
    {
      label: 'JSON — page active',
      action: () => exportPageJson(activePage, `${notebook.name}-p${pageIndex + 1}.json`),
    },
    {
      label: 'Markdown — page active',
      action: () => downloadPageMarkdown(activePage, notebook.name, pageIndex + 1),
    },
    {
      label: 'Markdown — carnet entier',
      action: async () => {
        const pages = await getPages(notebook.id)
        downloadNotebookMarkdown(notebook, pages)
      },
    },
    {
      label: 'ZIP — SVG vecteur (carnet)',
      action: async () => {
        const pages = await getPages(notebook.id)
        await exportNotebookVectorSvgZip(
          pages,
          notebook.name,
          notebook.orientation,
          (i, t) => useToastStore.getState().show(`SVG… ${i}/${t}`, 2000),
          notebook,
        )
      },
    },
    {
      label: 'ZIP — toutes les pages (PNG)',
      action: async () => {
        const pages = await getPages(notebook.id)
        await exportNotebookPngZip(
          pages,
          notebook.name,
          notebook.orientation,
          (i, t) => useToastStore.getState().show(`ZIP… ${i}/${t}`, 2000),
          undefined,
          notebook,
        )
      },
    },
    {
      label: 'PDF — carnet entier',
      action: async () => {
        const pages = await getPages(notebook.id)
        await exportNotebookToPdf(
          pages,
          `${notebook.name}.pdf`,
          notebook.orientation,
          (i, t) => useToastStore.getState().show(`PDF… ${i}/${t}`, 2000),
          undefined,
          notebook,
        )
      },
      testId: 'export-pdf-notebook',
    },
    {
      label: 'PDF vectoriel — carnet entier',
      action: async () => {
        const pages = await getPages(notebook.id)
        await exportNotebookToVectorPdf(
          pages,
          `${notebook.name}-vector.pdf`,
          notebook.orientation,
          undefined,
          (i, t) => useToastStore.getState().show(`PDF vectoriel… ${i}/${t}`, 2000),
          notebook,
        )
      },
    },
    {
      label: 'PDF — plage de pages…',
      deferred: true,
      action: () => setRangePdf(true),
    },
    {
      label: 'ZIP — plage de pages (PNG)…',
      deferred: true,
      action: () => setRangeZip(true),
    },
    {
      label: '.forma — sauvegarde carnet',
      action: () => exportNotebookZip(notebook.id, notebook.name),
    },
    {
      label: 'Imprimer le carnet',
      action: async () =>
        printNotebookPages(await getPages(notebook.id), notebook.orientation, notebook),
    },
    { label: '+ PDF — ajouter des pages', action: () => pdfAppendRef.current?.click() },
    { label: '↥ JSON — importer dans la page', action: () => jsonImportRef.current?.click() },
  ]

  return (
    <div className="relative">
      <button
        type="button"
        data-testid="export-menu-trigger"
        onClick={() => setOpen(!open)}
        className="text-sm px-2 py-1 border rounded-lg bg-forma-surface"
        title="Exporter, importer, imprimer"
      >
        Exporter ▾
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-40 mt-1 min-w-[220px] bg-forma-surface border border-forma-border rounded-lg shadow-lg py-1 text-sm">
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                data-testid={item.testId}
                className="block w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => {
                  if (item.deferred) {
                    setOpen(false)
                    item.action()
                    return
                  }
                  void run(item.label.split('—')[0].trim(), async () => {
                    await item.action()
                  })
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
      <input
        ref={pdfAppendRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0]
          if (!f) return
          await run('PDF ajouté', async () => {
            const n = await appendPdfToNotebook(notebook.id, f)
            onAppendPdf(n)
          })
          e.target.value = ''
        }}
      />
      <input
        ref={jsonImportRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0]
          if (!f) return
          try {
            const imported = await parsePageJsonFile(f)
            onImportJson(mergePageFromJson(activePage, imported))
            useToastStore.getState().show('JSON importé')
          } catch {
            useToastStore.getState().show('JSON invalide', 5000)
          }
          e.target.value = ''
        }}
      />
      {rangePdf && (
        <ExportRangeDialog
          pageCount={pageCount}
          defaultFrom={pageIndex + 1}
          defaultTo={pageIndex + 1}
          onClose={() => setRangePdf(false)}
          onExport={(from, to) =>
            void run('PDF plage', async () => {
              const pages = await getPages(notebook.id)
              const slice = pages.slice(from - 1, to)
              await exportNotebookToPdf(
                slice,
                `${notebook.name}-p${from}-${to}.pdf`,
                notebook.orientation,
                (i, t) => useToastStore.getState().show(`PDF… ${i}/${t}`, 2000),
                undefined,
                notebook,
              )
            })
          }
        />
      )}
      {rangeZip && (
        <ExportRangeDialog
          pageCount={pageCount}
          defaultFrom={pageIndex + 1}
          defaultTo={pageIndex + 1}
          onClose={() => setRangeZip(false)}
          onExport={(from, to) =>
            void run('ZIP plage', async () => {
              const pages = await getPages(notebook.id)
              const slice = pages.slice(from - 1, to)
              await exportNotebookPngZip(
                slice,
                `${notebook.name}-p${from}-${to}`,
                notebook.orientation,
                (i, t) => useToastStore.getState().show(`ZIP… ${i}/${t}`, 2000),
                undefined,
                notebook,
              )
            })
          }
        />
      )}
    </div>
  )
}
