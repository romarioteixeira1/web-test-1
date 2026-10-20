import { useState } from 'react'
import * as api from '../api/customers'
import { listPaymentMethods } from '../api/paymentMethods'
import { useApp, useTopbarSearch } from '../app/context'
import { useLoader, useOpenCreateOnArrival } from '../app/hooks'
import { CustomerFormModal } from '../components/customers/CustomerFormModal'
import { CustomerTable } from '../components/customers/CustomerTable'
import { Hero, HeroButton } from '../components/ui/Hero'
import { ErrorBox, ListCard, Loading, Segmented } from '../components/ui/ListCard'
import type { Customer, CustomerInput } from '../../shared/customer'
import { errorMessage, matches, share } from '../lib/format'

type ModalState = { mode: 'create' } | { mode: 'edit'; customer: Customer } | null
type Filter = 'all' | 'fornecedor' | 'comprador'

const filters = [
  ['all', 'Todos'],
  ['fornecedor', 'Fornecedores'],
  ['comprador', 'Compradores'],
] as const

export function CustomersPage() {
  const { toast, refreshCounts, setQuery } = useApp()
  const query = useTopbarSearch('Buscar por nome, documento ou cidade')
  const openCreate = useOpenCreateOnArrival()
  const [filter, setFilter] = useState<Filter>('all')
  const [modal, setModal] = useState<ModalState>(openCreate ? { mode: 'create' } : null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const { data, loading, error, reload } = useLoader(
    () => Promise.all([api.listCustomers(), listPaymentMethods()]),
    [],
    'Falha ao carregar clientes',
  )
  const customers = data?.[0] ?? []
  const paymentMethods = data?.[1] ?? []

  const suppliers = customers.filter((c) => c.relationship_type !== 'comprador').length
  const buyers = customers.filter((c) => c.relationship_type !== 'fornecedor').length

  const visible = customers.filter(
    (c) =>
      (filter === 'all' || c.relationship_type === filter || c.relationship_type === 'ambos') &&
      matches(query, c.name, c.document, c.city, c.email, c.company_name),
  )

  async function handleSubmit(input: CustomerInput) {
    setSubmitting(true)
    setFormError(null)
    try {
      if (modal?.mode === 'edit') {
        await api.updateCustomer(modal.customer.id, input)
        toast('Alterações salvas')
      } else {
        await api.createCustomer(input)
        toast('Cliente cadastrado com sucesso')
        setFilter('all')
        setQuery('')
      }
      setModal(null)
      refreshCounts()
      await reload({ silent: true })
    } catch (err) {
      setFormError(errorMessage(err, 'Falha ao salvar cliente'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(customer: Customer) {
    if (!window.confirm(`Excluir "${customer.name}"? As coletas e transações dele também serão excluídas.`)) return
    try {
      await api.deleteCustomer(customer.id)
      toast('Cliente excluído')
      refreshCounts()
      await reload({ silent: true })
    } catch (err) {
      toast(errorMessage(err, 'Falha ao excluir cliente'), 'error')
    }
  }

  return (
    <div className="page fill">
      <Hero
        chip="ECOCONTROL · CADASTROS"
        title="Clientes"
        subtitle="Todos os seus fornecedores e compradores em um só lugar."
        stats={[
          { label: 'Clientes', value: customers.length, share: 100 },
          { label: 'Fornecedores', value: suppliers, share: share(suppliers, customers.length) },
          { label: 'Compradores', value: buyers, share: share(buyers, customers.length) },
        ]}
      >
        <HeroButton label="Novo cliente" onClick={() => setModal({ mode: 'create' })} />
      </Hero>

      {error ? (
        <ErrorBox message={error} onRetry={() => reload()} />
      ) : (
        <ListCard
          title="Lista de clientes"
          count={visible.length}
          actions={<Segmented label="Filtrar por tipo" value={filter} options={filters} onChange={setFilter} />}
        >
          {loading ? (
            <Loading />
          ) : (
            <CustomerTable
              customers={visible}
              onEdit={(customer) => setModal({ mode: 'edit', customer })}
              onDelete={handleDelete}
            />
          )}
        </ListCard>
      )}

      {modal && (
        <CustomerFormModal
          mode={modal.mode}
          initialValue={modal.mode === 'edit' ? modal.customer : undefined}
          paymentMethods={paymentMethods}
          submitting={submitting}
          error={formError}
          onSubmit={handleSubmit}
          onCancel={() => {
            setModal(null)
            setFormError(null)
          }}
        />
      )}
    </div>
  )
}
