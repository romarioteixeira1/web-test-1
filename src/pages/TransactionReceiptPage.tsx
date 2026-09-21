import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import * as api from '../api/transactions'
import * as customersApi from '../api/customers'
import { paymentMethodLabels, type Customer } from '../../shared/customer'
import { paymentStatusLabels, transactionTypeLabels, type TransactionWithDetails } from '../../shared/transaction'

function formatDateOnly(value: string) {
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

function formatDateTime(value: string) {
  const date = new Date(value.includes(' ') ? value.replace(' ', 'T') + 'Z' : value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function TransactionReceiptPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const transactionId = Number(id)

  const [transaction, setTransaction] = useState<TransactionWithDetails | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const t = await api.getTransaction(transactionId)
        setTransaction(t)
        setCustomer(await customersApi.getCustomer(t.customer_id))
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Falha ao carregar transação')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [transactionId])

  if (loading) {
    return (
      <section className="flex w-full flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <p className="text-sm">Carregando...</p>
      </section>
    )
  }

  if (loadError || !transaction) {
    return (
      <section className="flex w-full flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <p className="text-sm text-red-500">{loadError ?? 'Transação não encontrada'}</p>
        <button
          type="button"
          onClick={() => navigate('/transacoes')}
          className="self-start text-sm text-accent hover:underline"
        >
          Voltar para transações
        </button>
      </section>
    )
  }

  return (
    <section className="flex w-full flex-1 flex-col items-center gap-6 px-4 py-6 sm:px-6 sm:py-8 print:block print:px-0 print:py-0">
      <div className="flex w-full max-w-xl items-center justify-between print:hidden">
        <Link to="/transacoes" className="text-sm text-accent transition-colors hover:text-accent-strong hover:underline">
          ← Voltar para transações
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-accent-strong hover:shadow-md active:scale-95"
        >
          Imprimir comprovante
        </button>
      </div>

      <div className="w-full max-w-xl rounded-lg border border-border bg-bg p-8 text-left shadow-sm print:max-w-none print:rounded-none print:border-none print:p-0 print:shadow-none">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
              BW
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-text-strong">BEST WAY</p>
              <p className="text-xs text-text">Comprovante de pesagem</p>
            </div>
          </div>
          <div className="text-right text-xs text-text">
            <p>Transação #{transaction.id}</p>
            <p>Emitido em {formatDateTime(new Date().toISOString())}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span
            className={
              transaction.transaction_type === 'compra'
                ? 'rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent'
                : 'rounded-full bg-surface px-3 py-1 text-xs font-medium text-text-strong'
            }
          >
            {transactionTypeLabels[transaction.transaction_type]} de material
          </span>
          <span className="text-sm text-text">{formatDateOnly(transaction.transacted_at)}</span>
        </div>

        <div className="mt-5">
          <p className="text-xs text-text">Cliente</p>
          <p className="text-base font-medium text-text-strong">{transaction.customer_name}</p>
          {customer && (
            <p className="text-sm text-text">
              {[customer.document, customer.phone, customer.email].filter(Boolean).join(' · ') || '—'}
            </p>
          )}
        </div>

        <div className="mt-5 overflow-hidden rounded-md border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-text-strong">
              <tr>
                <th className="px-3 py-2 font-medium">Material</th>
                <th className="px-3 py-2 font-medium">Peso</th>
                <th className="px-3 py-2 font-medium">Preço unitário</th>
                <th className="px-3 py-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border">
                <td className="px-3 py-2 text-text-strong">{transaction.material_name}</td>
                <td className="px-3 py-2">
                  {transaction.weight.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} {transaction.material_unit}
                </td>
                <td className="px-3 py-2">
                  {formatCurrency(transaction.unit_price)}/{transaction.material_unit}
                </td>
                <td className="px-3 py-2 font-medium text-accent">{formatCurrency(transaction.total_amount)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-md bg-surface px-4 py-3">
          <span className="text-sm font-medium text-text-strong">Valor total</span>
          <span className="text-xl font-semibold text-accent">{formatCurrency(transaction.total_amount)}</span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-text">Forma de pagamento</p>
            <p className="text-text-strong">
              {transaction.payment_method ? paymentMethodLabels[transaction.payment_method] : 'Não informado'}
            </p>
          </div>
          <div>
            <p className="text-xs text-text">Status</p>
            <p className="text-text-strong">
              {paymentStatusLabels[transaction.payment_status]}
              {transaction.payment_status === 'parcelado' && transaction.installments
                ? ` em ${transaction.installments}x`
                : ''}
            </p>
          </div>
        </div>

        {transaction.notes && (
          <div className="mt-5">
            <p className="text-xs text-text">Observações</p>
            <p className="text-sm text-text-strong">{transaction.notes}</p>
          </div>
        )}

        <div className="mt-8 grid grid-cols-2 gap-6 pt-8 text-center text-xs text-text">
          <div className="border-t border-border pt-2">Assinatura do cliente</div>
          <div className="border-t border-border pt-2">Assinatura BEST WAY</div>
        </div>
      </div>
    </section>
  )
}
