import { useState } from 'react'
import { Link, useParams } from 'react-router'
import * as api from '../api/materials'
import { useApp } from '../app/context'
import { useLoader } from '../app/hooks'
import { PriceFormModal } from '../components/materials/PriceFormModal'
import { Hero, HeroButton } from '../components/ui/Hero'
import { EmptyState, ErrorBox, ListCard, Loading } from '../components/ui/ListCard'
import { RowActions } from '../components/ui/RowActions'
import type { MaterialPrice, MaterialPriceInput } from '../../shared/material'
import { brl, dateOnly, errorMessage, signedBrl } from '../lib/format'
import { marginOf } from '../lib/metrics'

function variation(current: number, previous: number | undefined) {
  if (previous == null || previous === 0) return null
  return ((current - previous) / previous) * 100
}

function Variation({ value }: { value: number | null }) {
  if (value == null) return <>—</>
  return (
    <span className={value >= 0 ? 'pos' : 'neg'}>
      {value >= 0 ? '▲' : '▼'} {Math.abs(value).toFixed(1).replace('.', ',')}%
    </span>
  )
}

export function MaterialDetailPage() {
  const { id } = useParams<{ id: string }>()
  const materialId = Number(id)
  const { toast } = useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const { data, loading, error, reload } = useLoader(
    () => Promise.all([api.getMaterial(materialId), api.listMaterialPrices(materialId)]),
    [materialId],
    'Falha ao carregar material',
  )

  if (loading && !data) return <Loading />

  if (error || !data) {
    return (
      <div className="page fill">
        <ErrorBox message={error ?? 'Material não encontrado'} onRetry={() => reload()} />
        <Link to="/materiais" className="link self-start text-sm font-semibold text-accent">
          ← Voltar para materiais
        </Link>
      </div>
    )
  }

  const [material, prices] = data
  const margin = marginOf(material)
  // The API returns prices newest first.
  const oldestFirst = [...prices].reverse()

  async function handleSubmitPrice(input: MaterialPriceInput) {
    setSubmitting(true)
    setFormError(null)
    try {
      await api.createMaterialPrice(materialId, input)
      toast('Preço registrado')
      setModalOpen(false)
      await reload({ silent: true })
    } catch (err) {
      setFormError(errorMessage(err, 'Falha ao salvar preço'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeletePrice(price: MaterialPrice) {
    if (!window.confirm(`Excluir o registro de preço de ${dateOnly(price.effective_at)}?`)) return
    try {
      await api.deleteMaterialPrice(price.id)
      toast('Registro de preço excluído')
      await reload({ silent: true })
    } catch (err) {
      toast(errorMessage(err, 'Falha ao excluir preço'), 'error')
    }
  }

  return (
    <div className="page fill">
      <Hero
        back={{ to: '/materiais', label: 'Materiais' }}
        title={material.name}
        subtitle={`Preços por ${material.unit}${material.price_effective_at ? `, vigentes desde ${dateOnly(material.price_effective_at)}` : ''}.`}
        stats={[
          { label: `Compra / ${material.unit}`, value: material.buy_price == null ? '—' : brl(material.buy_price) },
          { label: `Venda / ${material.unit}`, value: material.sell_price == null ? '—' : brl(material.sell_price) },
          {
            label: `Margem / ${material.unit}`,
            value: margin == null ? '—' : signedBrl(margin),
            negative: margin != null && margin < 0,
          },
        ]}
      >
        <div className="hero-tags">
          <span className="tag">{material.category ?? 'Sem categoria'}</span>
          {material.status === 'inactive' && <span className="tag">Inativo</span>}
        </div>
        <HeroButton label="Novo preço" onClick={() => setModalOpen(true)} />
      </Hero>

      <ListCard title="Histórico de preços" count={prices.length}>
        <table>
          <colgroup>
            <col style={{ width: '20%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: 80 }} />
          </colgroup>
          <thead>
            <tr>
              <th>Vigência</th>
              <th className="right">Compra</th>
              <th className="right">Var. compra</th>
              <th className="right">Venda</th>
              <th className="right">Var. venda</th>
              <th className="center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {prices.map((price) => {
              const index = oldestFirst.findIndex((p) => p.id === price.id)
              const previous = index > 0 ? oldestFirst[index - 1] : undefined
              return (
                <tr key={price.id}>
                  <td className="mono">{dateOnly(price.effective_at)}</td>
                  <td className="mono right">{brl(price.buy_price)}</td>
                  <td className="mono right">
                    <Variation value={variation(price.buy_price, previous?.buy_price)} />
                  </td>
                  <td className="mono right">{brl(price.sell_price)}</td>
                  <td className="mono right">
                    <Variation value={variation(price.sell_price, previous?.sell_price)} />
                  </td>
                  <RowActions
                    name={`preço de ${dateOnly(price.effective_at)}`}
                    onDelete={() => handleDeletePrice(price)}
                  />
                </tr>
              )
            })}
          </tbody>
        </table>
        {prices.length === 0 && <EmptyState title="Nenhum preço registrado" message="Cadastre o primeiro preço deste material." />}
      </ListCard>

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
    </div>
  )
}
