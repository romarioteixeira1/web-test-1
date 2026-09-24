import { useState } from 'react'
import * as api from '../api/transactions'
import * as customersApi from '../api/customers'
import * as materialsApi from '../api/materials'
import { listPaymentMethods } from '../api/paymentMethods'
import { useApp, useTopbarSearch } from '../app/context'
import { useLoader } from '../app/hooks'
import { TransactionFormModal } from '../components/transactions/TransactionFormModal'
import { TransactionTable } from '../components/transactions/TransactionTable'
import { Hero, HeroButton } from '../components/ui/Hero'
import { ErrorBox, ListCard, Loading, Segmented } from '../components/ui/ListCard'
import type { PaymentStatus, TransactionInput, TransactionWithDetails } from '../../shared/transaction'
import { brl, dateOnly, errorMessage, matches, share } from '../lib/format'

type ModalState = { mode: 'create' } | { mode: 'edit'; transaction: TransactionWithDetails } | null
type Filter = 'all' | PaymentStatus

const filters = [
  ['all', 'Todas'],
  ['pago', 'Pagas'],
  ['a_pagar', 'A pagar'],
  ['parcelado', 'Parceladas'],
] as const

export function TransactionsPage() {
  const { toast, setQuery } = useApp()
  const query = useTopbarSearch('Buscar por cliente ou material')
  const [filter, setFilter] = useState<Filter>('all')
  const [modal, setModal] = useState<ModalState>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const { data, loading, error, reload } = useLoader(
    () =>
      Promise.all([
        api.listTransactions(),
        customersApi.listCustomers(),
        materialsApi.listMaterials(),
        listPaymentMethods(),
      ]),
    [],
    'Falha ao carregar transações',
  )
  const [transactions, customers, materials, paymentMethods] = data ?? [[], [], [], []]

  const bought = transactions.filter((t) => t.transaction_type === 'compra').reduce((s, t) => s + t.total_amount, 0)
  const sold = transactions.filter((t) => t.transaction_type === 'venda').reduce((s, t) => s + t.total_amount, 0)
  const pending = transactions.filter((t) => t.payment_status !== 'pago').length

  const visible = transactions.filter(
    (t) =>
      (filter === 'all' || t.payment_status === filter) &&
      matches(query, t.customer_name, t.material_name, t.notes, t.payment_method_name),
  )

  async function handleSubmit(input: TransactionInput) {
    setSubmitting(true)
    setFormError(null)
    try {
      if (modal?.mode === 'edit') {
        await api.updateTransaction(modal.transaction.id, input)
        toast('Alterações salvas')
      } else {
        await api.createTransaction(input)
        toast('Transação cadastrada com sucesso')
        setFilter('all')
        setQuery('')
      }
      setModal(null)
      await reload({ silent: true })
    } catch (err) {
      setFormError(errorMessage(err, 'Falha ao salvar transação'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(transaction: TransactionWithDetails) {
    if (
      !window.confirm(
        `Excluir a transação de ${transaction.customer_name} em ${dateOnly(transaction.transacted_at)}?`,
      )
    )
      return
    try {
      await api.deleteTransaction(transaction.id)
      toast('Transação excluída')
      await reload({ silent: true })
    } catch (err) {
      toast(errorMessage(err, 'Falha ao excluir transação'), 'error')
    }
  }

  const volume = bought + sold

  return (
    <div className="page fill">
      <Hero
        chip="ECOCONTROL · OPERAÇÕES"
        title="Transações"
        subtitle="Compras e vendas de material, com pagamento e comprovante de pesagem."
        stats={[
          { label: 'Comprado', value: brl(bought), share: share(bought, volume) },
          { label: 'Vendido', value: brl(sold), share: share(sold, volume) },
          { label: 'Pagamentos em aberto', value: pending, share: share(pending, transactions.length) },
        ]}
      >
        <HeroButton
          label="Nova transação"
          disabled={!loading && (materials.length === 0 || customers.length === 0)}
          title={
            customers.length === 0
              ? 'Cadastre um cliente primeiro'
              : materials.length === 0
                ? 'Cadastre um material primeiro'
                : undefined
          }
          onClick={() => setModal({ mode: 'create' })}
        />
      </Hero>

      {error ? (
        <ErrorBox message={error} onRetry={() => reload()} />
      ) : (
        <ListCard
          title="Histórico de transações"
          count={visible.length}
          actions={
            <Segmented label="Filtrar por pagamento" value={filter} options={filters} onChange={setFilter} />
          }
        >
          {loading ? (
            <Loading />
          ) : (
            <TransactionTable
              transactions={visible}
              onEdit={(transaction) => setModal({ mode: 'edit', transaction })}
              onDelete={handleDelete}
            />
          )}
        </ListCard>
      )}

      {modal && (
        <TransactionFormModal
          mode={modal.mode}
          initialValue={modal.mode === 'edit' ? modal.transaction : undefined}
          customers={customers}
          materials={materials}
          paymentMethods={paymentMethods}
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
