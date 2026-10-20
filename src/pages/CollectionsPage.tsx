import { useState } from 'react'
import * as api from '../api/collections'
import * as customersApi from '../api/customers'
import { useApp, useTopbarSearch } from '../app/context'
import { useLoader } from '../app/hooks'
import { CollectionFormModal } from '../components/collections/CollectionFormModal'
import { CollectionTable } from '../components/collections/CollectionTable'
import { Hero, HeroButton } from '../components/ui/Hero'
import { ErrorBox, ListCard, Loading, Segmented } from '../components/ui/ListCard'
import type { CollectionInput, CollectionType, CollectionWithCustomer } from '../../shared/collection'
import { brl, errorMessage, matches, share } from '../lib/format'

type ModalState = { mode: 'create' } | { mode: 'edit'; collection: CollectionWithCustomer } | null
type Filter = 'all' | CollectionType

const filters = [
  ['all', 'Todas'],
  ['material', 'Material'],
  ['servico', 'Serviço'],
] as const

export function CollectionsPage() {
  const { toast, setQuery } = useApp()
  const query = useTopbarSearch('Buscar por cliente, descrição ou material')
  const [filter, setFilter] = useState<Filter>('all')
  const [modal, setModal] = useState<ModalState>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const { data, loading, error, reload } = useLoader(
    () => Promise.all([api.listCollections(), customersApi.listCustomers()]),
    [],
    'Falha ao carregar coletas',
  )
  const [collections, customers] = data ?? [[], []]

  const materialCount = collections.filter((c) => c.type === 'material').length
  const total = collections.reduce((sum, c) => sum + c.amount, 0)

  const visible = collections.filter(
    (c) =>
      (filter === 'all' || c.type === filter) &&
      matches(query, c.description, c.material_type, c.notes, c.customer_name),
  )

  async function handleSubmit(input: CollectionInput) {
    setSubmitting(true)
    setFormError(null)
    try {
      if (modal?.mode === 'edit') {
        await api.updateCollection(modal.collection.id, input)
        toast('Alterações salvas')
      } else {
        await api.createCollection(input)
        toast('Coleta cadastrada com sucesso')
        setFilter('all')
        setQuery('')
      }
      setModal(null)
      await reload({ silent: true })
    } catch (err) {
      setFormError(errorMessage(err, 'Falha ao salvar coleta'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(collection: CollectionWithCustomer) {
    if (!window.confirm(`Excluir a coleta "${collection.description}"?`)) return
    try {
      await api.deleteCollection(collection.id)
      toast('Coleta excluída')
      await reload({ silent: true })
    } catch (err) {
      toast(errorMessage(err, 'Falha ao excluir coleta'), 'error')
    }
  }

  return (
    <div className="page fill">
      <Hero
        chip="ECOCONTROL · OPERAÇÕES"
        title="Coletas"
        subtitle="Materiais e serviços coletados junto aos seus clientes."
        stats={[
          { label: 'Coletas', value: collections.length, share: 100 },
          { label: 'De material', value: materialCount, share: share(materialCount, collections.length) },
          { label: 'Valor total', value: brl(total), share: 60 },
        ]}
      >
        <HeroButton
          label="Nova coleta"
          disabled={!loading && customers.length === 0}
          title={customers.length === 0 ? 'Cadastre um cliente primeiro' : undefined}
          onClick={() => setModal({ mode: 'create' })}
        />
      </Hero>

      {error ? (
        <ErrorBox message={error} onRetry={() => reload()} />
      ) : (
        <ListCard
          title="Coletas registradas"
          count={visible.length}
          actions={<Segmented label="Filtrar por tipo" value={filter} options={filters} onChange={setFilter} />}
        >
          {loading ? (
            <Loading />
          ) : (
            <CollectionTable
              collections={visible}
              onEdit={(collection) => setModal({ mode: 'edit', collection })}
              onDelete={handleDelete}
            />
          )}
        </ListCard>
      )}

      {modal && (
        <CollectionFormModal
          mode={modal.mode}
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
    </div>
  )
}
