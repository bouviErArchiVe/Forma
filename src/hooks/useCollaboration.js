import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  ensureProfile,
  getProfile,
  getFriends,
  getFriendRequests,
  getNotifications,
  getUnreadCount,
  getSharedWithMe,
  getSharedByMe,
  getSharedFolders,
} from '@/lib/collaboration'
import { mapSocialError } from '@/lib/userMessages'

export function useCollaboration() {
  const { user, isAuthenticated } = useAuth()
  const userId = user?.id
  const [profile, setProfile] = useState(null)
  const [friends, setFriends] = useState([])
  const [friendRequests, setFriendRequests] = useState([])
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [sharedWithMe, setSharedWithMe] = useState([])
  const [sharedByMe, setSharedByMe] = useState([])
  const [sharedFolders, setSharedFolders] = useState({ owned: [], member: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!userId) {
      setProfile(null)
      setFriends([])
      setFriendRequests([])
      setNotifications([])
      setUnreadCount(0)
      setSharedWithMe([])
      setSharedByMe([])
      setSharedFolders({ owned: [], member: [] })
      return
    }
    setLoading(true)
    setError(null)
    try {
      const p = await ensureProfile(user)
      setProfile(p)
      const [fr, reqs, notifs, unread, swm, sbm, folders] = await Promise.all([
        getFriends(userId),
        getFriendRequests(userId),
        getNotifications(userId),
        getUnreadCount(userId),
        getSharedWithMe(userId),
        getSharedByMe(userId),
        getSharedFolders(userId),
      ])
      setFriends(fr)
      setFriendRequests(reqs)
      setNotifications(notifs)
      setUnreadCount(unread)
      setSharedWithMe(swm)
      setSharedByMe(sbm)
      setSharedFolders(folders)
    } catch (e) {
      setError(mapSocialError(e))
    } finally {
      setLoading(false)
    }
  }, [userId, user])

  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    user,
    userId,
    isAuthenticated,
    profile,
    setProfile,
    friends,
    friendRequests,
    notifications,
    unreadCount,
    sharedWithMe,
    sharedByMe,
    sharedFolders,
    loading,
    error,
    refresh,
    getProfile,
  }
}
