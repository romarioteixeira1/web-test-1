import { createContext, useContext, useEffect } from 'react'
import type { Company } from '../../shared/company'
import type { CountKey } from '../components/layout/navigation'

export type Counts = Record<CountKey, number>

export type ToastTone = 'success' | 'error'

export type AppContextValue = {
  /** Topbar search: enabled while a list screen is mounted. */
  searchPlaceholder: string | null
  setSearchPlaceholder: (placeholder: string | null) => void
  query: string
  setQuery: (query: string) => void

  /** Item counts shown in the sidebar. */
  counts: Counts | null
  refreshCounts: () => void

  /** The user's company: undefined while loading, null until it is registered. */
  company: Company | null | undefined
  setCompany: (company: Company | null) => void

  toast: (message: string, tone?: ToastTone) => void
}

export const AppContext = createContext<AppContextValue | null>(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}

export function useToast() {
  return useApp().toast
}

/** Turns on the topbar search for the current screen and returns what the user typed. */
export function useTopbarSearch(placeholder: string) {
  const { setSearchPlaceholder, setQuery, query } = useApp()

  useEffect(() => {
    setSearchPlaceholder(placeholder)
    return () => {
      setSearchPlaceholder(null)
      setQuery('')
    }
  }, [placeholder, setSearchPlaceholder, setQuery])

  return query
}
