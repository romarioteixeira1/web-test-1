import { useEffect, useState } from 'react'
import * as api from '../api/transactions'
import * as customersApi from '../api/customers'
import * as materialsApi from '../api/materials'
import { TransactionFormModal } from '../components/transactions/TransactionFormModal'
import { TransactionTable } from '../components/transactions/TransactionTable'
import type { Customer } from '../../shared/customer'
import type { MaterialWithPrice } from '../../shared/material'
import type { TransactionInput, TransactionWithDetails } from '../../shared/transaction'

type ModalState = { mode: 'create' } | { mode: 'edit'; transaction: TransactionWithDetails } | null

export function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [materials, setMaterials] = useState<MaterialWithPrice[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setLoadError(null)
    try {
      const [transactionsData, customersData, materialsData] = await Promise.all([
        api.listTransactions(statusFilter ? { status: statusFilter } : undefined),
        customersApi.listCustomers(),
        materialsApi.listMaterials(),
      ])
      setTransactions(transactionsData)
      setCustomers(customersData)
      setMaterials(materialsData)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Falha ao carregar transações')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  async function handleSubmit(input: TransactionInput) {
    setSubmitting(true)
    setFormError(null)
    try {
      if (modal?.mode === 'edit') {
        await api.updateTransaction(modal.transaction.id, input)
      } else {
        await api.createTransaction(input)
      }
      setModal(null)
      await load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Falha ao salvar transação')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(transaction: TransactionWithDetails) {
    if (!window.confirm(`Excluir a transação de ${transaction.customer_name} em ${transaction.transacted_at}?`)) return
    await api.deleteTransaction(transaction.id)
    await load()
  }

  return (
    <section className="flex w-full flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-medium text-text-strong">Transações</h2>
          <p className="text-sm">Compras e vendas de material, com pagamento e comprovante de pesagem</p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ mode: 'create' })}
          disabled={materials.length === 0}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-accent-strong hover:shadow-md active:scale-95 disabled:opacity-60"
        >
          Nova transação
        </button>
      </div>

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20 sm:w-56"
      >
        <option value="">Todos os status</option>
        <option value="pago">Pago</option>
        <option value="a_pagar">A pagar</option>
        <option value="parcelado">Parcelado</option>
      </select>

      {loading && <p className="text-sm">Carregando...</p>}
      {loadError && <p className="text-sm text-red-500">{loadError}</p>}
      {!loading && !loadError && (
        <TransactionTable
          transactions={transactions}
          onEdit={(transaction) => setModal({ mode: 'edit', transaction })}
          onDelete={handleDelete}
        />
      )}

      {modal && (
        <TransactionFormModal
          title={modal.mode === 'edit' ? 'Editar transação' : 'Nova transação'}
          initialValue={modal.mode === 'edit' ? modal.transaction : undefined}
          customers={customers}
          materials={materials}
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
