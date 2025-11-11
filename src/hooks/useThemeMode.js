import { useEffect, useState } from 'react'

const STORAGE_KEY = 'evalua-theme'

export function useThemeMode() {
  const getIsDark = () => {
    if (typeof document === 'undefined') {
      return false
    }
    return document.documentElement.classList.contains('dark')
  }

  const [isDark, setIsDark] = useState(getIsDark)

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined
    }

    const root = document.documentElement

    const observer = new MutationObserver(() => {
      setIsDark(root.classList.contains('dark'))
    })

    observer.observe(root, { attributes: true, attributeFilter: ['class'] })

    const handleStorage = (event) => {
      if (event.key === STORAGE_KEY) {
        setIsDark(root.classList.contains('dark'))
      }
    }

    window.addEventListener('storage', handleStorage)

    setIsDark(root.classList.contains('dark'))

    return () => {
      observer.disconnect()
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  return isDark
}
