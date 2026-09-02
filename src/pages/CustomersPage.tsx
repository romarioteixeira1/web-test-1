import { useEffect, useState } from 'react'
import * as api from '../api/customers'
import { CustomerFormModal } from '../components/customers/CustomerFormModal'
import { CustomerTable } from '../components/customers/CustomerTable'
import type { Customer, CustomerInput } from '../../shared/customer'

type ModalState = { mode: 'create' } | { mode: 'edit'; customer: Customer } | null

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

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
    load()
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => load(query), 300)
    return () => clearTimeout(timeout)
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
    <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-medium text-text-strong">Clientes</h1>
        <button
          type="button"
          onClick={() => setModal({ mode: 'create' })}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white"
        >
          Novo cliente
        </button>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por nome, email ou documento..."
        className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent sm:max-w-sm"
      />

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
