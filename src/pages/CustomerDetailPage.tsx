import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import * as api from '../api/customers'
import * as materialsApi from '../api/materials'
import * as transactionsApi from '../api/transactions'
import { TransactionFormModal } from '../components/transactions/TransactionFormModal'
import { TransactionTable } from '../components/transactions/TransactionTable'
import { paymentMethodLabels, relationshipTypeLabels, type Customer } from '../../shared/customer'
import type { MaterialWithPrice } from '../../shared/material'
import type { TransactionInput, TransactionWithDetails } from '../../shared/transaction'

function formatDateOnly(value: string) {
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

type TransactionModalState =
  | { mode: 'create' }
  | { mode: 'edit'; transaction: TransactionWithDetails }
  | null

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const customerId = Number(id)

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([])
  const [materials, setMaterials] = useState<MaterialWithPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [transactionModal, setTransactionModal] = useState<TransactionModalState>(null)
  const [transactionSubmitting, setTransactionSubmitting] = useState(false)
  const [transactionFormError, setTransactionFormError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setLoadError(null)
    try {
      const [customerData, transactionsData, materialsData] = await Promise.all([
        api.getCustomer(customerId),
        transactionsApi.listTransactions({ customerId }),
        materialsApi.listMaterials(),
      ])
      setCustomer(customerData)
      setTransactions(transactionsData)
      setMaterials(materialsData)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Falha ao carregar cliente')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmitTransaction(input: TransactionInput) {
    setTransactionSubmitting(true)
    setTransactionFormError(null)
    try {
      if (transactionModal?.mode === 'edit') {
        await transactionsApi.updateTransaction(transactionModal.transaction.id, input)
      } else {
        await transactionsApi.createTransaction(input)
      }
      setTransactionModal(null)
      setTransactions(await transactionsApi.listTransactions({ customerId }))
    } catch (err) {
      setTransactionFormError(err instanceof Error ? err.message : 'Falha ao salvar transação')
    } finally {
      setTransactionSubmitting(false)
    }
  }

  async function handleDeleteTransaction(transaction: TransactionWithDetails) {
    if (!window.confirm(`Excluir a transação de ${formatDateOnly(transaction.transacted_at)}?`)) return
    await transactionsApi.deleteTransaction(transaction.id)
    setTransactions((list) => list.filter((t) => t.id !== transaction.id))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId])

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

      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <h3 className="text-lg font-medium text-text-strong">Transações</h3>
          <button
            type="button"
            onClick={() => setTransactionModal({ mode: 'create' })}
            disabled={materials.length === 0}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-accent-strong hover:shadow-md active:scale-95 disabled:opacity-60"
          >
            Nova transação
          </button>
        </div>

        <TransactionTable
          transactions={transactions}
          showCustomer={false}
          onEdit={(transaction) => setTransactionModal({ mode: 'edit', transaction })}
          onDelete={handleDeleteTransaction}
        />
      </div>

      {transactionModal && (
        <TransactionFormModal
          title={transactionModal.mode === 'edit' ? 'Editar transação' : 'Nova transação'}
          initialValue={transactionModal.mode === 'edit' ? transactionModal.transaction : undefined}
          customers={customer ? [customer] : []}
          materials={materials}
          lockCustomerId={customerId}
          submitting={transactionSubmitting}
          error={transactionFormError}
          onSubmit={handleSubmitTransaction}
          onCancel={() => {
            setTransactionModal(null)
            setTransactionFormError(null)
          }}
        />
      )}
    </section>
  )
}
