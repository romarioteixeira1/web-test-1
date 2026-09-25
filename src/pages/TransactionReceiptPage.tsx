import { Link, useParams } from 'react-router'
import * as api from '../api/transactions'
import * as customersApi from '../api/customers'
import { useApp } from '../app/context'
import { useLoader } from '../app/hooks'
import { IconPrinter } from '../components/layout/icons'
import { ErrorBox, Loading } from '../components/ui/ListCard'
import type { Company } from '../../shared/company'
import { paymentStatusLabels, transactionTypeLabels } from '../../shared/transaction'
import { brl, dateOnly, dateTime, decimal } from '../lib/format'
import { paymentMethodName } from '../lib/labels'

export function TransactionReceiptPage() {
  const { id } = useParams<{ id: string }>()
  const transactionId = Number(id)
  const { company } = useApp()

  const { data, loading, error, reload } = useLoader(
    async () => {
      const transaction = await api.getTransaction(transactionId)
      const customer = await customersApi.getCustomer(transaction.customer_id)
      return { transaction, customer }
    },
    [transactionId],
    'Falha ao carregar transação',
  )

  if (loading && !data) return <Loading />

  if (error || !data) {
    return (
      <div className="page">
        <ErrorBox message={error ?? 'Transação não encontrada'} onRetry={() => reload()} />
        <Link to="/transacoes" className="link self-start text-sm font-semibold text-accent">
          ← Voltar para transações
        </Link>
      </div>
    )
  }

  const { transaction: t, customer } = data

  return (
    <div className="page items-center">
      <div className="flex w-full max-w-xl items-center justify-between gap-3 print:hidden">
        <Link to="/transacoes" className="link text-sm font-semibold text-accent">
          ← Voltar para transações
        </Link>
        <button type="button" className="btn" onClick={() => window.print()}>
          <IconPrinter size={16} />
          Imprimir comprovante
        </button>
      </div>

      <article className="card w-full max-w-xl overflow-hidden print:max-w-none print:rounded-none print:border-none print:shadow-none">
        <header className="flex items-center justify-between gap-4 border-b border-border bg-green-50 px-7 py-5">
          <img src="/eco-logo.png" alt="EcoControl" className="h-14 w-auto" />
          <div className="text-right text-xs text-muted">
            <p className="text-sm font-bold text-ink">Comprovante de pesagem</p>
            <p className="mono">Transação #{t.id}</p>
            <p>Emitido em {dateTime(new Date().toISOString())}</p>
          </div>
        </header>

        {company && (
          <div className="border-b border-border px-7 py-4 text-xs text-muted">
            <p className="text-sm font-semibold text-ink">{company.legal_name ?? company.trade_name}</p>
            {companyLines(company).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-5 px-7 py-6">
          <div className="flex items-center justify-between">
            <span className={`tag ${t.transaction_type === 'compra' ? 'tone-green' : 'tone-dark'}`}>
              {transactionTypeLabels[t.transaction_type]} de material
            </span>
            <span className="mono text-sm text-muted">{dateOnly(t.transacted_at)}</span>
          </div>

          <div>
            <p className="lbl">Cliente</p>
            <p className="text-base font-semibold text-ink">{t.customer_name}</p>
            <p className="text-sm text-muted">
              {[customer.document, customer.phone, customer.email].filter(Boolean).join(' · ') || '—'}
            </p>
          </div>

          <div className="table-wrap overflow-hidden rounded-[10px] border border-border">
            <table>
              <thead>
                <tr>
                  <th>Material</th>
                  <th className="right">Peso</th>
                  <th className="right">Preço</th>
                  <th className="right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-semibold">{t.material_name}</td>
                  <td className="mono right">
                    {decimal(t.weight)} {t.material_unit}
                  </td>
                  <td className="mono right">{brl(t.unit_price)}</td>
                  <td className="mono right pos">{brl(t.total_amount)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="margin-box">
            <span className="lbl">Valor total</span>
            <strong className="mono pos text-xl">{brl(t.total_amount)}</strong>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="lbl">Forma de pagamento</p>
              <p className="text-ink">
                {t.payment_method ? paymentMethodName(t.payment_method, t.payment_method_name) : 'Não informado'}
              </p>
            </div>
            <div>
              <p className="lbl">Status</p>
              <p className="text-ink">
                {paymentStatusLabels[t.payment_status]}
                {t.installments ? ` em ${t.installments}x` : ''}
              </p>
            </div>
          </div>

          {t.notes && (
            <div>
              <p className="lbl">Observações</p>
              <p className="text-sm text-ink">{t.notes}</p>
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-6 pt-6 text-center text-xs text-muted">
            <div className="border-t border-border pt-2">Assinatura do cliente</div>
            <div className="border-t border-border pt-2">Assinatura {company?.trade_name ?? 'EcoControl'}</div>
          </div>
        </div>
      </article>
    </div>
  )
}

/** Issuer details for the receipt header; blank fields are left out. */
function companyLines(company: Company) {
  const join = (...parts: (string | null)[]) => parts.filter(Boolean).join(' · ')
  const street = [company.street, company.number].filter(Boolean).join(', ')
  const city = [company.city, company.state].filter(Boolean).join('/')
  const license = company.license_number
    ? `Licença ambiental ${company.license_number}${company.license_agency ? ` (${company.license_agency})` : ''}${
        company.license_expires_at ? `, válida até ${dateOnly(company.license_expires_at)}` : ''
      }`
    : null
  return [
    join(company.legal_name && company.trade_name, company.cnpj && `CNPJ ${company.cnpj}`, company.state_registration && `IE ${company.state_registration}`),
    join(street, company.neighborhood, city, company.zip_code && `CEP ${company.zip_code}`),
    join(company.phone, company.email),
    license,
  ].filter((line): line is string => Boolean(line))
}
