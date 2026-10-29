import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Company } from '../../shared/company'
import { getCompany } from '../api/company'
import { listCustomers } from '../api/customers'
import { listMaterials } from '../api/materials'
import { listPaymentMethods } from '../api/paymentMethods'
import { IconCheck, IconClose } from '../components/layout/icons'
import { AppContext, type Counts, type ToastTone } from './context'

type ToastState = { id: number; message: string; tone: ToastTone }

export function AppProvider({ children }: { children: ReactNode }) {
  const [searchPlaceholder, setSearchPlaceholder] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [counts, setCounts] = useState<Counts | null>(null)
  const [company, setCompany] = useState<Company | null | undefined>(undefined)
  const [toastState, setToastState] = useState<ToastState | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const refreshCounts = useCallback(() => {
    Promise.all([listCustomers(), listMaterials(), listPaymentMethods()])
      .then(([customers, materials, paymentMethods]) =>
        setCounts({
          customers: customers.length,
          materials: materials.length,
          paymentMethods: paymentMethods.length,
        }),
      )
      .catch(() => setCounts(null))
  }, [])

  useEffect(() => {
    refreshCounts()
  }, [refreshCounts])

  useEffect(() => {
    getCompany()
      .then(setCompany)
      .catch(() => setCompany(null))
  }, [])

  const toast = useCallback((message: string, tone: ToastTone = 'success') => {
    clearTimeout(toastTimer.current)
    setToastState({ id: Date.now(), message, tone })
    toastTimer.current = setTimeout(() => setToastState(null), tone === 'error' ? 4200 : 2600)
  }, [])

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  const value = useMemo(
    () => ({ searchPlaceholder, setSearchPlaceholder, query, setQuery, counts, refreshCounts, company, setCompany, toast }),
    [searchPlaceholder, query, counts, refreshCounts, company, toast],
  )

  return (
    <AppContext.Provider value={value}>
      {children}
      {toastState && (
        <div
          key={toastState.id}
          className={`toast print:hidden ${toastState.tone === 'error' ? 'error' : ''}`}
          role={toastState.tone === 'error' ? 'alert' : 'status'}
        >
          {toastState.tone === 'error' ? (
            <IconClose className="shrink-0" />
          ) : (
            <IconCheck className="shrink-0 text-green-300" />
          )}
          <span>{toastState.message}</span>
        </div>
      )}
    </AppContext.Provider>
  )
}
