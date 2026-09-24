import { Link } from 'react-router'
import {
  paymentStatusLabels,
  transactionTypeLabels,
  type PaymentStatus,
  type TransactionWithDetails,
} from '../../../shared/transaction'
import { brl, dateOnly, decimal } from '../../lib/format'
import { paymentMethodName } from '../../lib/labels'
import { IconReceipt } from '../layout/icons'
import { EmptyState } from '../ui/ListCard'
import { RowActions } from '../ui/RowActions'

type Props = {
  transactions: TransactionWithDetails[]
  showCustomer?: boolean
  onEdit: (transaction: TransactionWithDetails) => void
  onDelete: (transaction: TransactionWithDetails) => void
}

const statusTone: Record<PaymentStatus, string> = {
  pago: 'tone-green',
  a_pagar: 'neutral',
  parcelado: 'tone-light',
}

export function TransactionTable({ transactions, showCustomer = true, onEdit, onDelete }: Props) {
  return (
    <>
      <table>
        <colgroup>
          <col style={{ width: 110 }} />
          {showCustomer && <col style={{ width: '18%' }} />}
          <col style={{ width: 100 }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: 110 }} />
          <col style={{ width: 120 }} />
          <col style={{ width: 130 }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: 110 }} />
          <col style={{ width: 140 }} />
        </colgroup>
        <thead>
          <tr>
            <th>Data</th>
            {showCustomer && <th>Cliente</th>}
            <th>Tipo</th>
            <th>Material</th>
            <th className="right">Peso</th>
            <th className="right">Preço</th>
            <th className="right">Total</th>
            <th>Pagamento</th>
            <th>Status</th>
            <th className="center">Ações</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id}>
              <td className="mono">{dateOnly(t.transacted_at)}</td>
              {showCustomer && (
                <td>
                  <Link to={`/clientes/${t.customer_id}`} className="link font-semibold">
                    {t.customer_name}
                  </Link>
                </td>
              )}
              <td>
                <span className={`tag ${t.transaction_type === 'compra' ? 'tone-green' : 'tone-dark'}`}>
                  {transactionTypeLabels[t.transaction_type]}
                </span>
              </td>
              <td>{t.material_name}</td>
              <td className="mono right">
                {decimal(t.weight)} {t.material_unit}
              </td>
              <td className="mono right">{brl(t.unit_price)}</td>
              <td className="mono right pos">{brl(t.total_amount)}</td>
              <td>
                {paymentMethodName(t.payment_method, t.payment_method_name)}
                {t.installments ? ` · ${t.installments}x` : ''}
              </td>
              <td>
                <span className={`tag ${statusTone[t.payment_status]}`}>{paymentStatusLabels[t.payment_status]}</span>
              </td>
              <RowActions
                name={`transação de ${t.customer_name}`}
                onEdit={() => onEdit(t)}
                onDelete={() => onDelete(t)}
              >
                <Link
                  to={`/transacoes/${t.id}/comprovante`}
                  target="_blank"
                  rel="noreferrer"
                  className="icon"
                  aria-label="Abrir comprovante"
                  title="Comprovante"
                >
                  <IconReceipt size={16} />
                </Link>
              </RowActions>
            </tr>
          ))}
        </tbody>
      </table>
      {transactions.length === 0 && <EmptyState />}
    </>
  )
}
