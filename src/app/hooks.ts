import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { errorMessage } from '../lib/format'

/** Loads data on mount (and when `deps` change) with loading/error state and a manual reload. */
export function useLoader<T>(load: () => Promise<T>, deps: DependencyList, fallbackError = 'Falha ao carregar dados') {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const loadRef = useRef(load)
  loadRef.current = load
  const requestId = useRef(0)

  const reload = useCallback(
    async (options?: { silent?: boolean }) => {
      const id = ++requestId.current
      if (!options?.silent) setLoading(true)
      setError(null)
      try {
        const result = await loadRef.current()
        if (id === requestId.current) setData(result)
      } catch (err) {
        if (id === requestId.current) setError(errorMessage(err, fallbackError))
      } finally {
        if (id === requestId.current) setLoading(false)
      }
    },
    [fallbackError],
  )

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, setData, loading, error, reload }
}

/**
 * True when the screen was opened by a "Novo …" shortcut (navigate(path, { state: { openCreate: true } })).
 * Clears the flag from history so a reload doesn't reopen the form.
 */
export function useOpenCreateOnArrival() {
  const location = useLocation()
  const navigate = useNavigate()
  const [openCreate] = useState(() => Boolean((location.state as { openCreate?: boolean } | null)?.openCreate))

  useEffect(() => {
    if (openCreate) navigate(location.pathname + location.search, { replace: true, state: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return openCreate
}
