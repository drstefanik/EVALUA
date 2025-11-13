import { useEffect, useState } from 'react'

const STORAGE_KEY = 'evalua-theme'

export function useThemeMode() {
  const getIsDark = () => {
    if (typeof document === 'undefined') {
      return false
    }
    const root = document.documentElement
    return root.classList.contains('dark') || root.getAttribute('data-theme') === 'dark'
  }

  const [isDark, setIsDark] = useState(getIsDark)

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined
    }

    const root = document.documentElement

    const observer = new MutationObserver(() => {
      setIsDark(getIsDark())
    })

    observer.observe(root, { attributes: true, attributeFilter: ['class', 'data-theme'] })

    const handleStorage = (event) => {
      if (event.key === STORAGE_KEY) {
        setIsDark(getIsDark())
      }
    }

    window.addEventListener('storage', handleStorage)

    setIsDark(getIsDark())

    return () => {
      observer.disconnect()
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  return isDark
}
