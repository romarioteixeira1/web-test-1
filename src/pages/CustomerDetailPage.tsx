import { useState } from 'react'
import { Link, useParams } from 'react-router'
import * as api from '../api/customers'
import * as materialsApi from '../api/materials'
import { listPaymentMethods } from '../api/paymentMethods'
import * as transactionsApi from '../api/transactions'
import { useApp } from '../app/context'
import { useLoader } from '../app/hooks'
import { TransactionFormModal } from '../components/transactions/TransactionFormModal'
import { TransactionTable } from '../components/transactions/TransactionTable'
import { Hero, HeroButton } from '../components/ui/Hero'
import { ErrorBox, ListCard, Loading } from '../components/ui/ListCard'
import { relationshipTypeLabels } from '../../shared/customer'
import type { TransactionInput, TransactionWithDetails } from '../../shared/transaction'
import { brl, dateOnly, errorMessage, share } from '../lib/format'
import { paymentMethodName } from '../lib/labels'

type TransactionModalState = { mode: 'create' } | { mode: 'edit'; transaction: TransactionWithDetails } | null

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const customerId = Number(id)
  const { toast } = useApp()
  const [modal, setModal] = useState<TransactionModalState>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const { data, loading, error, reload } = useLoader(
    () =>
      Promise.all([
        api.getCustomer(customerId),
        transactionsApi.listTransactions({ customerId }),
        materialsApi.listMaterials(),
        listPaymentMethods(),
      ]),
    [customerId],
    'Falha ao carregar cliente',
  )

  if (loading && !data) return <Loading />

  if (error || !data) {
    return (
      <div className="page fill">
        <ErrorBox message={error ?? 'Cliente não encontrado'} onRetry={() => reload()} />
        <Link to="/clientes" className="link self-start text-sm font-semibold text-accent">
          ← Voltar para clientes
        </Link>
      </div>
    )
  }

  const [customer, transactions, materials, paymentMethods] = data
  const bought = transactions.filter((t) => t.transaction_type === 'compra').reduce((s, t) => s + t.total_amount, 0)
  const sold = transactions.filter((t) => t.transaction_type === 'venda').reduce((s, t) => s + t.total_amount, 0)
  const contact = [customer.email, customer.phone, customer.document].filter(Boolean).join(' · ')
  const address = [
    [customer.street, customer.number].filter(Boolean).join(', '),
    customer.neighborhood,
    [customer.city, customer.state?.toUpperCase()].filter(Boolean).join(' / '),
  ]
    .filter(Boolean)
    .join(' · ')

  async function handleSubmit(input: TransactionInput) {
    setSubmitting(true)
    setFormError(null)
    try {
      if (modal?.mode === 'edit') {
        await transactionsApi.updateTransaction(modal.transaction.id, input)
        toast('Alterações salvas')
      } else {
        await transactionsApi.createTransaction(input)
        toast('Transação cadastrada com sucesso')
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
    if (!window.confirm(`Excluir a transação de ${dateOnly(transaction.transacted_at)}?`)) return
    try {
      await transactionsApi.deleteTransaction(transaction.id)
      toast('Transação excluída')
      await reload({ silent: true })
    } catch (err) {
      toast(errorMessage(err, 'Falha ao excluir transação'), 'error')
    }
  }

  return (
    <div className="page fill">
      <Hero
        back={{ to: '/clientes', label: 'Clientes' }}
        title={customer.name}
        subtitle={contact || 'Sem contato cadastrado'}
        stats={[
          { label: 'Transações', value: transactions.length, share: 100 },
          { label: 'Comprado dele', value: brl(bought), share: share(bought, bought + sold) },
          { label: 'Vendido a ele', value: brl(sold), share: share(sold, bought + sold) },
        ]}
      >
        <div className="hero-tags">
          <span className="tag">{relationshipTypeLabels[customer.relationship_type]}</span>
          <span className="tag">{customer.person_type === 'juridica' ? 'Pessoa jurídica' : 'Pessoa física'}</span>
          {customer.status === 'inactive' && <span className="tag">Inativo</span>}
          {customer.payment_method && (
            <span className="tag">Paga com {paymentMethodName(customer.payment_method, paymentMethods)}</span>
          )}
          {customer.person_type === 'juridica' && customer.state_registration && (
            <span className="tag">IE {customer.state_registration}</span>
          )}
        </div>
        {address && <p className="text-sm">{address}</p>}
        <HeroButton
          label="Nova transação"
          disabled={materials.length === 0}
          title={materials.length === 0 ? 'Cadastre um material primeiro' : undefined}
          onClick={() => setModal({ mode: 'create' })}
        />
      </Hero>

      {customer.notes && (
        <section className="card card-body text-sm text-ink-2">
          <strong className="mr-2 text-ink">Observações:</strong>
          {customer.notes}
        </section>
      )}

      <ListCard title="Transações" count={transactions.length}>
        <TransactionTable
          transactions={transactions}
          showCustomer={false}
          onEdit={(transaction) => setModal({ mode: 'edit', transaction })}
          onDelete={handleDelete}
        />
      </ListCard>

      {modal && (
        <TransactionFormModal
          mode={modal.mode}
          initialValue={modal.mode === 'edit' ? modal.transaction : undefined}
          customers={[customer]}
          materials={materials}
          paymentMethods={paymentMethods}
          lockCustomerId={customerId}
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
