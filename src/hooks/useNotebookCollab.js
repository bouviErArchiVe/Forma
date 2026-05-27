import { useState, useEffect, useRef, useCallback } from 'react'
import useAppStore from '@/stores/useAppStore'
import { resolveNotebookAccess, createCollabChannel } from '@/lib/collabManager'

export function useNotebookCollab({
  notebookId,
  notebookOwnerId,
  userId,
  userName,
  userColor,
  onRemotePageUpdate,
}) {
  const setRemoteCursors = useAppStore((s) => s.setRemoteCursors)
  const remoteCursors = useAppStore((s) => s.remoteCursors)
  const channelRef = useRef(null)

  const [access, setAccess] = useState({
    permission: 'edit',
    readOnly: false,
    forcedReadOnly: false,
    isOwner: true,
    isShared: false,
  })

  useEffect(() => {
    let cancelled = false
    resolveNotebookAccess(notebookId, userId, notebookOwnerId).then((a) => {
      if (!cancelled) setAccess(a)
    })
    return () => { cancelled = true }
  }, [notebookId, userId, notebookOwnerId])

  useEffect(() => {
    if (!notebookId || !userId) {
      setRemoteCursors([])
      return undefined
    }

    const channel = createCollabChannel({
      notebookId,
      userId,
      userName,
      onCursors: setRemoteCursors,
      onPageUpdate: onRemotePageUpdate,
    })
    channelRef.current = channel

    const staleTimer = setInterval(() => {
      setRemoteCursors((prev) => prev.filter((c) => Date.now() - (c.ts || 0) < 5000))
    }, 3000)

    return () => {
      clearInterval(staleTimer)
      channel.destroy()
      channelRef.current = null
      setRemoteCursors([])
    }
  }, [notebookId, userId, userName, onRemotePageUpdate, setRemoteCursors])

  const broadcastCursor = useCallback((x, y) => {
    channelRef.current?.broadcastCursor(x, y, userColor)
  }, [userColor])

  return { ...access, remoteCursors, broadcastCursor }
}
