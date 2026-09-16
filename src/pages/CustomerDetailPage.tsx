import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import * as api from '../api/customers'
import { CollectionFormModal } from '../components/customers/CollectionFormModal'
import { paymentMethodLabels, relationshipTypeLabels, type Customer } from '../../shared/customer'
import type { Collection, CollectionInput } from '../../shared/collection'

function formatDateOnly(value: string) {
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

function formatDateTime(value: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatWeight(value: number) {
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg`
}

type ModalState = { mode: 'create' } | { mode: 'edit'; collection: Collection } | null

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const customerId = Number(id)

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [filterQuery, setFilterQuery] = useState('')
  const [filterType, setFilterType] = useState<'' | 'material' | 'servico'>('')

  async function load() {
    setLoading(true)
    setLoadError(null)
    try {
      const [customerData, collectionsData] = await Promise.all([
        api.getCustomer(customerId),
        api.listCollections(customerId),
      ])
      setCustomer(customerData)
      setCollections(collectionsData)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Falha ao carregar cliente')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId])

  async function handleSubmitCollection(input: CollectionInput) {
    setSubmitting(true)
    setFormError(null)
    try {
      if (modal?.mode === 'edit') {
        await api.updateCollection(modal.collection.id, input)
      } else {
        await api.createCollection(customerId, input)
      }
      setModal(null)
      const collectionsData = await api.listCollections(customerId)
      setCollections(collectionsData)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Falha ao salvar coleta')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteCollection(collection: Collection) {
    if (!window.confirm(`Excluir a coleta "${collection.description}"?`)) return
    await api.deleteCollection(collection.id)
    setCollections((list) => list.filter((c) => c.id !== collection.id))
  }

  if (loading) {
    return (
      <section className="flex w-full flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <p className="text-sm">Carregando...</p>
      </section>
    )
  }

  if (loadError || !customer) {
    return (
      <section className="flex w-full flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <p className="text-sm text-red-500">{loadError ?? 'Cliente não encontrado'}</p>
        <button
          type="button"
          onClick={() => navigate('/clientes')}
          className="self-start text-sm text-accent hover:underline"
        >
          Voltar para clientes
        </button>
      </section>
    )
  }

  const total = collections.reduce((sum, item) => sum + item.amount, 0)
  const totalWeight = collections.reduce((sum, item) => sum + (item.weight_kg ?? 0), 0)

  const filteredCollections = collections.filter((item) => {
    if (filterType && item.type !== filterType) return false
    const q = filterQuery.trim().toLowerCase()
    if (!q) return true
    const haystack = [item.description, item.material_type, item.notes].filter(Boolean).join(' ').toLowerCase()
    return haystack.includes(q)
  })

  return (
    <section className="flex w-full flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-1">
        <Link to="/clientes" className="text-sm text-accent transition-colors hover:text-accent-strong hover:underline">
          ← Voltar para clientes
        </Link>
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-medium text-text-strong">{customer.name}</h2>
            {customer.person_type === 'juridica' && customer.company_name && (
              <p className="text-sm">{customer.company_name}</p>
            )}
            <p className="text-sm">
              {customer.email || '—'} {customer.phone ? `· ${customer.phone}` : ''}
              {customer.document ? ` · ${customer.document}` : ''}
              {customer.person_type === 'juridica' && customer.state_registration
                ? ` · IE ${customer.state_registration}`
                : ''}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-text-strong">
                {relationshipTypeLabels[customer.relationship_type]}
              </span>
              <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-text-strong">
                {customer.person_type === 'juridica' ? 'Pessoa jurídica' : 'Pessoa física'}
              </span>
              {customer.payment_method && (
                <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-text-strong">
                  Pagamento: {paymentMethodLabels[customer.payment_method]}
                </span>
              )}
            </div>
          </div>
          <span
            className={
              customer.status === 'active'
                ? 'rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent'
                : 'rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-red-500'
            }
          >
            {customer.status === 'active' ? 'Ativo' : 'Inativo'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md">
          <p className="text-sm">Total de coletas</p>
          <p className="mt-1 text-3xl font-semibold text-text-strong">{collections.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md">
          <p className="text-sm">Peso total coletado</p>
          <p className="mt-1 text-3xl font-semibold text-accent">{formatWeight(totalWeight)}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md">
          <p className="text-sm">Valor total movimentado</p>
          <p className="mt-1 text-3xl font-semibold text-accent">{formatCurrency(total)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <h3 className="text-lg font-medium text-text-strong">Coletas</h3>
          <button
            type="button"
            onClick={() => setModal({ mode: 'create' })}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-accent-strong hover:shadow-md active:scale-95"
          >
            Nova coleta
          </button>
        </div>

        {collections.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="search"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Buscar por descrição, material ou observações..."
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20 sm:max-w-xs"
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as typeof filterType)}
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20 sm:w-48"
            >
              <option value="">Todos os tipos</option>
              <option value="material">Material</option>
              <option value="servico">Serviço</option>
            </select>
          </div>
        )}

        {collections.length === 0 ? (
          <p className="py-6 text-center text-sm">Nenhuma coleta registrada ainda.</p>
        ) : filteredCollections.length === 0 ? (
          <p className="py-6 text-center text-sm">Nenhuma coleta encontrada com esse filtro.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-surface text-text-strong">
                <tr>
                  <th className="px-4 py-3 font-medium">Descrição</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Material</th>
                  <th className="px-4 py-3 font-medium">Valor</th>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Agendamento</th>
                  <th className="px-4 py-3 font-medium">Observações</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {filteredCollections.map((item) => (
                  <tr key={item.id} className="border-t border-border transition-colors hover:bg-surface">
                    <td className="px-4 py-3 text-text-strong">{item.description}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={
                          item.type === 'material'
                            ? 'rounded-full bg-accent-soft px-2 py-1 text-xs font-medium text-accent'
                            : 'rounded-full bg-surface px-2 py-1 text-xs font-medium text-text-strong'
                        }
                      >
                        {item.type === 'material' ? 'Material' : 'Serviço'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.type === 'material'
                        ? [item.material_type, item.weight_kg != null ? formatWeight(item.weight_kg) : null]
                            .filter(Boolean)
                            .join(' · ') || '—'
                        : '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-accent">{formatCurrency(item.amount)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDateOnly(item.collected_at)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(item.scheduled_at)}</td>
                    <td className="px-4 py-3">{item.notes || '—'}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setModal({ mode: 'edit', collection: item })}
                        className="mr-3 font-medium transition-colors hover:text-accent"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCollection(item)}
                        className="font-medium transition-colors hover:text-red-500"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <CollectionFormModal
          title={modal.mode === 'edit' ? 'Editar coleta' : 'Nova coleta'}
          initialValue={modal.mode === 'edit' ? modal.collection : undefined}
          submitting={submitting}
          error={formError}
          onSubmit={handleSubmitCollection}
          onCancel={() => {
            setModal(null)
            setFormError(null)
          }}
        />
      )}
    </section>
  )
}
