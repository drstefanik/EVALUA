import { useCallback, useEffect, useState } from 'react'
import { getStoredCurrentUser, persistCurrentUser, refreshCurrentUser } from '../api.js'

export function useCurrentUser(options = {}) {
  const { skipInitialRefresh = false } = options
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return getStoredCurrentUser()
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(() => !currentUser)
  const [error, setError] = useState(null)

  const updateCurrentUser = useCallback((value) => {
    if (!value) {
      persistCurrentUser(null)
      setCurrentUser(null)
      return null
    }
    const stored = persistCurrentUser(value)
    setCurrentUser(stored)
    return stored
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const next = await refreshCurrentUser()
      setCurrentUser(next)
      setError(null)
      return next
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (skipInitialRefresh) {
      setLoading(false)
      return undefined
    }

    let active = true
    ;(async () => {
      try {
        await refresh()
      } catch {
        if (active) {
          setLoading(false)
        }
      }
    })()

    return () => {
      active = false
    }
  }, [refresh, skipInitialRefresh])

  useEffect(() => {
    const handleStorage = () => {
      try {
        setCurrentUser(getStoredCurrentUser())
      } catch {
        setCurrentUser(null)
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  return {
    currentUser,
    loading,
    error,
    refresh,
    setCurrentUser: updateCurrentUser,
  }
}
