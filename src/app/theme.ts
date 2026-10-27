import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

/**
 * localStorage key for the chosen theme. The inline script in index.html reads
 * it too, so the right theme is set before the first paint.
 */
const STORAGE_KEY = 'ecocontrol-theme'

const systemDark = () => window.matchMedia('(prefers-color-scheme: dark)')

function savedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

/** Browser/status bar color on phones and in the installed app: the top bar's surface color. */
const barColors: Record<Theme, string> = { light: '#ffffff', dark: '#1a1e16' }

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', barColors[theme])
}

/** Current theme plus a toggle that remembers the choice in this browser. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
  )

  // Until someone picks a theme, follow the system setting as it changes.
  useEffect(() => {
    const media = systemDark()
    function onChange() {
      if (savedTheme()) return
      const next = media.matches ? 'dark' : 'light'
      applyTheme(next)
      setTheme(next)
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setTheme(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Private mode or blocked storage: the choice just lasts until the page reloads.
    }
  }

  return { theme, toggleTheme }
}
