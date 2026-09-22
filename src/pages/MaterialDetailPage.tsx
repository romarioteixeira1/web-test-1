import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import * as api from '../api/materials'
import { PriceFormModal } from '../components/materials/PriceFormModal'
import type { MaterialPrice, MaterialPriceInput, MaterialWithPrice } from '../../shared/material'

function formatDateOnly(value: string) {
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatVariation(current: number, previous: number | null) {
  if (previous == null || previous === 0) return null
  const pct = ((current - previous) / previous) * 100
  return pct
}

export function MaterialDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const materialId = Number(id)

  const [material, setMaterial] = useState<MaterialWithPrice | null>(null)
  const [prices, setPrices] = useState<MaterialPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setLoadError(null)
    try {
      const [materialData, pricesData] = await Promise.all([
        api.getMaterial(materialId),
        api.listMaterialPrices(materialId),
      ])
      setMaterial(materialData)
      setPrices(pricesData)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Falha ao carregar material')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialId])

  async function handleSubmitPrice(input: MaterialPriceInput) {
    setSubmitting(true)
    setFormError(null)
    try {
      await api.createMaterialPrice(materialId, input)
      setModalOpen(false)
      await load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Falha ao salvar preço')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeletePrice(price: MaterialPrice) {
    if (!window.confirm(`Excluir o registro de preço de ${formatDateOnly(price.effective_at)}?`)) return
    await api.deleteMaterialPrice(price.id)
    setPrices((list) => list.filter((p) => p.id !== price.id))
  }

  if (loading) {
    return (
      <section className="flex w-full flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <p className="text-sm">Carregando...</p>
      </section>
    )
  }

  if (loadError || !material) {
    return (
      <section className="flex w-full flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <p className="text-sm text-red-500">{loadError ?? 'Material não encontrado'}</p>
        <button
          type="button"
          onClick={() => navigate('/materiais')}
          className="self-start text-sm text-accent hover:underline"
        >
          Voltar para materiais
        </button>
      </section>
    )
  }

  // prices são ordenados do mais recente para o mais antigo pela API
  const sortedAsc = [...prices].reverse()

  return (
    <section className="flex w-full flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-1">
        <Link to="/materiais" className="text-sm text-accent transition-colors hover:text-accent-strong hover:underline">
          ← Voltar para materiais
        </Link>
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-medium text-text-strong">{material.name}</h2>
            <p className="text-sm">Unidade de medida: {material.unit}</p>
          </div>
          <span
            className={
              material.status === 'active'
                ? 'rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent'
                : 'rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-red-500'
            }
          >
            {material.status === 'active' ? 'Ativo' : 'Inativo'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md">
          <p className="text-sm">Preço de compra atual</p>
          <p className="mt-1 text-3xl font-semibold text-text-strong">
            {material.buy_price != null ? `${formatCurrency(material.buy_price)}/${material.unit}` : '—'}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md">
          <p className="text-sm">Preço de venda atual</p>
          <p className="mt-1 text-3xl font-semibold text-accent">
            {material.sell_price != null ? `${formatCurrency(material.sell_price)}/${material.unit}` : '—'}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <h3 className="text-lg font-medium text-text-strong">Histórico de preços</h3>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-accent-strong hover:shadow-md active:scale-95"
          >
            Novo preço
          </button>
        </div>

        {prices.length === 0 ? (
          <p className="py-6 text-center text-sm">Nenhum preço registrado ainda.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-surface text-text-strong">
                <tr>
                  <th className="px-4 py-3 font-medium">Vigência</th>
                  <th className="px-4 py-3 font-medium">Compra</th>
                  <th className="px-4 py-3 font-medium">Var. compra</th>
                  <th className="px-4 py-3 font-medium">Venda</th>
                  <th className="px-4 py-3 font-medium">Var. venda</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {prices.map((price) => {
                  const index = sortedAsc.findIndex((p) => p.id === price.id)
                  const previous = index > 0 ? sortedAsc[index - 1] : null
                  const buyVariation = formatVariation(price.buy_price, previous?.buy_price ?? null)
                  const sellVariation = formatVariation(price.sell_price, previous?.sell_price ?? null)

                  return (
                    <tr key={price.id} className="border-t border-border transition-colors hover:bg-surface">
                      <td className="px-4 py-3 text-text-strong whitespace-nowrap">
                        {formatDateOnly(price.effective_at)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatCurrency(price.buy_price)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {buyVariation == null ? (
                          '—'
                        ) : (
                          <span className={buyVariation >= 0 ? 'text-accent' : 'text-red-500'}>
                            {buyVariation >= 0 ? '▲' : '▼'} {Math.abs(buyVariation).toFixed(1)}%
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-accent">
                        {formatCurrency(price.sell_price)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {sellVariation == null ? (
                          '—'
                        ) : (
                          <span className={sellVariation >= 0 ? 'text-accent' : 'text-red-500'}>
                            {sellVariation >= 0 ? '▲' : '▼'} {Math.abs(sellVariation).toFixed(1)}%
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDeletePrice(price)}
                          className="font-medium transition-colors hover:text-red-500"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <PriceFormModal
          unit={material.unit}
          submitting={submitting}
          error={formError}
          onSubmit={handleSubmitPrice}
          onCancel={() => {
            setModalOpen(false)
            setFormError(null)
          }}
        />
      )}
    </section>
  )
}
