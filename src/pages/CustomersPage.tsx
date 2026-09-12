import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import * as api from '../api/customers'
import { CustomerFormModal } from '../components/customers/CustomerFormModal'
import { CustomerTable } from '../components/customers/CustomerTable'
import type { Customer, CustomerInput } from '../../shared/customer'

type ModalState = { mode: 'create' } | { mode: 'edit'; customer: Customer } | null

export function CustomersPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('busca') ?? ''
  const openCreateOnLoad = (location.state as { openCreate?: boolean } | null)?.openCreate ?? false
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState>(openCreateOnLoad ? { mode: 'create' } : null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (openCreateOnLoad) navigate(location.pathname, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load(q?: string) {
    setLoading(true)
    setLoadError(null)
    try {
      setCustomers(await api.listCustomers(q))
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Falha ao carregar clientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(query)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  async function handleSubmit(input: CustomerInput) {
    setSubmitting(true)
    setFormError(null)
    try {
      if (modal?.mode === 'edit') {
        await api.updateCustomer(modal.customer.id, input)
      } else {
        await api.createCustomer(input)
      }
      setModal(null)
      await load(query)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Falha ao salvar cliente')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(customer: Customer) {
    if (!window.confirm(`Excluir o cliente "${customer.name}"?`)) return
    await api.deleteCustomer(customer.id)
    await load(query)
  }

  return (
    <section className="flex w-full flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h2 className="text-2xl font-medium text-text-strong">Clientes</h2>
        <button
          type="button"
          onClick={() => setModal({ mode: 'create' })}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-accent-strong hover:shadow-md active:scale-95"
        >
          Novo cliente
        </button>
      </div>

      {query && (
        <p className="text-sm">
          Resultados para <span className="text-text-strong">"{query}"</span>
        </p>
      )}

      {loading && <p className="text-sm">Carregando...</p>}
      {loadError && <p className="text-sm text-red-500">{loadError}</p>}
      {!loading && !loadError && (
        <CustomerTable
          customers={customers}
          onEdit={(customer) => setModal({ mode: 'edit', customer })}
          onDelete={handleDelete}
        />
      )}

      {modal && (
        <CustomerFormModal
          title={modal.mode === 'edit' ? 'Editar cliente' : 'Novo cliente'}
          initialValue={modal.mode === 'edit' ? modal.customer : undefined}
          submitting={submitting}
          error={formError}
          onSubmit={handleSubmit}
          onCancel={() => {
            setModal(null)
            setFormError(null)
          }}
        />
      )}
    </section>
  )
}
