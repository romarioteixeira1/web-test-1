import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import * as api from '../api/customers'
import { PurchaseFormModal } from '../components/customers/PurchaseFormModal'
import type { Customer } from '../../shared/customer'
import type { Purchase, PurchaseInput } from '../../shared/purchase'

function formatDateOnly(value: string) {
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const customerId = Number(id)

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setLoadError(null)
    try {
      const [customerData, purchasesData] = await Promise.all([
        api.getCustomer(customerId),
        api.listPurchases(customerId),
      ])
      setCustomer(customerData)
      setPurchases(purchasesData)
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

  async function handleCreatePurchase(input: PurchaseInput) {
    setSubmitting(true)
    setFormError(null)
    try {
      await api.createPurchase(customerId, input)
      setModalOpen(false)
      const purchasesData = await api.listPurchases(customerId)
      setPurchases(purchasesData)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Falha ao salvar compra')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeletePurchase(purchase: Purchase) {
    if (!window.confirm(`Excluir a compra "${purchase.description}"?`)) return
    await api.deletePurchase(purchase.id)
    setPurchases((list) => list.filter((p) => p.id !== purchase.id))
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

  const total = purchases.reduce((sum, p) => sum + p.amount, 0)

  return (
    <section className="flex w-full flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-1">
        <Link to="/clientes" className="text-sm text-accent hover:underline">
          ← Voltar para clientes
        </Link>
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-medium text-text-strong">{customer.name}</h2>
            <p className="text-sm">
              {customer.email || '—'} {customer.phone ? `· ${customer.phone}` : ''}
              {customer.document ? ` · ${customer.document}` : ''}
            </p>
          </div>
          <span
            className={
              customer.status === 'active'
                ? 'rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-500'
                : 'rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-red-500'
            }
          >
            {customer.status === 'active' ? 'Ativo' : 'Inativo'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-5">
          <p className="text-sm">Total de compras</p>
          <p className="mt-1 text-3xl font-semibold text-text-strong">{purchases.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <p className="text-sm">Valor total gasto</p>
          <p className="mt-1 text-3xl font-semibold text-emerald-500">{formatCurrency(total)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-text-strong">Compras</h3>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white"
          >
            Nova compra
          </button>
        </div>

        {purchases.length === 0 ? (
          <p className="py-6 text-center text-sm">Nenhuma compra registrada ainda.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-surface text-text-strong">
                <tr>
                  <th className="px-4 py-3 font-medium">Descrição</th>
                  <th className="px-4 py-3 font-medium">Valor</th>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Observações</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {purchases.map((purchase) => (
                  <tr key={purchase.id} className="border-t border-border">
                    <td className="px-4 py-3 text-text-strong">{purchase.description}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatCurrency(purchase.amount)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDateOnly(purchase.purchased_at)}</td>
                    <td className="px-4 py-3">{purchase.notes || '—'}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleDeletePurchase(purchase)}
                        className="hover:text-red-500"
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

      {modalOpen && (
        <PurchaseFormModal
          submitting={submitting}
          error={formError}
          onSubmit={handleCreatePurchase}
          onCancel={() => {
            setModalOpen(false)
            setFormError(null)
          }}
        />
      )}
    </section>
  )
}
