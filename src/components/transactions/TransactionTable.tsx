import { Link } from 'react-router'
import { paymentMethodLabels } from '../../../shared/customer'
import { paymentStatusLabels, transactionTypeLabels, type TransactionWithDetails } from '../../../shared/transaction'

type Props = {
  transactions: TransactionWithDetails[]
  showCustomer?: boolean
  onEdit: (transaction: TransactionWithDetails) => void
  onDelete: (transaction: TransactionWithDetails) => void
}

function formatDateOnly(value: string) {
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const statusClass = {
  pago: 'rounded-full bg-accent-soft px-2 py-1 text-xs font-medium text-accent',
  a_pagar: 'rounded-full bg-amber-500/15 px-2 py-1 text-xs font-medium text-amber-500',
  parcelado: 'rounded-full bg-sky-500/15 px-2 py-1 text-xs font-medium text-sky-500',
}

export function TransactionTable({ transactions, showCustomer = true, onEdit, onDelete }: Props) {
  if (transactions.length === 0) {
    return <p className="py-12 text-center text-sm">Nenhuma transação registrada ainda.</p>
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead className="bg-surface text-text-strong">
          <tr>
            <th className="px-4 py-3 font-medium">Data</th>
            {showCustomer && <th className="px-4 py-3 font-medium">Cliente</th>}
            <th className="px-4 py-3 font-medium">Tipo</th>
            <th className="px-4 py-3 font-medium">Material</th>
            <th className="px-4 py-3 font-medium">Peso</th>
            <th className="px-4 py-3 font-medium">Preço</th>
            <th className="px-4 py-3 font-medium">Total</th>
            <th className="px-4 py-3 font-medium">Pagamento</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id} className="border-t border-border transition-colors hover:bg-surface">
              <td className="px-4 py-3 whitespace-nowrap">{formatDateOnly(t.transacted_at)}</td>
              {showCustomer && <td className="px-4 py-3 text-text-strong">{t.customer_name}</td>}
              <td className="px-4 py-3 whitespace-nowrap">
                <span
                  className={
                    t.transaction_type === 'compra'
                      ? 'rounded-full bg-accent-soft px-2 py-1 text-xs font-medium text-accent'
                      : 'rounded-full bg-surface px-2 py-1 text-xs font-medium text-text-strong'
                  }
                >
                  {transactionTypeLabels[t.transaction_type]}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{t.material_name}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                {t.weight.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} {t.material_unit}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {formatCurrency(t.unit_price)}/{t.material_unit}
              </td>
              <td className="px-4 py-3 whitespace-nowrap font-medium text-accent">{formatCurrency(t.total_amount)}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                {t.payment_method ? paymentMethodLabels[t.payment_method] : '—'}
                {t.payment_status === 'parcelado' && t.installments ? ` · ${t.installments}x` : ''}
              </td>
              <td className="px-4 py-3">
                <span className={statusClass[t.payment_status]}>{paymentStatusLabels[t.payment_status]}</span>
              </td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                <Link
                  to={`/transacoes/${t.id}/comprovante`}
                  target="_blank"
                  rel="noreferrer"
                  className="mr-3 font-medium transition-colors hover:text-accent"
                >
                  Comprovante
                </Link>
                <button
                  type="button"
                  onClick={() => onEdit(t)}
                  className="mr-3 font-medium transition-colors hover:text-accent"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(t)}
                  className="font-medium transition-colors hover:text-red-500"
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
