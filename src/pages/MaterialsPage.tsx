import { useEffect, useState } from 'react'
import * as api from '../api/materials'
import { MaterialFormModal } from '../components/materials/MaterialFormModal'
import { MaterialTable } from '../components/materials/MaterialTable'
import type { MaterialPriceInput, MaterialTypeInput, MaterialWithPrice } from '../../shared/material'

type ModalState = { mode: 'create' } | { mode: 'edit'; material: MaterialWithPrice } | null

export function MaterialsPage() {
  const [materials, setMaterials] = useState<MaterialWithPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setLoadError(null)
    try {
      setMaterials(await api.listMaterials())
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Falha ao carregar materiais')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSubmit(input: MaterialTypeInput, price: MaterialPriceInput | null) {
    setSubmitting(true)
    setFormError(null)
    try {
      const material =
        modal?.mode === 'edit' ? await api.updateMaterial(modal.material.id, input) : await api.createMaterial(input)
      if (price) {
        await api.createMaterialPrice(material.id, price)
      }
      setModal(null)
      await load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Falha ao salvar material')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(material: MaterialWithPrice) {
    if (!window.confirm(`Excluir o material "${material.name}"? Isso também remove seus subtipos e histórico de preços.`))
      return
    await api.deleteMaterial(material.id)
    await load()
  }

  return (
    <section className="flex w-full flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-medium text-text-strong">Materiais recicláveis</h2>
          <p className="text-sm">Tipos, subtipos, unidade de medida e preços de compra e venda</p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ mode: 'create' })}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-accent-strong hover:shadow-md active:scale-95"
        >
          Novo material
        </button>
      </div>

      {loading && <p className="text-sm">Carregando...</p>}
      {loadError && <p className="text-sm text-red-500">{loadError}</p>}
      {!loading && !loadError && (
        <MaterialTable
          materials={materials}
          onEdit={(material) => setModal({ mode: 'edit', material })}
          onDelete={handleDelete}
        />
      )}

      {modal && (
        <MaterialFormModal
          title={modal.mode === 'edit' ? 'Editar material' : 'Novo material'}
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
    </section>
  )
}
