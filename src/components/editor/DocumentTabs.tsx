import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { flushAllPending } from '../../services/autosave'
import { getNotebook } from '../../services/library'
import { useTabsStore } from '../../stores/tabsStore'
export function DocumentTabs() {
  const navigate = useNavigate()
  const { openIds, activeId, closeTab, closeAllTabs, closeOtherTabs, setActive } = useTabsStore()
  const [names, setNames] = useState<Record<string, string>>({})

  useEffect(() => {
    openIds.forEach(async (id) => {
      const nb = await getNotebook(id)
      if (nb) setNames((n) => ({ ...n, [id]: nb.name }))
    })
  }, [openIds])

  if (!openIds.length) return null

  return (
    <div className="flex items-center gap-0.5 px-2 py-1 bg-gray-100 border-b border-forma-border overflow-x-auto shrink-0">
      {openIds.map((id) => (
        <div
          key={id}
          className={`flex items-center gap-1 px-3 py-1 rounded-t text-sm cursor-pointer shrink-0 ${
            activeId === id ? 'bg-forma-surface shadow-sm' : 'hover:bg-white/80'
          }`}
        >
          <button type="button" className="truncate max-w-[120px]" onClick={() => {
            setActive(id)
            navigate(`/document/${id}`)
          }}>
            {names[id] ?? '…'}
          </button>
          <button
            type="button"
            className="text-forma-muted hover:text-red-500 ml-1"
            title="Fermer l’onglet (clic molette aussi)"
            onMouseDown={(e) => {
              if (e.button !== 1) return
              e.preventDefault()
              void flushAllPending().then(() => {
                const next = closeTab(id)
                if (next) navigate(`/document/${next}`)
                else navigate('/')
              })
            }}
            onClick={(e) => {
              e.stopPropagation()
              void flushAllPending().then(() => {
                const next = closeTab(id)
                if (next) navigate(`/document/${next}`)
                else if (openIds.length <= 1) navigate('/')
              })
            }}
          >
            ×
          </button>
        </div>
      ))}
      {openIds.length > 1 && activeId && (
        <>
          <button
            type="button"
            className="text-xs text-forma-muted hover:text-forma-accent px-2 shrink-0"
            title="Garder uniquement cet onglet"
            onClick={() => {
              void flushAllPending().then(() => closeOtherTabs(activeId))
            }}
          >
            Autres ×
          </button>
          <button
            type="button"
            className="text-xs text-forma-muted hover:text-red-500 px-2 shrink-0"
            title="Fermer tous les onglets"
            onClick={() => {
              void flushAllPending().then(() => {
                closeAllTabs()
                navigate('/')
              })
            }}
          >
            Tout fermer
          </button>
        </>
      )}
    </div>
  )
}

export function useOpenDocument(id: string | undefined) {
  const { openTab } = useTabsStore()
  useEffect(() => {
    if (id) openTab(id)
  }, [id, openTab])
}
