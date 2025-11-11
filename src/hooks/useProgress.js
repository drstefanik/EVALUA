// Salva/recupera avanzamenti per studente con fallback a localStorage
import { useEffect, useMemo, useState, useCallback } from 'react'
const API_BASE = import.meta.env.VITE_AUTH_API ?? '/api'

export default function useProgress(token, studentId) {
  const lsKey = useMemo(() => `evalua_progress_${studentId || 'anon'}`, [studentId])
  const [map, setMap] = useState({}) // { [fileId]: { seconds, completed } }
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      try {
        if (token) {
          const r = await fetch(`${API_BASE}/content/progress`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (r.ok) {
            const data = await r.json()
            if (active) setMap(data?.progress || {})
          } else {
            const raw = localStorage.getItem(lsKey)
            if (active) setMap(raw ? JSON.parse(raw) : {})
          }
        } else {
          const raw = localStorage.getItem(lsKey)
          if (active) setMap(raw ? JSON.parse(raw) : {})
        }
      } catch {
        const raw = localStorage.getItem(lsKey)
        if (active) setMap(raw ? JSON.parse(raw) : {})
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [token, lsKey])

  useEffect(() => {
    // persiste sempre anche in localStorage
    localStorage.setItem(lsKey, JSON.stringify(map))
  }, [map, lsKey])

  const upsert = useCallback(async (fileId, patch) => {
    setMap(prev => {
      const cur = prev[fileId] || { seconds: 0, completed: false }
      const next = { ...cur, ...patch }
      return { ...prev, [fileId]: next }
    })
    try {
      if (token) {
        await fetch(`${API_BASE}/content/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ fileId, ...patch }),
        })
      }
    } catch { /* fallback già gestito */ }
  }, [token])

  return { progress: map, loading, upsert }
}
