import { useEffect, useState } from 'react'
import * as api from '../api/collections'
import * as customersApi from '../api/customers'
import { CollectionFormModal } from '../components/collections/CollectionFormModal'
import { CollectionTable } from '../components/collections/CollectionTable'
import type { Customer } from '../../shared/customer'
import type { CollectionInput, CollectionWithCustomer } from '../../shared/collection'

type ModalState = { mode: 'create' } | { mode: 'edit'; collection: CollectionWithCustomer } | null

export function CollectionsPage() {
  const [collections, setCollections] = useState<CollectionWithCustomer[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
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
      const [collectionsData, customersData] = await Promise.all([
        api.listCollections(),
        customersApi.listCustomers(),
      ])
      setCollections(collectionsData)
      setCustomers(customersData)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Falha ao carregar coletas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSubmit(input: CollectionInput) {
    setSubmitting(true)
    setFormError(null)
    try {
      if (modal?.mode === 'edit') {
        await api.updateCollection(modal.collection.id, input)
      } else {
        await api.createCollection(input)
      }
      setModal(null)
      await load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Falha ao salvar coleta')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(collection: CollectionWithCustomer) {
    if (!window.confirm(`Excluir a coleta "${collection.description}"?`)) return
    await api.deleteCollection(collection.id)
    setCollections((list) => list.filter((c) => c.id !== collection.id))
  }

  const filteredCollections = collections.filter((item) => {
    if (filterType && item.type !== filterType) return false
    const q = filterQuery.trim().toLowerCase()
    if (!q) return true
    const haystack = [item.description, item.material_type, item.notes, item.customer_name]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })

  return (
    <section className="flex w-full flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-medium text-text-strong">Coletas</h2>
          <p className="text-sm">Materiais e serviços coletados junto aos clientes</p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ mode: 'create' })}
          disabled={customers.length === 0}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-accent-strong hover:shadow-md active:scale-95 disabled:opacity-60"
        >
          Nova coleta
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Buscar por cliente, descrição, material ou observações..."
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

      {loading && <p className="text-sm">Carregando...</p>}
      {loadError && <p className="text-sm text-red-500">{loadError}</p>}
      {!loading && !loadError && (
        <CollectionTable
          collections={filteredCollections}
          onEdit={(collection) => setModal({ mode: 'edit', collection })}
          onDelete={handleDelete}
        />
      )}

      {modal && (
        <CollectionFormModal
          title={modal.mode === 'edit' ? 'Editar coleta' : 'Nova coleta'}
          initialValue={modal.mode === 'edit' ? modal.collection : undefined}
          customers={customers}
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
