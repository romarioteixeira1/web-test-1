import { useState } from 'react'
import * as api from '../api/materials'
import { useApp, useTopbarSearch } from '../app/context'
import { useLoader, useOpenCreateOnArrival } from '../app/hooks'
import { MaterialFormModal } from '../components/materials/MaterialFormModal'
import { MaterialTable } from '../components/materials/MaterialTable'
import { Hero, HeroButton } from '../components/ui/Hero'
import { ErrorBox, ListCard, Loading, Segmented } from '../components/ui/ListCard'
import {
  materialCategories,
  orderMaterialHierarchy,
  type MaterialCategory,
  type MaterialPriceInput,
  type MaterialTypeInput,
  type MaterialWithPrice,
} from '../../shared/material'
import { brl, errorMessage, matches, share } from '../lib/format'
import { averageMargin } from '../lib/metrics'

type ModalState = { mode: 'create' } | { mode: 'edit'; material: MaterialWithPrice } | null
type Filter = 'all' | MaterialCategory

const filters = [
  ['all', 'Todas'],
  ['Papel', 'Papel'],
  ['Plástico', 'Plástico'],
  ['Metal', 'Metal'],
  ['Vidro', 'Vidro'],
] as const

export function MaterialsPage() {
  const { toast, refreshCounts, setQuery } = useApp()
  const query = useTopbarSearch('Buscar material')
  const openCreate = useOpenCreateOnArrival()
  const [filter, setFilter] = useState<Filter>('all')
  const [modal, setModal] = useState<ModalState>(openCreate ? { mode: 'create' } : null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const { data, loading, error, reload } = useLoader(() => api.listMaterials(), [], 'Falha ao carregar materiais')
  const materials = data ?? []

  const categories = new Set(materials.map((m) => m.category).filter(Boolean)).size
  const avg = averageMargin(materials)

  const rows = orderMaterialHierarchy(materials).filter(
    ({ item }) => (filter === 'all' || item.category === filter) && matches(query, item.name, item.category),
  )

  async function handleSubmit(input: MaterialTypeInput, price: MaterialPriceInput | null) {
    setSubmitting(true)
    setFormError(null)
    try {
      const material =
        modal?.mode === 'edit' ? await api.updateMaterial(modal.material.id, input) : await api.createMaterial(input)
      if (price) await api.createMaterialPrice(material.id, price)
      if (modal?.mode === 'edit') {
        toast('Alterações salvas')
      } else {
        toast('Material cadastrado com sucesso')
        setFilter('all')
        setQuery('')
      }
      setModal(null)
      refreshCounts()
      await reload({ silent: true })
    } catch (err) {
      setFormError(errorMessage(err, 'Falha ao salvar material'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(material: MaterialWithPrice) {
    if (!window.confirm(`Excluir "${material.name}"? Isso também remove seus subtipos e o histórico de preços.`)) return
    try {
      await api.deleteMaterial(material.id)
      toast('Material excluído')
      refreshCounts()
      await reload({ silent: true })
    } catch (err) {
      toast(errorMessage(err, 'Falha ao excluir material'), 'error')
    }
  }

  return (
    <div className="page fill">
      <Hero
        chip="ECOCONTROL · CADASTROS"
        title="Materiais"
        subtitle="Acompanhe preços por quilo e veja sua margem em cada material."
        stats={[
          { label: 'Materiais', value: materials.length, share: 100 },
          { label: 'Categorias', value: categories, share: share(categories, materialCategories.length) },
          {
            label: 'Margem média/kg',
            value: avg == null ? '—' : brl(avg),
            share: 60,
            negative: avg != null && avg < 0,
          },
        ]}
      >
        <HeroButton label="Novo material" onClick={() => setModal({ mode: 'create' })} />
      </Hero>

      {error ? (
        <ErrorBox message={error} onRetry={() => reload()} />
      ) : (
        <ListCard
          title="Tabela de preços"
          count={rows.length}
          actions={<Segmented label="Filtrar por categoria" value={filter} options={filters} onChange={setFilter} />}
        >
          {loading ? (
            <Loading />
          ) : (
            <MaterialTable
              rows={rows}
              onEdit={(material) => setModal({ mode: 'edit', material })}
              onDelete={handleDelete}
            />
          )}
        </ListCard>
      )}

      {modal && (
        <MaterialFormModal
          mode={modal.mode}
          initialValue={modal.mode === 'edit' ? modal.material : undefined}
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
